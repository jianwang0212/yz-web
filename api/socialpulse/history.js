import { readSocialPulseHistory, socialPulseDbPath } from '../_lib/socialpulse-snapshot-store.js';
import { endOptions, requireMethod, sendJson, setCors } from '../_lib/http.js';

export default async function handler(req, res) {
  setCors(res);

  if (endOptions(req, res) || !requireMethod(req, res, 'GET')) {
    return;
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
