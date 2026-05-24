import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const zappRoot = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : detectSourceRoot();
const dataDir = path.join(sourceRoot, "data");
const exportsDir = path.join(dataDir, "exports");
const momentsDbPath = path.join(dataDir, "friend_moments.sqlite");
const outputPath = path.join(zappRoot, "apps", "moments-memory-data.json");
const mediaOutputDir = path.join(zappRoot, "apps", "moments-memory-media");

if (!fs.existsSync(momentsDbPath)) {
  throw new Error(`Moments DB not found: ${momentsDbPath}`);
}

const manifest = loadManifest();
const manifestByWxid = new Map(manifest.map((item, index) => [item.username, { ...item, order: index + 1 }]));
const db = new Database(momentsDbPath, { readonly: true });

resetDir(mediaOutputDir);

const contactsRows = db
  .prepare("SELECT wxid, display_name, nickname, region, scraped_at, coverage_note FROM contacts")
  .all();
const momentsRows = db
  .prepare(
    `
    SELECT id, wxid, contact_display, date, year, month, kind, categories,
           media_count, location, caption, text, raw, source,
           suspicious_accessibility_merge
    FROM moments
    ORDER BY COALESCE(date, '') DESC
    `,
  )
  .all();
const mediaCacheRows = tableExists(db, "media_cache")
  ? db
      .prepare(
        `
        SELECT wxid, local_path, media_type, bucket, size_bytes, sha1
        FROM media_cache
        ORDER BY CASE bucket WHEN 'full_images' THEN 0 WHEN 'thumbs' THEN 1 ELSE 2 END, local_path
        `,
      )
      .all()
  : [];
const linkRows = tableExists(db, "moment_links")
  ? db
      .prepare(
        `
        SELECT moment_id, wxid, contact_display, date, title, url, confidence, source
        FROM moment_links
        ORDER BY COALESCE(date, '') DESC
        `,
      )
      .all()
  : [];

const linksByMoment = groupBy(linkRows, "moment_id");
const momentsByWxid = groupBy(momentsRows, "wxid");
const mediaCacheByWxid = groupBy(mediaCacheRows, "wxid");
const contactsByWxid = new Map(contactsRows.map((row) => [row.wxid, row]));

const contactIds = unique([
  ...manifest.map((item) => item.username),
  ...contactsRows.map((item) => item.wxid),
]);

const contacts = contactIds.map((wxid, index) => {
  const manifestItem = manifestByWxid.get(wxid) || {};
  const row = contactsByWxid.get(wxid) || {};
  const id = slug(manifestItem.slug || wxid || row.display_name || `contact-${index + 1}`);
  const moments = (momentsByWxid.get(wxid) || []).map((moment) => normalizeMoment(moment, id));
  const dates = moments.map((item) => item.date).filter(Boolean).sort();
  const categoryCounts = countCategories(moments);
  const kindCounts = countBy(moments, "kind");
  const mediaBundle = buildMediaBundle(wxid, id, manifestItem);
  const links = buildContactLinks(moments);
  const status = row.scraped_at ? (moments.length ? "done" : "blank") : "pending";
  return {
    id,
    wxid,
    rank: manifestItem.rank || index + 1,
    name: row.display_name || manifestItem.display_name || wxid,
    nickname: row.nickname || "",
    region: row.region || "",
    method: manifestItem.method || manifestItem.reason || "",
    status,
    scrapedAt: row.scraped_at || manifestItem.last_scraped_at || "",
    coverageNote: row.coverage_note || "",
    count: moments.length,
    mediaCount: moments.reduce((sum, item) => sum + Number(item.mediaCount || 0), 0),
    cacheFileCount: mediaBundle.cacheFileCount,
    mediaPreviewCount: mediaBundle.previews.length,
    mediaBytes: mediaBundle.bytes,
    year2026Count: moments.filter((item) => item.year === 2026).length,
    visibleStart: dates[0] || "",
    visibleEnd: dates.at(-1) || "",
    topCategories: Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 8),
    kindCounts,
    resolvedLinkCount: links.filter((item) => item.url).length,
    missingLinkCount: links.filter((item) => !item.url).length,
    links: links.slice(0, 8),
    mediaPreviews: mediaBundle.previews,
    allMoments: moments,
    moments: moments.slice(0, 20),
  };
});

contacts.sort((a, b) => a.rank - b.rank || b.count - a.count || String(b.visibleEnd).localeCompare(String(a.visibleEnd)));

const allMoments = contacts.flatMap((contact) => contact.allMoments);
allMoments.sort((a, b) => String(b.date).localeCompare(String(a.date)));
for (const contact of contacts) delete contact.allMoments;

const dates = allMoments.map((item) => item.date).filter(Boolean).sort();
const payload = {
  meta: {
    build: "2026.05.24.2",
    generatedAt: new Date().toISOString(),
    source: "wechatDatabase friend_moments.sqlite + pilot manifest",
    sourceRoot,
    contactCount: contacts.length,
    doneCount: contacts.filter((item) => item.status === "done").length,
    blankCount: contacts.filter((item) => item.status === "blank").length,
    pendingCount: contacts.filter((item) => item.status === "pending").length,
    momentCount: allMoments.length,
    mediaCount: allMoments.reduce((sum, item) => sum + Number(item.mediaCount || 0), 0),
    cacheFileCount: contacts.reduce((sum, item) => sum + Number(item.cacheFileCount || 0), 0),
    mediaPreviewCount: contacts.reduce((sum, item) => sum + Number(item.mediaPreviewCount || 0), 0),
    linkCount: contacts.reduce((sum, item) => sum + item.resolvedLinkCount + item.missingLinkCount, 0),
    resolvedLinkCount: contacts.reduce((sum, item) => sum + item.resolvedLinkCount, 0),
    missingLinkCount: contacts.reduce((sum, item) => sum + item.missingLinkCount, 0),
    year2026Count: allMoments.filter((item) => item.year === 2026).length,
    visibleStart: dates[0] || "",
    visibleEnd: dates.at(-1) || "",
  },
  contacts,
  months: monthBuckets(allMoments),
  moments: allMoments,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
console.log(`${contacts.length} contacts, ${allMoments.length} moments, ${payload.meta.mediaPreviewCount} previews`);

function detectSourceRoot() {
  const candidates = [
    "/Users/ziyin/Code/CodexWorkspace/projects/wechatDatabase",
    "/Users/Zi/Code/CodexWorkspace/projects/wechatDatabase",
  ];
  const found = candidates.find((item) => fs.existsSync(path.join(item, "data", "friend_moments.sqlite")));
  return found || candidates[0];
}

function loadManifest() {
  const exact = path.join(exportsDir, "moments_pilot_10_20260524_142818.json");
  const manifestPath = fs.existsSync(exact)
    ? exact
    : fs
        .readdirSync(exportsDir)
        .filter((name) => /^moments_pilot_10_.*\.json$/.test(name))
        .sort()
        .map((name) => path.join(exportsDir, name))
        .at(-1);
  if (!manifestPath) return [];
  const payload = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return Array.isArray(payload) ? payload : payload.contacts || payload.targets || [];
}

function tableExists(database, table) {
  return Boolean(database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table));
}

function normalizeMoment(row, contactId) {
  const links = (linksByMoment.get(row.id) || []).map((item) => ({
    title: clean(item.title || row.caption || row.text || item.url),
    url: item.url,
    confidence: item.confidence || "",
  }));
  const text = clean(row.caption || row.text || row.raw || "");
  const kind = row.kind || "未知";
  return {
    id: row.id,
    contactId,
    wxid: row.wxid,
    contactName: row.contact_display,
    date: row.date || "",
    year: Number(row.year || String(row.date || "").slice(0, 4) || 0),
    month: String(row.date || "").slice(0, 7),
    kind,
    text,
    location: row.location || "",
    categories: parseCategories(row.categories),
    mediaCount: Number(row.media_count || 0),
    dateConfidence: row.date_confidence || "",
    source: row.source || "",
    links,
    linkMissing: kind.includes("链接") && links.length === 0,
  };
}

function buildMediaBundle(wxid, contactId, manifestItem) {
  const candidates = [];
  const cacheRows = mediaCacheByWxid.get(wxid) || [];
  for (const row of cacheRows) {
    if (!isImage(row.local_path)) continue;
    const src = path.isAbsolute(row.local_path) ? row.local_path : path.join(sourceRoot, row.local_path);
    candidates.push({ src, bucket: row.bucket || "cache", size: Number(row.size_bytes || 0) });
  }
  const mediaDir = manifestItem.media_dir ? path.join(sourceRoot, manifestItem.media_dir) : "";
  const folderFiles = mediaDir ? collectMediaFolder(mediaDir) : [];
  candidates.push(...folderFiles);

  const seen = new Set();
  const copied = [];
  const countedFiles = cacheRows.length ? cacheRows : folderFiles;
  const cacheFileCount = countedFiles.length;
  const bytes = countedFiles.reduce((sum, item) => {
    const src = item.src || (item.local_path && (path.isAbsolute(item.local_path) ? item.local_path : path.join(sourceRoot, item.local_path)));
    return src && fs.existsSync(src) ? sum + fs.statSync(src).size : sum + Number(item.size_bytes || 0);
  }, 0);

  for (const item of candidates) {
    if (!fs.existsSync(item.src) || !isImage(item.src)) continue;
    const digest = fileHash(item.src).slice(0, 14);
    if (seen.has(digest)) continue;
    seen.add(digest);
    const ext = path.extname(item.src).toLowerCase() || ".jpg";
    const destRel = path.posix.join("moments-memory-media", contactId, `${digest}${ext}`);
    const dest = path.join(zappRoot, "apps", destRel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(item.src, dest);
    copied.push({
      src: destRel,
      bucket: item.bucket || "folder",
      size: fs.statSync(item.src).size,
    });
    if (copied.length >= 8) break;
  }

  return { previews: copied, cacheFileCount, bytes };
}

function collectMediaFolder(mediaDir) {
  if (!fs.existsSync(mediaDir)) return [];
  const output = [];
  const buckets = ["full_images", "thumbs", "raw", "videos"];
  for (const bucket of buckets) {
    const folder = path.join(mediaDir, bucket);
    if (!fs.existsSync(folder)) continue;
    for (const name of fs.readdirSync(folder).sort()) {
      if (name.startsWith(".marker")) continue;
      const src = path.join(folder, name);
      if (fs.statSync(src).isFile()) output.push({ src, bucket, size: fs.statSync(src).size });
    }
  }
  for (const name of fs.readdirSync(mediaDir).sort()) {
    if (name.startsWith(".marker")) continue;
    const src = path.join(mediaDir, name);
    if (fs.statSync(src).isFile()) output.push({ src, bucket: "root", size: fs.statSync(src).size });
  }
  return output;
}

function buildContactLinks(moments) {
  const links = [];
  const seen = new Set();
  for (const item of moments) {
    if (item.links.length) {
      for (const link of item.links) {
        const key = `${item.date}|${link.url || link.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ date: item.date, title: link.title || item.text, url: link.url, confidence: link.confidence });
      }
    } else if (item.linkMissing) {
      const key = `${item.date}|missing|${linkTitle(item.text)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ date: item.date, title: linkTitle(item.text), url: "", confidence: "missing_url" });
    }
  }
  return links.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function linkTitle(text) {
  const compact = clean(text);
  for (const marker of ["一个链接：", "一个链接,", "一个链接，", "一个链接", " / "]) {
    if (compact.includes(marker)) return clean(compact.split(marker).at(-1)).slice(0, 90);
  }
  return compact.slice(0, 90);
}

function parseCategories(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function countCategories(items) {
  const counts = {};
  for (const item of items) {
    for (const category of item.categories || []) counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) counts[item[key] || "未知"] = (counts[item[key] || "未知"] || 0) + 1;
  return counts;
}

function monthBuckets(items) {
  const counts = {};
  for (const item of items) {
    if (!item.month) continue;
    counts[item.month] = (counts[item.month] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slug(value) {
  return String(value || "contact")
    .toLowerCase()
    .replace(/[^a-z0-9_\u4e00-\u9fa5-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row);
  }
  return map;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isImage(filePath) {
  return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(path.extname(filePath).toLowerCase());
}

function fileHash(filePath) {
  return crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
