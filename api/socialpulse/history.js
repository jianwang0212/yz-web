import { readSocialPulseHistory, socialPulseDbPath } from '../_lib/socialpulse-snapshot-store.js';

function toSerializable(value) {
  return JSON.parse(
    JSON.stringify(value, (_, nestedValue) =>
      typeof nestedValue === 'bigint' ? Number(nestedValue) : nestedValue
    )
  );
}

function sendJson(res, status, value) {
  res
    .status(status)
    .type('application/json')
    .send(JSON.stringify(toSerializable(value)));
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
    const hours = Math.max(1, Math.min(168, Number(req.query.hours ?? 24) || 24));
    const points = await readSocialPulseHistory(hours);

    return sendJson(res, 200, {
      ok: true,
      hours,
      dbPath: socialPulseDbPath(),
      points
    });
  } catch (error) {
    console.error('socialpulse history failed', error);
    return sendJson(res, 500, {
      ok: false,
      error: 'Failed to load SocialPulse history'
    });
  }
}
