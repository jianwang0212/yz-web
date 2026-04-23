import { loadPublishLedger } from './socialpulse-ledger.js';
import { getPublicReadStatuses } from './socialpulse-public-read.js';
import { writeSocialPulseSnapshot } from './socialpulse-snapshot-store.js';

function compareByTimestampDesc(left, right) {
  return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
}

function buildObservedRecords(status, syncedAt) {
  const items = Array.isArray(status?.recentItems) ? status.recentItems.slice(0, 3) : [];

  return items
    .filter((item) => item?.title)
    .map((item, index) => ({
      id: `observed-${status.platform}-${item.id ?? `${syncedAt}-${index}`}`,
      packageId: 'public_observed',
      platform: status.platform,
      status: 'published',
      timestamp: item.publishedAt ?? syncedAt,
      summary:
        '已抓到最新公开内容。 / Latest public content was observed from the scheduled snapshot sync.',
      notes: status.currentFinding ?? null,
      postUrl: item.url ?? status.exampleUrl ?? null,
      postLabel: null,
      titleUsed: item.title,
      assetFilesUsed: [],
      captionUsed: item.summary ?? null,
      source: 'history'
    }));
}

function mergeObservedRecords(ledger, publicReadStatuses, syncedAt) {
  const mergedLedger = structuredClone(ledger);

  for (const status of publicReadStatuses) {
    const observedRecords = buildObservedRecords(status, syncedAt);

    if (observedRecords.length === 0) {
      continue;
    }

    const existing = Array.isArray(mergedLedger.recordsByPlatform?.[status.platform])
      ? mergedLedger.recordsByPlatform[status.platform]
      : [];

    const filtered = existing.filter((record) => !String(record.id).startsWith('observed-'));
    mergedLedger.recordsByPlatform[status.platform] = [...observedRecords, ...filtered]
      .sort(compareByTimestampDesc)
      .slice(0, 12);
  }

  mergedLedger.loadError = null;
  return mergedLedger;
}

export async function syncSocialPulseSnapshot() {
  const ledger = await loadPublishLedger();
  const publicReadStatuses = await getPublicReadStatuses(ledger);

  const syncedAt = new Date().toISOString();
  const mergedLedger = mergeObservedRecords(ledger, publicReadStatuses, syncedAt);
  const writeResult = await writeSocialPulseSnapshot({
    syncedAt,
    ledger: mergedLedger,
    publicReadStatuses,
    liveBaseUrl: 'manifest://yz-web-work/data/publish_manifest.json'
  });

  return {
    syncedAt,
    snapshotId: writeResult.id,
    dbPath: writeResult.dbPath,
    platforms: publicReadStatuses.map((status) => ({
      platform: status.platform,
      availability: status.availability,
      latestTitle: status.latestTitle
    }))
  };
}
