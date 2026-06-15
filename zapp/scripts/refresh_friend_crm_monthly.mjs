#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";

const defaults = {
  dataDir: "/Users/ziyin/Code/CodexWorkspace/projects/wechatDatabase/data",
  crmDb: "/Users/ziyin/Code/CodexWorkspace/projects/wechatDatabase/data/wechat_memory.sqlite",
  reportsDir: "/Users/ziyin/Code/CodexWorkspace/reports",
  contactDb: "",
  minMessages: "1",
};

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) continue;
  const next = process.argv[index + 1];
  if (next && !next.startsWith("--")) {
    args.set(arg, next);
    index += 1;
  } else {
    args.set(arg, "true");
  }
}

const versionTag = args.get("--version-tag") || `${new Date().toISOString().slice(0, 10).replaceAll("-", "")}signal1`;
const messageDb = resolve(args.get("--message-db") || newestMessageDb(args.get("--data-dir") || defaults.dataDir));
const crmDb = resolve(args.get("--crm-db") || defaults.crmDb);
const reportsDir = resolve(args.get("--reports-dir") || defaults.reportsDir);
const minMessages = args.get("--min-messages") || defaults.minMessages;
const deploy = args.has("--deploy");

function newestMessageDb(dataDir) {
  const candidates = readdirSync(dataDir)
    .filter((name) => /^wechat_memory.*\.sqlite$/.test(name))
    .map((name) => resolve(dataDir, name))
    .filter((path) => hasTables(path, ["messages", "conversations", "contacts"]))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (!candidates.length) throw new Error(`No readable wechat_memory*.sqlite database found in ${dataDir}`);
  return candidates[0];
}

function hasTables(dbPath, tables) {
  try {
    const quotedTables = tables.map((table) => `'${table.replaceAll("'", "''")}'`).join(",");
    const raw = execFileSync(
      "sqlite3",
      [dbPath, `select name from sqlite_master where type='table' and name in (${quotedTables});`],
      { encoding: "utf8" },
    );
    const names = new Set(raw.trim().split(/\s+/).filter(Boolean));
    return tables.every((table) => names.has(table));
  } catch {
    return false;
  }
}

function run(command, commandArgs, options = {}) {
  console.log(`$ ${[command, ...commandArgs].join(" ")}`);
  return execFileSync(command, commandArgs, { encoding: "utf8", stdio: options.stdio || "pipe" });
}

function parseJsonFromStdout(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`Command did not print JSON: ${stdout.slice(0, 500)}`);
  return JSON.parse(stdout.slice(start, end + 1));
}

if (!existsSync(messageDb)) throw new Error(`Missing message DB: ${messageDb}`);
if (!existsSync(crmDb)) throw new Error(`Missing CRM DB: ${crmDb}`);

console.log(`Monthly Friend CRM refresh`);
console.log(`Message DB: ${messageDb}`);
console.log(`CRM DB: ${crmDb}`);
console.log(`Version tag: ${versionTag}`);

const recommendArgs = [
  "/Users/ziyin/Codex/Projects/Wechat/scripts/recommend_wechat_contact_tags.py",
  "--message-db",
  messageDb,
  "--crm-db",
  crmDb,
  "--out-dir",
  reportsDir,
];
if (args.get("--contact-db") || defaults.contactDb) {
  recommendArgs.push("--contact-db", args.get("--contact-db") || defaults.contactDb);
}
const tagSummary = parseJsonFromStdout(run("python3", recommendArgs));

const taxonomyPath = run("python3", [
  "/Users/ziyin/Codex/Projects/Wechat/scripts/build_wechat_tag_taxonomy_report.py",
  "--input",
  tagSummary.json,
  "--out-dir",
  reportsDir,
]).trim();
copyFileSync(taxonomyPath, "zapp/apps/wechat_contact_tag_taxonomy_latest.html");

run(
  "python3",
  [
    "zapp/scripts/build_friend_crm_signal_reports.py",
    "--db",
    messageDb,
    "--min-messages",
    minMessages,
    "--version-tag",
    versionTag,
  ],
  { stdio: "inherit" },
);

run(
  "node",
  [
    "zapp/scripts/build_friend_crm_public_data.mjs",
    "--db",
    crmDb,
    "--tag-report",
    tagSummary.json,
    "--signal-data",
    "zapp/apps/friend-crm-signal-data.json",
  ],
  { stdio: "inherit" },
);

if (deploy) run("npm", ["run", "deploy:zapp"], { stdio: "inherit" });

console.log(
  JSON.stringify(
    {
      ok: true,
      messageDb: basename(messageDb),
      crmDb: basename(crmDb),
      tagJson: tagSummary.json,
      taxonomyHtml: taxonomyPath,
      zappTaxonomyHtml: "zapp/apps/wechat_contact_tag_taxonomy_latest.html",
      signalData: "zapp/apps/friend-crm-signal-data.json",
      crmData: "zapp/apps/friend-crm-data.json",
      versionTag,
      deployed: deploy,
    },
    null,
    2,
  ),
);
