import { promises as fs } from 'node:fs';
import path from 'node:path';

const SUPPORTED_PLATFORMS = new Set(['instagram', 'zhihu', 'reddit', 'xiaohongshu', 'x']);

const EMPTY_RECORDS = {
  instagram: [],
  zhihu: [],
  reddit: [],
  xiaohongshu: [],
  x: []
};

function manifestCandidatePaths() {
  return [
    path.resolve(process.cwd(), 'data', 'publish_manifest.json'),
    path.resolve(process.cwd(), '..', 'publish_manifest.json')
  ];
}

function normalizePlatform(value) {
  if (!value || !SUPPORTED_PLATFORMS.has(value)) {
    return null;
  }

  return value;
}

function normalizeTimestamp(value) {
  if (!value) {
    return '';
  }

  return value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
}

function normalizeStatus(value) {
  switch (value) {
    case 'published':
    case 'failed':
    case 'pending':
    case 'skipped':
      return value;
    default:
      return 'pending';
  }
}

function inferPostLabel(platform, postUrl) {
  if (!postUrl) {
    return null;
  }

  switch (platform) {
    case 'instagram':
      return 'Instagram 帖子 / Instagram post';
    case 'zhihu':
      return '知乎文章 / Zhihu article';
    case 'reddit':
      return 'Reddit 帖子 / Reddit post';
    case 'xiaohongshu':
      return '小红书笔记 / Xiaohongshu note';
    case 'x':
      return 'X 帖子 / X post';
    default:
      return null;
  }
}

function buildSummary(platform, status, postUrl, notes) {
  if (status !== 'published') {
    return status === 'failed'
      ? '发布失败，需要人工处理。 / Publish failed and needs manual follow-up.'
      : '尚未发布完成。 / Publish is not finished yet.';
  }

  if (platform === 'instagram') {
    if (notes?.toLowerCase().includes('single-image fallback')) {
      return '发布成功；单图保底已完成。 / Published successfully with a single-image fallback.';
    }

    return postUrl
      ? '发布成功；链接已抓到。 / Published successfully; URL captured.'
      : '发布成功；公开链接未抓到。 / Published successfully; public link not captured.';
  }

  if (platform === 'zhihu') {
    return postUrl
      ? '发布成功；链接是知乎文章。 / Published successfully; link captured as a Zhihu article.'
      : '发布成功；公开链接未抓到。 / Published successfully; public link not captured.';
  }

  if (platform === 'reddit') {
    return postUrl
      ? '发布成功；链接是 Reddit post。 / Published successfully; link captured as a Reddit post.'
      : '发布成功；公开链接未抓到。 / Published successfully; public link not captured.';
  }

  if (platform === 'x') {
    return postUrl
      ? '发布成功；链接是 X post。 / Published successfully; link captured as an X post.'
      : '发布成功；公开链接未抓到。 / Published successfully; public link not captured.';
  }

  if (notes?.toLowerCase().includes('success page') || notes?.toLowerCase().includes('审核中')) {
    return '发布成功；已到达成功页或审核队列。 / Published successfully; success page or review queue confirmed.';
  }

  return postUrl
    ? '发布成功；链接已抓到。 / Published successfully; URL captured.'
    : '发布成功；公开链接未抓到。 / Published successfully; public link not captured.';
}

function createRecord(packageId, source, entry) {
  const platform = normalizePlatform(entry.platform);

  if (!platform || !entry.timestamp) {
    return null;
  }

  const timestamp = normalizeTimestamp(entry.timestamp);
  const status = normalizeStatus(entry.status);
  const notes = entry.notes ?? null;
  const postUrl = entry.post_url ?? null;

  return {
    id: `${packageId}-${platform}-${timestamp}-${source}`,
    packageId,
    platform,
    status,
    timestamp,
    summary: buildSummary(platform, status, postUrl, notes),
    notes,
    postUrl,
    postLabel: inferPostLabel(platform, postUrl),
    titleUsed: entry.title_used ?? null,
    assetFilesUsed: entry.asset_files_used ?? [],
    captionUsed: entry.caption_used ?? null,
    source
  };
}

function compareRecords(left, right) {
  return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
}

export async function loadPublishLedger() {
  const candidatePaths = manifestCandidatePaths();

  try {
    let manifestPath = candidatePaths[0];
    let manifestRaw = null;

    for (const candidatePath of candidatePaths) {
      try {
        manifestRaw = await fs.readFile(candidatePath, 'utf8');
        manifestPath = candidatePath;
        break;
      } catch {
        continue;
      }
    }

    if (!manifestRaw) {
      throw new Error(`No publish manifest found in: ${candidatePaths.join(', ')}`);
    }

    const manifest = JSON.parse(manifestRaw);
    const currentPackageId = manifest.current_package?.package_id ?? null;
    const seen = new Set();
    const recordsByPlatform = {
      instagram: [],
      zhihu: [],
      reddit: [],
      xiaohongshu: [],
      x: []
    };

    const pushRecord = (record) => {
      if (!record) {
        return;
      }

      const dedupeKey = [
        record.packageId,
        record.platform,
        record.timestamp,
        record.status,
        record.postUrl ?? 'no-url'
      ].join('|');

      if (seen.has(dedupeKey)) {
        return;
      }

      seen.add(dedupeKey);
      recordsByPlatform[record.platform].push(record);
    };

    if (currentPackageId) {
      for (const entry of manifest.platforms ?? []) {
        pushRecord(createRecord(currentPackageId, 'current_package', entry));
      }
    }

    for (const historyItem of manifest.history ?? []) {
      const packageId = historyItem.package_id;

      if (!packageId) {
        continue;
      }

      for (const entry of historyItem.platforms ?? []) {
        pushRecord(createRecord(packageId, 'history', entry));
      }
    }

    for (const platform of Object.keys(recordsByPlatform)) {
      recordsByPlatform[platform].sort(compareRecords);
    }

    return {
      currentPackageId,
      manifestPath,
      recordsByPlatform,
      loadError: null
    };
  } catch (error) {
    return {
      currentPackageId: null,
      manifestPath: candidatePaths[0],
      recordsByPlatform: EMPTY_RECORDS,
      loadError: error instanceof Error ? error.message : 'Failed to load publish manifest'
    };
  }
}
