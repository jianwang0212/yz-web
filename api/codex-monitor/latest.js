import { listMonitorMachines, readMonitorMachine, slugify } from '../_lib/codex-monitor-store.js';

const AGENT_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;

function sendJson(res, status, value) {
  res.status(status).json(value);
}

function isUsefulAgent(agent) {
  const haystack = [agent?.processName, agent?.sessionTitle, agent?.workspaceLabel].filter(Boolean).join(' ');
  return !/skycomputeruseclient/i.test(haystack);
}

function bestConfidence(current, next) {
  const rank = {
    high: 3,
    medium: 2,
    low: 1
  };
  return (rank[next] ?? 0) > (rank[current] ?? 0) ? next : current;
}

function filterDisplayAgents(agents) {
  if (!Array.isArray(agents)) {
    return [];
  }

  return agents
    .filter(isUsefulAgent)
    .sort((left, right) => {
      const cpuDiff = Number(right?.cpu ?? 0) - Number(left?.cpu ?? 0);
      if (cpuDiff !== 0) {
        return cpuDiff;
      }
      return Number(right?.memoryBytes ?? 0) - Number(left?.memoryBytes ?? 0);
    });
}

function buildAgentHighlights(latest) {
  const windowStart = Date.now() - AGENT_ACTIVITY_WINDOW_MS;
  const points = Array.isArray(latest?.history) ? latest.history : [];
  const recentPoints = points.filter((point) => new Date(point?.timestamp ?? '').getTime() >= windowStart);
  const bucket = new Map();
  let sawHistoryAgents = false;

  const addAgents = (agents, timestamp) => {
    if (!Array.isArray(agents) || !timestamp) {
      return;
    }

    agents.filter(isUsefulAgent).forEach((agent) => {
      const key = agent?.sessionId || [agent?.sessionTitle, agent?.workspaceLabel, agent?.processName, agent?.agentId].filter(Boolean).join('|');
      if (!key) {
        return;
      }

      const current = bucket.get(key) ?? {
        key,
        agentId: agent?.agentId ?? null,
        sessionId: agent?.sessionId ?? null,
        sessionTitle: agent?.sessionTitle ?? null,
        processName: agent?.processName ?? null,
        workspaceLabel: agent?.workspaceLabel ?? null,
        snapshots: 0,
        cpuTotal: 0,
        peakCpu: 0,
        peakMemoryBytes: 0,
        confidence: agent?.confidence ?? 'low',
        status: agent?.status ?? 'unknown',
        lastSeenAt: timestamp
      };

      current.snapshots += 1;
      current.cpuTotal += Number(agent?.cpu ?? 0);
      current.peakCpu = Math.max(current.peakCpu, Number(agent?.cpu ?? 0));
      current.peakMemoryBytes = Math.max(current.peakMemoryBytes, Number(agent?.memoryBytes ?? 0));
      current.lastSeenAt = String(current.lastSeenAt) > String(timestamp) ? current.lastSeenAt : timestamp;
      current.confidence = bestConfidence(current.confidence, agent?.confidence);
      current.status = agent?.status ?? current.status;
      bucket.set(key, current);
    });
  };

  recentPoints.forEach((point) => {
    if (Array.isArray(point?.agents) && point.agents.length > 0) {
      sawHistoryAgents = true;
      addAgents(point.agents, point.timestamp);
    }
  });

  const latestTimestamp = latest?.syncedAt;
  if (latestTimestamp && (!sawHistoryAgents || !recentPoints.some((point) => point?.timestamp === latestTimestamp && Array.isArray(point?.agents) && point.agents.length > 0))) {
    addAgents(latest?.agents, latestTimestamp);
  }

  return Array.from(bucket.values())
    .map((agent) => ({
      agentId: agent.agentId,
      sessionId: agent.sessionId,
      sessionTitle: agent.sessionTitle,
      processName: agent.processName,
      workspaceLabel: agent.workspaceLabel,
      status: agent.status,
      confidence: agent.confidence,
      snapshots: agent.snapshots,
      approxActiveMinutes: agent.snapshots * 5,
      avgCpu: agent.snapshots > 0 ? agent.cpuTotal / agent.snapshots : 0,
      peakCpu: agent.peakCpu,
      peakMemoryBytes: agent.peakMemoryBytes,
      lastSeenAt: agent.lastSeenAt
    }))
    .sort((left, right) => {
      if (right.snapshots !== left.snapshots) {
        return right.snapshots - left.snapshots;
      }
      if (right.avgCpu !== left.avgCpu) {
        return right.avgCpu - left.avgCpu;
      }
      return right.peakMemoryBytes - left.peakMemoryBytes;
    })
    .slice(0, 6);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const machineQuery = String(req.query.machine ?? '').trim();
    const requestedSlug = machineQuery ? slugify(machineQuery) : null;
    const allMachines = await listMonitorMachines();
    const selectedMachine = requestedSlug
      ? allMachines.find((machine) => slugify(machine?.machine?.id ?? machine?.machine?.name) === requestedSlug) ?? null
      : allMachines[0] ?? null;
    const latest = requestedSlug
      ? await readMonitorMachine(selectedMachine?.machine?.id ?? requestedSlug)
      : selectedMachine
        ? await readMonitorMachine(selectedMachine.machine.id)
        : null;

    const machineMap = new Map(
      allMachines.map((machine) => [
        machine?.machine?.id,
        machine
      ]).filter(([machineId]) => Boolean(machineId))
    );

    if (latest?.machine?.id && !machineMap.has(latest.machine.id)) {
      machineMap.set(latest.machine.id, {
        machine: latest.machine,
        syncedAt: latest.syncedAt,
        syncStatus: latest.syncStatus,
        syncAgeSeconds: latest.syncAgeSeconds,
        summary: latest.summary
      });
    }

    const mergedMachines = Array.from(machineMap.values()).sort((left, right) =>
      String(right?.syncedAt ?? '').localeCompare(String(left?.syncedAt ?? ''))
    );

    if (mergedMachines.length === 0) {
      return sendJson(res, 200, {
        ok: true,
        machines: [],
        requestedMachine: requestedSlug,
        latest: null
      });
    }

    const displayAgents = filterDisplayAgents(latest?.agents);
    const enrichedLatest = latest
      ? {
          ...latest,
          agents: displayAgents,
          agentHighlights: buildAgentHighlights({
            ...latest,
            agents: displayAgents
          }),
          summary: {
            ...latest.summary,
            visibleActiveAgents: displayAgents.length
          }
        }
      : null;

    return sendJson(res, 200, {
      ok: true,
      requestedMachine: requestedSlug,
      machines: mergedMachines.map((machine) => ({
        id: machine.machine.id,
        name: machine.machine.name,
        label: machine.machine.label,
        syncedAt: machine.syncedAt,
        syncStatus: machine.syncStatus,
        syncAgeSeconds: machine.syncAgeSeconds,
        summary: machine.summary
      })),
      latest: enrichedLatest
    });
  } catch (error) {
    console.error('codex monitor latest failed', error);
    return sendJson(res, 500, {
      ok: false,
      error: 'Failed to load Codex monitor data'
    });
  }
}
