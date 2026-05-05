import { loadPublishLedger } from './socialpulse-ledger.js';
import { SOCIALPULSE_PUBLIC_CONFIG } from './platform-config.js';

function normalizeWhitespace(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max = 180) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return null;
  }

  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

function titleFromCaption(value) {
  if (!value) {
    return null;
  }

  const lines = String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const cleaned = line
      .replace(/^title:\s*/i, '')
      .replace(/^body:\s*/i, '')
      .trim();

    if (!cleaned) {
      continue;
    }

    if (/^english[:：]?$/i.test(cleaned) || /^caption[:：]?$/i.test(cleaned)) {
      continue;
    }

    return cleaned.length > 96 ? `${cleaned.slice(0, 95)}…` : cleaned;
  }

  return null;
}

function titleFromRecord(record) {
  return (
    record.titleUsed ??
    titleFromCaption(record.captionUsed) ??
    titleFromCaption(record.summary) ??
    '未命名内容 / Untitled content'
  );
}

function summaryFromRecord(record) {
  return truncate(record.captionUsed ?? record.notes ?? record.summary);
}

function recentItemsFromRecords(records) {
  return records.slice(0, 3).map((record) => ({
    id: `${record.id}-manifest-item`,
    title: titleFromRecord(record),
    summary: summaryFromRecord(record),
    url: record.postUrl ?? null,
    publishedAt: record.timestamp ?? null,
    source: 'manifest_fallback'
  }));
}

export async function getPublicReadStatuses(ledgerInput = null) {
  const ledger = ledgerInput ?? (await loadPublishLedger());

  return Object.entries(SOCIALPULSE_PUBLIC_CONFIG).map(([platform, config]) => {
    const records = ledger.recordsByPlatform?.[platform] ?? [];
    const recentItems = recentItemsFromRecords(records);
    const latestItem = recentItems[0] ?? null;

    return {
      platform,
      title: config.title,
      identifierLabel: config.identifierLabel,
      identifierValue: config.identifierValue,
      availability: config.availability,
      summary: config.summary,
      currentFinding: config.currentFinding,
      requirements: ['以发布清单为准。 / Uses the publish manifest as the source of truth.'],
      exampleUrl: config.exampleUrl,
      latestTitle: latestItem?.title ?? null,
      latestSummary: latestItem?.summary ?? null,
      recentItems
    };
  });
}
