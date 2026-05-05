import fs from 'node:fs/promises';
import path from 'node:path';
import { list, put } from '@vercel/blob';
import { readJsonFile, writeJsonFile } from './json-file.js';

const LOCAL_ROOT = path.join(process.cwd(), 'data', 'codex-monitor');
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const IS_VERCEL_RUNTIME = Boolean(process.env.VERCEL);
const HISTORY_LIMIT = 576;
const GITHUB_DATA_REPO = String(
  process.env.CODEX_MONITOR_GITHUB_DATA_REPO ||
  process.env.CODEX_MONITOR_GITHUB_REPO ||
  'jianwang0212/yz-web'
).trim();
const GITHUB_DATA_BRANCH = String(
  process.env.CODEX_MONITOR_GITHUB_DATA_BRANCH ||
  process.env.CODEX_MONITOR_GITHUB_BRANCH ||
  'codex-monitor-data'
).trim();
const GITHUB_DATA_BASE_PATH = String(
  process.env.CODEX_MONITOR_GITHUB_DATA_BASE_PATH ||
  process.env.CODEX_MONITOR_GITHUB_BASE_PATH ||
  'data/codex-monitor'
).trim().replace(/^\/+|\/+$/g, '');
const GITHUB_DATA_BASE_URL = (
  process.env.CODEX_MONITOR_GITHUB_DATA_BASE_URL ||
  `https://raw.githubusercontent.com/${GITHUB_DATA_REPO}/${GITHUB_DATA_BRANCH}/${GITHUB_DATA_BASE_PATH}`
).replace(/\/+$/, '');
const GITHUB_DATA_TOKEN = String(
  process.env.CODEX_MONITOR_GITHUB_DATA_TOKEN ||
  process.env.CODEX_MONITOR_GITHUB_TOKEN ||
  ''
).trim();

function slugify(value) {
  return String(value || 'macbookpro')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'macbookpro';
}

function machineRoot(machineId) {
  return `codex-monitor/machines/${machineId}`;
}

function latestBlobPath(machineId) {
  return `${machineRoot(machineId)}/latest.json`;
}

function historyBlobPath(machineId) {
  return `${machineRoot(machineId)}/history.json`;
}

function latestLocalPath(machineId) {
  return path.join(LOCAL_ROOT, 'machines', machineId, 'latest.json');
}

function historyLocalPath(machineId) {
  return path.join(LOCAL_ROOT, 'machines', machineId, 'history.json');
}

async function findBlobByPath(pathname) {
  const page = await list({
    prefix: pathname,
    limit: 50
  });
  return page.blobs.find((blob) => blob.pathname === pathname) ?? null;
}

async function readBlobJson(pathname, fallback = null) {
  const blob = await findBlobByPath(pathname);
  if (!blob) {
    return fallback;
  }
  const response = await fetch(`${blob.url}?v=${Date.now()}`, {
    headers: {
      'cache-control': 'no-cache'
    }
  });
  if (!response.ok) {
    return fallback;
  }
  return await response.json();
}

function githubHeaders({ accept } = {}) {
  const headers = {
    'cache-control': 'no-cache',
    'user-agent': 'thisisyz-codex-monitor'
  };

  if (accept) {
    headers.accept = accept;
  }

  if (GITHUB_DATA_TOKEN) {
    headers.authorization = `Bearer ${GITHUB_DATA_TOKEN}`;
  }

  return headers;
}

function githubApiPath(pathname) {
  return `https://api.github.com/repos/${GITHUB_DATA_REPO}/contents/${GITHUB_DATA_BASE_PATH}/${pathname}?ref=${encodeURIComponent(GITHUB_DATA_BRANCH)}`;
}

async function readGitHubJson(pathname, fallback = null) {
  if (!GITHUB_DATA_REPO || !GITHUB_DATA_BRANCH || !GITHUB_DATA_BASE_PATH) {
    return fallback;
  }

  try {
    const response = await fetch(githubApiPath(pathname), {
      headers: githubHeaders({ accept: 'application/vnd.github+json' })
    });
    if (response.ok) {
      const payload = await response.json();
      if (typeof payload?.content === 'string' && payload.content.length > 0) {
        const content = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
        return JSON.parse(content);
      }
    }
  } catch {
    // Fall through to raw URL fallback below.
  }

  try {
    const response = await fetch(`${GITHUB_DATA_BASE_URL}/${pathname}?v=${Date.now()}`, {
      headers: {
        'cache-control': 'no-cache'
      }
    });
    if (!response.ok) {
      return fallback;
    }
    return await response.json();
  } catch {
    return fallback;
  }
}

async function readGitHubDirectory(pathname) {
  if (!GITHUB_DATA_REPO || !GITHUB_DATA_BRANCH || !GITHUB_DATA_BASE_PATH) {
    return [];
  }

  try {
    const response = await fetch(githubApiPath(pathname), {
      headers: githubHeaders({ accept: 'application/vnd.github+json' })
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}

async function writeBlobJson(pathname, value) {
  return await put(pathname, JSON.stringify(value, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json'
  });
}

async function readJson(kind, machineId, fallback = null) {
  if (IS_VERCEL_RUNTIME && !USE_BLOB) {
    return fallback;
  }
  const pathname = kind === 'latest' ? latestBlobPath(machineId) : historyBlobPath(machineId);
  const localPath = kind === 'latest' ? latestLocalPath(machineId) : historyLocalPath(machineId);
  return USE_BLOB ? await readBlobJson(pathname, fallback) : await readJsonFile(localPath, fallback);
}

async function writeJson(kind, machineId, value) {
  if (IS_VERCEL_RUNTIME && !USE_BLOB) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required in Vercel production for Codex monitor sync');
  }
  const pathname = kind === 'latest' ? latestBlobPath(machineId) : historyBlobPath(machineId);
  const localPath = kind === 'latest' ? latestLocalPath(machineId) : historyLocalPath(machineId);
  return USE_BLOB ? await writeBlobJson(pathname, value) : await writeJsonFile(localPath, value);
}

function syncStatusFromTimestamp(timestamp) {
  const syncedAt = new Date(timestamp).getTime();
  if (!Number.isFinite(syncedAt)) {
    return 'offline';
  }
  const ageMs = Date.now() - syncedAt;
  if (ageMs <= 10 * 60 * 1000) {
    return 'online';
  }
  if (ageMs <= 30 * 60 * 1000) {
    return 'stale';
  }
  return 'offline';
}

function timestampValue(timestamp) {
  const value = new Date(timestamp ?? '').getTime();
  return Number.isFinite(value) ? value : 0;
}

function normalizeMachineRecords(machines) {
  return machines
    .filter(Boolean)
    .map((machine) => ({
      ...machine,
      syncStatus: syncStatusFromTimestamp(machine.syncedAt),
      syncAgeSeconds: Math.max(0, Math.round((Date.now() - new Date(machine.syncedAt).getTime()) / 1000))
    }))
    .sort((left, right) => String(right.syncedAt ?? '').localeCompare(String(left.syncedAt ?? '')));
}

function compactHistoryAgents(agents) {
  if (!Array.isArray(agents)) {
    return [];
  }

  return agents.slice(0, 12).map((agent) => ({
    agentId: agent?.agentId ?? null,
    processName: agent?.processName ?? null,
    status: agent?.status ?? null,
    sessionId: agent?.sessionId ?? null,
    sessionTitle: agent?.sessionTitle ?? null,
    workspaceLabel: agent?.workspaceLabel ?? null,
    cpu: Number(agent?.cpu ?? 0),
    memoryBytes: Number(agent?.memoryBytes ?? 0),
    confidence: agent?.confidence ?? null
  }));
}

async function listGitHubMachineSnapshots() {
  const entries = await readGitHubDirectory('machines');
  if (entries.length === 0) {
    return [];
  }

  const machines = await Promise.all(
    entries
      .filter((entry) => entry?.type === 'dir' && entry?.name)
      .map((entry) => readGitHubJson(`machines/${entry.name}/latest.json`, null))
  );

  return normalizeMachineRecords(machines);
}

export async function writeMonitorSnapshot(snapshot) {
  const machineId = slugify(snapshot?.machine?.id ?? snapshot?.machine?.name);
  const syncedAt = snapshot?.syncedAt ?? new Date().toISOString();
  const latest = {
    ...snapshot,
    machine: {
      id: machineId,
      name: snapshot?.machine?.name ?? 'MacBookPro',
      label: snapshot?.machine?.label ?? `本地 ${snapshot?.machine?.name ?? 'MacBookPro'}`
    },
    syncedAt,
    receivedAt: new Date().toISOString()
  };
  const previousHistory = await readJson('history', machineId, []);
  const history = Array.isArray(previousHistory) ? previousHistory : [];
  const point = {
    timestamp: syncedAt,
    cpu: Number(snapshot?.summary?.cpu ?? 0),
    memoryBytes: Number(snapshot?.summary?.memoryBytes ?? 0),
    totalTokens: Number(snapshot?.summary?.totalTokens ?? 0),
    todayTokens: Number(snapshot?.summary?.todayTokens ?? 0),
    activeAgents: Number(snapshot?.summary?.activeAgents ?? 0),
    estimatedCostUsd: Number(snapshot?.summary?.estimatedCostUsd ?? 0),
    agents: compactHistoryAgents(snapshot?.agents)
  };
  const trimmedHistory = [...history.filter((item) => item?.timestamp !== point.timestamp), point].slice(-HISTORY_LIMIT);

  await writeJson('latest', machineId, latest);
  await writeJson('history', machineId, trimmedHistory);

  return {
    machineId,
    historyCount: trimmedHistory.length,
    storage: USE_BLOB ? 'vercel_blob' : 'local_file'
  };
}

export async function listMonitorMachines() {
  const machineMap = new Map();

  if (USE_BLOB) {
    try {
      const page = await list({
        prefix: 'codex-monitor/machines/',
        limit: 500
      });
      const latestRefs = page.blobs.filter((blob) => blob.pathname.endsWith('/latest.json'));
      const machines = await Promise.all(
        latestRefs.map(async (blob) => {
          const latest = await fetch(`${blob.url}?v=${Date.now()}`, {
            headers: { 'cache-control': 'no-cache' }
          }).then((response) => (response.ok ? response.json() : null));
          return latest;
        })
      );
      normalizeMachineRecords(machines).forEach((machine) => {
        const machineId = machine?.machine?.id;
        if (!machineId) {
          return;
        }
        machineMap.set(machineId, machine);
      });
    } catch {
      // Fall through to GitHub or local-file fallback below.
    }
  }

  const githubIndex = await readGitHubJson('index.json', null);
  if (Array.isArray(githubIndex?.machines) && githubIndex.machines.length > 0) {
    normalizeMachineRecords(githubIndex.machines).forEach((machine) => {
      const machineId = machine?.machine?.id;
      if (!machineId) {
        return;
      }
      const current = machineMap.get(machineId);
      if (!current || timestampValue(machine.syncedAt) >= timestampValue(current.syncedAt)) {
        machineMap.set(machineId, machine);
      }
    });
  }

  const githubMachineSnapshots = await listGitHubMachineSnapshots();
  githubMachineSnapshots.forEach((machine) => {
    const machineId = machine?.machine?.id;
    if (!machineId) {
      return;
    }
    const current = machineMap.get(machineId);
    if (!current || timestampValue(machine.syncedAt) >= timestampValue(current.syncedAt)) {
      machineMap.set(machineId, machine);
    }
  });

  if (machineMap.size > 0) {
    return Array.from(machineMap.values()).sort((left, right) => String(right.syncedAt ?? '').localeCompare(String(left.syncedAt ?? '')));
  }

  const machinesRoot = path.join(LOCAL_ROOT, 'machines');
  try {
    const machineIds = await fs.readdir(machinesRoot);
    const machines = await Promise.all(machineIds.map((machineId) => readJsonFile(latestLocalPath(machineId), null)));
    return machines
      .filter(Boolean)
      .map((machine) => ({
        ...machine,
        syncStatus: syncStatusFromTimestamp(machine.syncedAt),
        syncAgeSeconds: Math.max(0, Math.round((Date.now() - new Date(machine.syncedAt).getTime()) / 1000))
      }))
      .sort((left, right) => String(right.syncedAt ?? '').localeCompare(String(left.syncedAt ?? '')));
  } catch {
    return [];
  }
}

export async function readMonitorMachine(machineId) {
  const slug = slugify(machineId);
  const blobLatest = await readJson('latest', slug, null);
  const githubLatest = await readGitHubJson(`machines/${slug}/latest.json`, null);
  const latest =
    timestampValue(githubLatest?.syncedAt) >= timestampValue(blobLatest?.syncedAt)
      ? (githubLatest ?? blobLatest)
      : (blobLatest ?? githubLatest);
  if (!latest) {
    return null;
  }
  const blobHistory = await readJson('history', slug, null);
  const githubHistory = await readGitHubJson(`machines/${slug}/history.json`, []);
  const historySource =
    timestampValue(githubLatest?.syncedAt) >= timestampValue(blobLatest?.syncedAt) ? githubHistory : (blobHistory ?? githubHistory);
  const history = Array.isArray(historySource) ? historySource : [];
  return {
    ...latest,
    history,
    syncStatus: syncStatusFromTimestamp(latest.syncedAt),
    syncAgeSeconds: Math.max(0, Math.round((Date.now() - new Date(latest.syncedAt).getTime()) / 1000))
  };
}

export { slugify, syncStatusFromTimestamp };
