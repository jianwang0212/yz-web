import { syncSocialPulseSnapshot } from '../_lib/socialpulse-sync.js';

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
    const result = await syncSocialPulseSnapshot();
    return sendJson(res, 200, {
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('socialpulse sync failed', error);
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown sync error'
    });
  }
}
