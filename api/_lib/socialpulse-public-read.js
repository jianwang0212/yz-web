import { loadPublishLedger } from './socialpulse-ledger.js';

const PLATFORM_CONFIG = {
  instagram: {
    title: 'Instagram',
    identifierLabel: '公开用户名 / Public username',
    identifierValue: 'silverzigge',
    availability: 'blocked',
    summary: '当前以发布清单为准，适合作为发布检查面板。 / This is currently manifest-backed and works well for publish verification.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://www.instagram.com/silverzigge/'
  },
  zhihu: {
    title: '知乎 / Zhihu',
    identifierLabel: '主页 URL / Profile URL',
    identifierValue: 'https://www.zhihu.com/people/zi-yin-96',
    availability: 'blocked',
    summary: '知乎公开抓取不稳定，所以这里优先展示你自己的发布记录。 / Zhihu public scraping is unstable, so this panel prioritizes your own publish records.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://www.zhihu.com/people/zi-yin-96'
  },
  reddit: {
    title: 'Reddit',
    identifierLabel: '用户名 / Username',
    identifierValue: 'Mammoth-Trash-972',
    availability: 'verified',
    summary: 'Reddit 的公开链接稳定，所以这里可以直接用作发布验证。 / Reddit public links are stable, so this works well for publish verification.',
    currentFinding: '已从发布清单恢复最近内容，并保留公开链接。 / Latest content was recovered from the manifest with public links preserved.',
    exampleUrl: 'https://www.reddit.com/user/Mammoth-Trash-972/submitted/'
  },
  xiaohongshu: {
    title: '小红书 / Xiaohongshu',
    identifierLabel: '公开笔记 URL / Public note URL',
    identifierValue: 'https://www.xiaohongshu.com/explore/69e7785b000000001f002d29?type=normal&xsec_source=app_share',
    availability: 'verified',
    summary: '小红书优先用你自己的发布记录，再保留公开笔记入口。 / Xiaohongshu uses your publish records first and keeps a public note entry as reference.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://www.xiaohongshu.com/explore/69e7785b000000001f002d29?type=normal&xsec_source=app_share'
  },
  x: {
    title: 'X',
    identifierLabel: '用户名 / Username',
    identifierValue: 'thisisyzspace',
    availability: 'blocked',
    summary: 'X 目前先用发布清单做监控，再保留公开主页入口。 / X is currently monitored from the publish manifest first, with the public profile kept as a reference entry.',
    currentFinding: '已从发布清单恢复最近内容。 / Latest content was recovered from the manifest.',
    exampleUrl: 'https://x.com/thisisyzspace'
  }
};

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

  return Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
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
