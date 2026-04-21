import { writeMonitorSnapshot } from '../_lib/codex-monitor-store.js';

function sendJson(res, status, value) {
  res.status(status).json(value);
}

function isAuthorized(req) {
  const expected = process.env.CODEX_MONITOR_INGEST_TOKEN;
  if (!expected) {
    return false;
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  return token && token === expected;
}

function isValidPayload(body) {
  return (
    body &&
    typeof body === 'object' &&
    typeof body.syncedAt === 'string' &&
    body.machine &&
    typeof body.machine === 'object' &&
    typeof body.machine.name === 'string' &&
    body.summary &&
    typeof body.summary === 'object'
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
  }

  if (!isValidPayload(req.body)) {
    return sendJson(res, 400, { ok: false, error: 'Invalid payload' });
  }

  try {
    const result = await writeMonitorSnapshot(req.body);
    return sendJson(res, 200, {
      ok: true,
      machineId: result.machineId,
      historyCount: result.historyCount,
      storage: result.storage
    });
  } catch (error) {
    console.error('codex monitor ingest failed', error);
    return sendJson(res, 500, {
      ok: false,
      error: 'Failed to store Codex monitor snapshot'
    });
  }
}
