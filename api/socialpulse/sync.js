import { syncSocialPulseSnapshot } from '../_lib/socialpulse-sync.js';
import { endOptions, requireMethod, sendJson, setCors } from '../_lib/http.js';

export default async function handler(req, res) {
  setCors(res);

  if (endOptions(req, res) || !requireMethod(req, res, 'GET')) {
    return;
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
