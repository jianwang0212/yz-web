#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const zappRoot = resolve(scriptDir, "..");

const defaults = {
  db: "/Users/ziyin/Code/CodexWorkspace/projects/wechatDatabase/data/wechat_memory.sqlite",
  tagReport: "/Users/ziyin/Code/CodexWorkspace/reports/wechat_contact_tag_recommendations_20260524_125813.json",
  output: resolve(zappRoot, "apps/friend-crm-data.json"),
};

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const dbPath = args.get("--db") || defaults.db;
const tagReportPath = args.get("--tag-report") || defaults.tagReport;
const outputPath = resolve(args.get("--output") || defaults.output);

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function queryProfiles(db) {
  const sql = `
    SELECT
      id,
      wechat_username,
      wechat_display_name,
      chinese_name,
      english_name,
      preferred_name,
      locations_json,
      occupation,
      mbti,
      social_ids_json,
      remark_text,
      remark_applied,
      remark_applied_at,
      source_observed_at,
      privacy_scope,
      updated_at
    FROM friend_crm_profiles
    ORDER BY id;
  `;
  const raw = execFileSync("sqlite3", ["-json", db, sql], { encoding: "utf8" });
  return JSON.parse(raw).map((row) => ({
    id: row.id,
    sourceUsername: row.wechat_username || "",
    originalDisplayName: row.wechat_display_name || "",
    chineseName: row.chinese_name || "",
    englishName: row.english_name || "",
    preferredName: row.preferred_name || row.english_name || row.chinese_name || "",
    locations: parseJson(row.locations_json, []),
    occupation: row.occupation || "",
    mbti: row.mbti || "",
    socialIds: parseJson(row.social_ids_json, {}),
    wechatRemark: row.remark_text || "",
    remarkApplied: Boolean(row.remark_applied),
    remarkAppliedAt: row.remark_applied_at || "",
    observedAt: row.source_observed_at || "",
    updatedAt: row.updated_at || "",
    privacyScope: row.privacy_scope || "private_only_not_public_not_commercial",
  }));
}

function uniqueStrings(values) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizeThemes(themes) {
  return (themes || []).slice(0, 5).map((theme) => ({
    theme: theme.theme || "",
    hits: Number(theme.hits || 0),
    keywords: (theme.keywords || []).slice(0, 5).map(([keyword, count]) => [String(keyword), Number(count || 0)]),
  }));
}

function normalizeInsight(contact) {
  const recommendedTags = uniqueStrings(contact.recommended_tags);
  return {
    username: contact.username || "",
    crmProfileId: contact.crm_profile_id || null,
    displayName: contact.display_name || contact.remark || contact.nickname || "",
    remark: contact.remark || "",
    nickname: contact.nickname || "",
    alias: contact.alias || "",
    messageCount: Number(contact.message_count || 0),
    effectiveMessageCount: Number(contact.effective_message_count || 0),
    outgoingMessages: Number(contact.outgoing_messages || 0),
    incomingMessages: Number(contact.incoming_messages || 0),
    activeDays: Number(contact.active_days || 0),
    activeMonths: Number(contact.active_months || 0),
    firstAt: contact.first_at || "",
    lastAt: contact.last_at || "",
    lastNonCrmAt: contact.last_non_crm_at || "",
    lastDirection: contact.last_direction || "",
    lastNonCrmDirection: contact.last_non_crm_direction || "",
    importanceScore: Number(contact.importance_score || 0),
    priorityScore: Number(contact.priority_score || 0),
    confidence: contact.confidence || "",
    rawLocation: contact.raw_location || {},
    crmLabels: uniqueStrings(contact.crm_labels),
    recommendedTags,
    recommendationReasons: uniqueStrings(contact.recommendation_reasons).slice(0, 6),
    themes: normalizeThemes(contact.themes),
    needsFollowup: recommendedTags.includes("需跟进"),
    highInteraction: recommendedTags.includes("高互动"),
    recentActive: recommendedTags.includes("最近活跃"),
    important: recommendedTags.includes("重要联系人") || recommendedTags.includes("亲密朋友候选"),
  };
}

function maxString(values) {
  return values.filter(Boolean).sort().at(-1) || "";
}

function buildPayload(profiles, tagReport) {
  const insights = (tagReport.contacts || []).map(normalizeInsight);
  const insightsByProfileId = new Map(
    insights.filter((insight) => insight.crmProfileId).map((insight) => [insight.crmProfileId, insight]),
  );
  const enrichedProfiles = profiles.map((profile) => ({
    ...profile,
    tagInsight: insightsByProfileId.get(profile.id) || null,
  }));
  const matchedProfileCount = enrichedProfiles.filter((profile) => profile.tagInsight).length;
  const topRecommendedLabels = (tagReport.recommended_label_counts || [])
    .slice(0, 40)
    .map(([label, count]) => ({ label, count }));

  return {
    meta: {
      title: "WeChat Friend CRM",
      generatedAt: new Date().toISOString(),
      profileCount: enrichedProfiles.length,
      mbtiCount: enrichedProfiles.filter((profile) => profile.mbti).length,
      socialCount: enrichedProfiles.filter((profile) => Object.keys(profile.socialIds).length > 0).length,
      remarkAppliedCount: enrichedProfiles.filter((profile) => profile.remarkApplied).length,
      crmProfileSourceUpdatedAt: maxString(enrichedProfiles.map((profile) => profile.updatedAt)),
      tagAnalysisGeneratedAt: tagReport.generated_at || "",
      tagAnalysisReport: basename(tagReportPath),
      tagInsightCount: insights.length,
      tagMatchedProfileCount: matchedProfileCount,
      tagLatestActivityAt: maxString(insights.map((insight) => insight.lastNonCrmAt || insight.lastAt)),
      needsFollowupCount: insights.filter((insight) => insight.needsFollowup).length,
      highConfidenceInsightCount: insights.filter((insight) => insight.confidence === "high").length,
      currentContactUniverseCount: tagReport.summary?.current_contact_universe_count || null,
      privacyScope: "public_zapp_json_at_user_request",
      sourceNote: "CRM profiles are enriched with aggregate-only May 24 tag recommendations; no raw chat snippets are included.",
    },
    tagSummary: {
      generatedAt: tagReport.generated_at || "",
      source: {
        messageDb: basename(tagReport.source?.message_db || ""),
        contactDb: basename(tagReport.source?.contact_db || ""),
        crmDb: basename(tagReport.source?.crm_db || ""),
      },
      summary: tagReport.summary || {},
      topRecommendedLabels,
    },
    profiles: enrichedProfiles,
    tagInsights: insights,
  };
}

if (!existsSync(dbPath)) throw new Error(`Missing CRM database: ${dbPath}`);
if (!existsSync(tagReportPath)) throw new Error(`Missing tag report JSON: ${tagReportPath}`);

const profiles = queryProfiles(dbPath);
const tagReport = JSON.parse(readFileSync(tagReportPath, "utf8"));
const payload = buildPayload(profiles, tagReport);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${payload.meta.profileCount} CRM profiles -> ${outputPath}`);
console.log(
  `Merged ${payload.meta.tagInsightCount} tag insights; matched ${payload.meta.tagMatchedProfileCount} CRM profiles`,
);
