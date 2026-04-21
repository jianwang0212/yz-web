import fs from 'node:fs/promises';
import path from 'node:path';
import { list, put } from '@vercel/blob';

const LOCAL_ROOT = path.join(process.cwd(), 'data', 'codex-monitor');
const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const IS_VERCEL_RUNTIME = Boolean(process.env.VERCEL);
const HISTORY_LIMIT = 576;

function slugify(value) {
  return String(value || 'macbookpro')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'macbookpro';
}

function machineRoot(machineId) {
  return `codex-monitor/machines/${machineId}`;
}

function latestBlobPath(machineId) {
  return `${machineRoot(machineId)}/latest.json`;
}

function historyBlobPath(machineId) {
  return `${machineRoot(machineId)}/history.json`;
}

function latestLocalPath(machineId) {
  return path.join(LOCAL_ROOT, 'machines', machineId, 'latest.json');
}

function historyLocalPath(machineId) {
  return path.join(LOCAL_ROOT, 'machines', machineId, 'history.json');
}

async function ensureLocalDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readLocalJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeLocalJson(filePath, value) {
  await ensureLocalDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

async function findBlobByPath(pathname) {
  const page = await list({
    prefix: pathname,
    limit: 50
  });
  return page.blobs.find((blob) => blob.pathname === pathname) ?? null;
}

async function readBlobJson(pathname, fallback = null) {
  const blob = await findBlobByPath(pathname);
  if (!blob) {
    return fallback;
  }
  const response = await fetch(`${blob.url}?v=${Date.now()}`, {
    headers: {
      'cache-control': 'no-cache'
    }
  });
  if (!response.ok) {
    return fallback;
  }
  return await response.json();
}

async function writeBlobJson(pathname, value) {
  return await put(pathname, JSON.stringify(value, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json'
  });
}

async function readJson(kind, machineId, fallback = null) {
  if (IS_VERCEL_RUNTIME && !USE_BLOB) {
    return fallback;
  }
  const pathname = kind === 'latest' ? latestBlobPath(machineId) : historyBlobPath(machineId);
  const localPath = kind === 'latest' ? latestLocalPath(machineId) : historyLocalPath(machineId);
  return USE_BLOB ? await readBlobJson(pathname, fallback) : await readLocalJson(localPath, fallback);
}

async function writeJson(kind, machineId, value) {
  if (IS_VERCEL_RUNTIME && !USE_BLOB) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required in Vercel production for Codex monitor sync');
  }
  const pathname = kind === 'latest' ? latestBlobPath(machineId) : historyBlobPath(machineId);
  const localPath = kind === 'latest' ? latestLocalPath(machineId) : historyLocalPath(machineId);
  return USE_BLOB ? await writeBlobJson(pathname, value) : await writeLocalJson(localPath, value);
}

function syncStatusFromTimestamp(timestamp) {
  const syncedAt = new Date(timestamp).getTime();
  if (!Number.isFinite(syncedAt)) {
    return 'offline';
  }
  const ageMs = Date.now() - syncedAt;
  if (ageMs <= 10 * 60 * 1000) {
    return 'online';
  }
  if (ageMs <= 30 * 60 * 1000) {
    return 'stale';
  }
  return 'offline';
}

export async function writeMonitorSnapshot(snapshot) {
  const machineId = slugify(snapshot?.machine?.id ?? snapshot?.machine?.name);
  const syncedAt = snapshot?.syncedAt ?? new Date().toISOString();
  const latest = {
    ...snapshot,
    machine: {
      id: machineId,
      name: snapshot?.machine?.name ?? 'MacBookPro',
      label: snapshot?.machine?.label ?? `本地 ${snapshot?.machine?.name ?? 'MacBookPro'}`
    },
    syncedAt,
    receivedAt: new Date().toISOString()
  };
  const previousHistory = await readJson('history', machineId, []);
  const history = Array.isArray(previousHistory) ? previousHistory : [];
  const point = {
    timestamp: syncedAt,
    cpu: Number(snapshot?.summary?.cpu ?? 0),
    memoryBytes: Number(snapshot?.summary?.memoryBytes ?? 0),
    totalTokens: Number(snapshot?.summary?.totalTokens ?? 0),
    todayTokens: Number(snapshot?.summary?.todayTokens ?? 0),
    activeAgents: Number(snapshot?.summary?.activeAgents ?? 0),
    estimatedCostUsd: Number(snapshot?.summary?.estimatedCostUsd ?? 0)
  };
  const trimmedHistory = [...history.filter((item) => item?.timestamp !== point.timestamp), point].slice(-HISTORY_LIMIT);

  await writeJson('latest', machineId, latest);
  await writeJson('history', machineId, trimmedHistory);

  return {
    machineId,
    historyCount: trimmedHistory.length,
    storage: USE_BLOB ? 'vercel_blob' : 'local_file'
  };
}

export async function listMonitorMachines() {
  if (USE_BLOB) {
    const page = await list({
      prefix: 'codex-monitor/machines/',
      limit: 500
    });
    const latestRefs = page.blobs.filter((blob) => blob.pathname.endsWith('/latest.json'));
    const machines = await Promise.all(
      latestRefs.map(async (blob) => {
        const latest = await fetch(`${blob.url}?v=${Date.now()}`, {
          headers: { 'cache-control': 'no-cache' }
        }).then((response) => (response.ok ? response.json() : null));
        return latest;
      })
    );
    return machines
      .filter(Boolean)
      .map((machine) => ({
        ...machine,
        syncStatus: syncStatusFromTimestamp(machine.syncedAt),
        syncAgeSeconds: Math.max(0, Math.round((Date.now() - new Date(machine.syncedAt).getTime()) / 1000))
      }))
      .sort((left, right) => String(right.syncedAt ?? '').localeCompare(String(left.syncedAt ?? '')));
  }

  const machinesRoot = path.join(LOCAL_ROOT, 'machines');
  try {
    const machineIds = await fs.readdir(machinesRoot);
    const machines = await Promise.all(machineIds.map((machineId) => readLocalJson(latestLocalPath(machineId), null)));
    return machines
      .filter(Boolean)
      .map((machine) => ({
        ...machine,
        syncStatus: syncStatusFromTimestamp(machine.syncedAt),
        syncAgeSeconds: Math.max(0, Math.round((Date.now() - new Date(machine.syncedAt).getTime()) / 1000))
      }))
      .sort((left, right) => String(right.syncedAt ?? '').localeCompare(String(left.syncedAt ?? '')));
  } catch {
    return [];
  }
}

export async function readMonitorMachine(machineId) {
  const slug = slugify(machineId);
  const latest = await readJson('latest', slug, null);
  if (!latest) {
    return null;
  }
  const history = Array.isArray((await readJson('history', slug, []))) ? await readJson('history', slug, []) : [];
  return {
    ...latest,
    history,
    syncStatus: syncStatusFromTimestamp(latest.syncedAt),
    syncAgeSeconds: Math.max(0, Math.round((Date.now() - new Date(latest.syncedAt).getTime()) / 1000))
  };
}

export { slugify, syncStatusFromTimestamp };
