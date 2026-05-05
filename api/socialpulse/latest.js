import { readPublishManifestInfo } from '../_lib/socialpulse-ledger.js';
import { readLatestSocialPulseSnapshot, socialPulseDbPath } from '../_lib/socialpulse-snapshot-store.js';
import { syncSocialPulseSnapshot } from '../_lib/socialpulse-sync.js';
import { endOptions, requireMethod, sendJson, setCors } from '../_lib/http.js';

function snapshotNeedsRefresh(snapshot, manifestInfo) {
  if (!snapshot) {
    return true;
  }

  if (!manifestInfo) {
    return false;
  }

  const snapshotPackageId = snapshot.ledger?.currentPackageId ?? null;

  if (manifestInfo.currentPackageId && manifestInfo.currentPackageId !== snapshotPackageId) {
    return true;
  }

  const snapshotTime = new Date(snapshot.syncedAt).getTime();

  if (!Number.isFinite(snapshotTime)) {
    return true;
  }

  return manifestInfo.mtimeMs > snapshotTime + 1000;
}

export default async function handler(req, res) {
  setCors(res);

  if (endOptions(req, res) || !requireMethod(req, res, 'GET')) {
    return;
  }

  try {
    const firstSnapshot = await readLatestSocialPulseSnapshot();
    const manifestInfo = await readPublishManifestInfo();

    if (snapshotNeedsRefresh(firstSnapshot, manifestInfo)) {
      await syncSocialPulseSnapshot();
    }

    const snapshot = await readLatestSocialPulseSnapshot();

    if (!snapshot) {
      return sendJson(res, 404, {
        ok: false,
        error: 'No SocialPulse snapshot available yet',
        dbPath: socialPulseDbPath()
      });
    }

    const snapshotAgeSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(snapshot.syncedAt).getTime()) / 1000)
    );

    return sendJson(res, 200, {
      ok: true,
      snapshotAgeSeconds,
      dbPath: socialPulseDbPath(),
      id: snapshot.id,
      syncedAt: snapshot.syncedAt,
      storedAt: snapshot.storedAt,
      liveBaseUrl: snapshot.liveBaseUrl,
      ledger: snapshot.ledger,
      publicReadStatuses: snapshot.publicReadStatuses
    });
  } catch (error) {
    console.error('socialpulse latest failed', error);
    return sendJson(res, 500, {
      ok: false,
      error: 'Failed to load SocialPulse snapshot'
    });
  }
}
