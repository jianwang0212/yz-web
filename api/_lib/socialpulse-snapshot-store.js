import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { SOCIALPULSE_HISTORY_PLATFORMS } from './platform-config.js';

const DATA_ROOT = path.join(process.cwd(), 'data', 'socialpulse');
const DB_PATH = path.join(DATA_ROOT, 'socialpulse.sqlite');
const SNAPSHOT_LIMIT = 2880;

function ensureDataRoot() {
  fs.mkdirSync(DATA_ROOT, { recursive: true });
}

function localDbPath() {
  ensureDataRoot();
  return DB_PATH;
}

function openDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS socialpulse_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      synced_at TEXT NOT NULL,
      ledger_json TEXT NOT NULL,
      public_read_json TEXT NOT NULL,
      live_base_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_socialpulse_snapshots_synced_at
    ON socialpulse_snapshots (synced_at DESC, id DESC);
  `);
  return db;
}

function pruneSnapshots(db) {
  db.prepare(`
    DELETE FROM socialpulse_snapshots
    WHERE id NOT IN (
      SELECT id
      FROM socialpulse_snapshots
      ORDER BY synced_at DESC, id DESC
      LIMIT ?
    )
  `).run(SNAPSHOT_LIMIT);
}

export function socialPulseDbPath() {
  return DB_PATH;
}

export async function writeSocialPulseSnapshot({
  syncedAt,
  ledger,
  publicReadStatuses,
  liveBaseUrl = null
}) {
  const dbPath = localDbPath();
  const db = openDb(dbPath);

  try {
    const info = db
      .prepare(`
        INSERT INTO socialpulse_snapshots (
          synced_at,
          ledger_json,
          public_read_json,
          live_base_url
        ) VALUES (?, ?, ?, ?)
      `)
      .run(
        syncedAt,
        JSON.stringify(ledger),
        JSON.stringify(publicReadStatuses),
        liveBaseUrl
      );

    pruneSnapshots(db);

    return {
      id: info.lastInsertRowid,
      dbPath: socialPulseDbPath()
    };
  } finally {
    if (db.open) {
      db.close();
    }
  }
}

export async function readLatestSocialPulseSnapshot() {
  const dbPath = localDbPath();
  const db = openDb(dbPath);

  try {
    const row = db
      .prepare(`
        SELECT id, synced_at, ledger_json, public_read_json, live_base_url, created_at
        FROM socialpulse_snapshots
        ORDER BY synced_at DESC, id DESC
        LIMIT 1
      `)
      .get();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      syncedAt: row.synced_at,
      storedAt: row.created_at,
      liveBaseUrl: row.live_base_url,
      ledger: JSON.parse(row.ledger_json),
      publicReadStatuses: JSON.parse(row.public_read_json)
    };
  } finally {
    db.close();
  }
}

function summarizeSnapshot(row) {
  const ledger = JSON.parse(row.ledger_json);
  const publicReadStatuses = JSON.parse(row.public_read_json);
  const platformStatusMap = Object.fromEntries(
    SOCIALPULSE_HISTORY_PLATFORMS.map((platform) => {
      const publicStatus = publicReadStatuses.find((status) => status.platform === platform) ?? null;
      const latestRecord = Array.isArray(ledger?.recordsByPlatform?.[platform])
        ? ledger.recordsByPlatform[platform][0] ?? null
        : null;

      return [
        platform,
        {
          availability: publicStatus?.availability ?? null,
          latestTitle: publicStatus?.latestTitle ?? null,
          latestPublishedAt: latestRecord?.timestamp ?? null,
          publishStatus: latestRecord?.status ?? null
        }
      ];
    })
  );

  return {
    id: row.id,
    syncedAt: row.synced_at,
    storedAt: row.created_at,
    currentPackageId: ledger?.currentPackageId ?? null,
    publishedPlatforms: Object.values(platformStatusMap).filter(
      (item) => item.publishStatus === 'published'
    ).length,
    readablePlatforms: Object.values(platformStatusMap).filter(
      (item) => item.availability === 'verified'
    ).length,
    platforms: platformStatusMap
  };
}

export async function readSocialPulseHistory(hours = 24) {
  const safeHours = Math.max(1, Math.min(168, Number(hours) || 24));
  const cutoff = new Date(Date.now() - safeHours * 60 * 60 * 1000).toISOString();
  const dbPath = localDbPath();
  const db = openDb(dbPath);

  try {
    const rows = db
      .prepare(`
        SELECT id, synced_at, ledger_json, public_read_json, created_at
        FROM socialpulse_snapshots
        WHERE synced_at >= ?
        ORDER BY synced_at ASC, id ASC
      `)
      .all(cutoff);

    return rows.map(summarizeSnapshot);
  } finally {
    db.close();
  }
}
