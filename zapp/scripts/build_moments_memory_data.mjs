import fs from "node:fs";
import path from "node:path";

const zappRoot = path.resolve(new URL("..", import.meta.url).pathname);
const sourceRoot = process.argv[2]
  ? path.resolve(process.argv[2])
  : "/Users/Zi/Code/CodexWorkspace/projects/wechatDatabase";
const reportsDir = path.join(sourceRoot, "reports");
const outputPath = path.join(zappRoot, "apps", "moments-memory-data.json");

const files = fs
  .readdirSync(reportsDir)
  .filter((name) => name.endsWith("_moments_ui_scrape.json"))
  .sort();

const contacts = [];
const allMoments = [];

for (const file of files) {
  const payload = JSON.parse(fs.readFileSync(path.join(reportsDir, file), "utf8"));
  const id = slug(file.replace("_moments_ui_scrape.json", ""));
  const items = (payload.items || [])
    .map((item) => normalizeMoment(item, payload.contact, id))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const categoryCounts = payload.category_counts || countCategories(items);
  const dates = items.map((item) => item.date).filter(Boolean).sort();
  const contact = {
    id,
    name: payload.contact?.display_name || id,
    nickname: payload.contact?.nickname || "",
    region: payload.contact?.region || "",
    coverageNote: payload.coverage_note || "",
    count: items.length,
    mediaCount: items.reduce((sum, item) => sum + Number(item.mediaCount || 0), 0),
    year2026Count: items.filter((item) => item.year === 2026).length,
    visibleStart: dates[0] || "",
    visibleEnd: dates.at(-1) || "",
    topCategories: Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 8),
    kindCounts: countBy(items, "kind"),
    moments: items.slice(0, 12),
  };
  contacts.push(contact);
  allMoments.push(...items);
}

contacts.sort((a, b) => b.count - a.count || String(b.visibleEnd).localeCompare(String(a.visibleEnd)));
allMoments.sort((a, b) => String(b.date).localeCompare(String(a.date)));

const dates = allMoments.map((item) => item.date).filter(Boolean).sort();
const payload = {
  meta: {
    build: "2026.05.13.1",
    generatedAt: new Date().toISOString(),
    source: "wechatDatabase local Moments exports",
    contactCount: contacts.length,
    momentCount: allMoments.length,
    mediaCount: allMoments.reduce((sum, item) => sum + Number(item.mediaCount || 0), 0),
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
console.log(`${contacts.length} contacts, ${allMoments.length} moments`);

function normalizeMoment(item, contact, contactId) {
  const text = clean(item.text || item.caption || item.raw || "");
  return {
    id: `${contactId}-${item.date || "unknown"}-${hash(text + item.raw)}`,
    contactId,
    contactName: contact?.display_name || contactId,
    date: item.date || "",
    year: Number(item.year || String(item.date || "").slice(0, 4) || 0),
    month: String(item.date || "").slice(0, 7),
    kind: item.kind || "未知",
    text,
    location: item.location || "",
    categories: item.categories || [],
    mediaCount: inferMediaCount(item),
    dateConfidence: item.date_confidence || "",
  };
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
  return String(value).replace(/\s+/g, " ").trim();
}

function inferMediaCount(item) {
  if (item.media_count || item.mediaCount) return Number(item.media_count || item.mediaCount || 0);
  const text = String(item.text || item.raw || "");
  const imageMatch = text.match(/(\d+)张图片/);
  if (imageMatch) return Number(imageMatch[1]);
  if (/(一段视频|视频|一个链接|链接)/.test(text) || ["视频", "链接"].includes(item.kind)) return 1;
  return 0;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9_\u4e00-\u9fa5-]+/g, "_").replace(/^_+|_+$/g, "");
}

function hash(value) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result.toString(36);
}
