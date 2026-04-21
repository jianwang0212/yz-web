import { listMonitorMachines, readMonitorMachine, slugify } from '../_lib/codex-monitor-store.js';

function sendJson(res, status, value) {
  res.status(status).json(value);
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
    const allMachines = await listMonitorMachines();
    if (allMachines.length === 0) {
      return sendJson(res, 200, {
        ok: true,
        machines: [],
        latest: null
      });
    }

    const fallbackMachine = allMachines[0];
    const requestedSlug = machineQuery ? slugify(machineQuery) : null;
    const selectedMachine =
      allMachines.find((machine) => slugify(machine?.machine?.id ?? machine?.machine?.name) === requestedSlug) ?? fallbackMachine;

    const latest = await readMonitorMachine(selectedMachine.machine.id);
    return sendJson(res, 200, {
      ok: true,
      machines: allMachines.map((machine) => ({
        id: machine.machine.id,
        name: machine.machine.name,
        label: machine.machine.label,
        syncedAt: machine.syncedAt,
        syncStatus: machine.syncStatus,
        syncAgeSeconds: machine.syncAgeSeconds,
        summary: machine.summary
      })),
      latest
    });
  } catch (error) {
    console.error('codex monitor latest failed', error);
    return sendJson(res, 500, {
      ok: false,
      error: 'Failed to load Codex monitor data'
    });
  }
}
