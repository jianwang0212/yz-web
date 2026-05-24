const DATA_URL = "friend-crm-data.json?v=20260524explore1";

const state = {
  data: null,
  profileById: new Map(),
  query: "",
  mbti: "all",
  relation: null,
  sort: "priority",
};

const els = {
  dataBadge: document.querySelector("#dataBadge"),
  statusPanel: document.querySelector("#statusPanel"),
  dataStatus: document.querySelector("#dataStatus"),
  summaryGrid: document.querySelector("#summaryGrid"),
  reportPanel: document.querySelector("#reportPanel"),
  explorePanel: document.querySelector("#explorePanel"),
  quickFilters: document.querySelector("#quickFilters"),
  topTags: document.querySelector("#topTags"),
  topThemes: document.querySelector("#topThemes"),
  clearRelation: document.querySelector("#clearRelation"),
  relatedPanel: document.querySelector("#relatedPanel"),
  relatedType: document.querySelector("#relatedType"),
  relatedTitle: document.querySelector("#relatedTitle"),
  relatedCount: document.querySelector("#relatedCount"),
  relatedMeta: document.querySelector("#relatedMeta"),
  relatedList: document.querySelector("#relatedList"),
  controlPanel: document.querySelector("#controlPanel"),
  profileGrid: document.querySelector("#profileGrid"),
  tablePanel: document.querySelector("#tablePanel"),
  profileRows: document.querySelector("#profileRows"),
  profileCount: document.querySelector("#profileCount"),
  tagMatchCount: document.querySelector("#tagMatchCount"),
  followupCount: document.querySelector("#followupCount"),
  remarkCount: document.querySelector("#remarkCount"),
  mbtiCount: document.querySelector("#mbtiCount"),
  socialCount: document.querySelector("#socialCount"),
  reportMeta: document.querySelector("#reportMeta"),
  reportSource: document.querySelector("#reportSource"),
  searchInput: document.querySelector("#searchInput"),
  mbtiFilter: document.querySelector("#mbtiFilter"),
  sortFilter: document.querySelector("#sortFilter"),
  tableCount: document.querySelector("#tableCount"),
};

init();

async function init() {
  bindEvents();
  await loadData();
}

function bindEvents() {
  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value.trim().toLowerCase();
    renderProfiles();
  });

  els.mbtiFilter.addEventListener("change", () => {
    state.mbti = els.mbtiFilter.value;
    renderProfiles();
  });

  els.sortFilter.addEventListener("change", () => {
    state.sort = els.sortFilter.value;
    renderProfiles();
    renderRelatedPanel();
  });

  els.clearRelation.addEventListener("click", clearRelation);

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-relation-type]");
    if (!trigger) return;
    event.preventDefault();
    selectRelation(trigger.dataset.relationType, trigger.dataset.relationValue, trigger.dataset.relationLabel);
  });
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    state.profileById = new Map(state.data.profiles.map((profile) => [profile.id, profile]));
    els.statusPanel.classList.add("hidden");
    els.summaryGrid.classList.remove("hidden");
    els.reportPanel.classList.remove("hidden");
    els.explorePanel.classList.remove("hidden");
    els.controlPanel.classList.remove("hidden");
    els.profileGrid.classList.remove("hidden");
    els.tablePanel.classList.remove("hidden");
    els.dataBadge.textContent = `${formatNumber(state.data.meta.profileCount)} CRM · ${formatNumber(
      state.data.meta.tagInsightCount,
    )} tags`;
    populateMbtiFilter();
    render();
  } catch (error) {
    els.dataBadge.textContent = "Load failed";
    els.dataStatus.textContent = `联系人资料加载失败：${error.message}`;
    console.error(error);
  }
}

function populateMbtiFilter() {
  const mbtis = [...new Set(state.data.profiles.map((profile) => profile.mbti).filter(Boolean))].sort();
  els.mbtiFilter.replaceChildren(option("all", "全部 MBTI"), ...mbtis.map((mbti) => option(mbti, mbti)));
}

function option(value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  return item;
}

function render() {
  renderSummary();
  renderExplorePanel();
  renderProfiles();
  renderRelatedPanel();
}

function renderSummary() {
  const meta = state.data.meta;
  els.profileCount.textContent = formatNumber(meta.profileCount);
  els.tagMatchCount.textContent = `${formatNumber(meta.tagMatchedProfileCount)}/${formatNumber(meta.profileCount)}`;
  els.followupCount.textContent = formatNumber(meta.needsFollowupCount);
  els.remarkCount.textContent = `${formatNumber(meta.remarkAppliedCount)}/${formatNumber(meta.profileCount)}`;
  els.mbtiCount.textContent = formatNumber(meta.mbtiCount);
  els.socialCount.textContent = formatNumber(meta.socialCount);
  els.reportMeta.textContent = `${formatNumber(meta.tagInsightCount)} 个标签联系人 · 最新互动 ${formatDateTime(
    meta.tagLatestActivityAt,
  )}`;
  els.reportSource.textContent = `${formatDateTime(meta.tagAnalysisGeneratedAt)} · ${formatNumber(
    meta.highConfidenceInsightCount,
  )} high confidence`;
}

function renderProfiles() {
  const profiles = sortProfiles(filteredProfiles());
  const relationSuffix = state.relation ? ` · ${state.relation.label}` : "";
  els.tableCount.textContent = `${profiles.length} / ${state.data.profiles.length}${relationSuffix}`;
  els.profileGrid.replaceChildren(...profiles.map(profileCard));
  els.profileRows.replaceChildren(...profiles.map(profileRow));
}

function filteredProfiles() {
  return state.data.profiles.filter((profile) => {
    const matchesMbti = state.mbti === "all" || profile.mbti === state.mbti;
    const matchesQuery = !state.query || profileHaystack(profile).includes(state.query);
    const matchesRelation = !state.relation || profileMatchesRelation(profile, state.relation);
    return matchesMbti && matchesQuery && matchesRelation;
  });
}

function renderExplorePanel() {
  const insights = state.data.tagInsights || [];
  const profileCount = state.data.profiles.length;
  const quickFilters = [
    ["flag", "needsFollowup", "需跟进", insights.filter((insight) => insight.needsFollowup).length],
    ["flag", "recentActive", "最近活跃", insights.filter((insight) => insight.recentActive).length],
    ["flag", "highInteraction", "高互动", insights.filter((insight) => insight.highInteraction).length],
    ["flag", "important", "重要/亲密", insights.filter((insight) => insight.important).length],
    ["flag", "notInCrm", "未入 CRM", insights.filter((insight) => !insight.crmProfileId).length],
    ["flag", "missingInsight", "缺标签分析", profileCount - state.data.meta.tagMatchedProfileCount],
  ];
  els.quickFilters.replaceChildren(...quickFilters.map(([type, value, label, count]) => chip(type, value, label, count)));
  els.topTags.replaceChildren(...topInsightCounts("tag", 16).map(({ label, count }) => chip("tag", label, label, count)));
  els.topThemes.replaceChildren(
    ...topInsightCounts("theme", 12).map(({ label, count }) => chip("theme", label, label, count)),
  );
  els.clearRelation.classList.toggle("hidden", !state.relation);
}

function renderRelatedPanel() {
  if (!state.relation) {
    els.relatedPanel.classList.add("hidden");
    return;
  }

  if (state.relation.type === "flag" && state.relation.value === "missingInsight") {
    const missingProfiles = sortProfiles(state.data.profiles.filter((profile) => !profile.tagInsight));
    els.relatedPanel.classList.remove("hidden");
    els.relatedType.textContent = "Data Quality";
    els.relatedTitle.textContent = state.relation.label;
    els.relatedCount.textContent = `${formatNumber(missingProfiles.length)} 人`;
    els.relatedMeta.textContent = "这些结构化 CRM 联系人还没有匹配到 05-24 标签分析。";
    els.relatedList.replaceChildren(...missingProfiles.map(relatedProfileItem));
    return;
  }

  const related = relatedInsights(state.relation);
  const crmCount = related.filter((insight) => insight.crmProfileId).length;
  els.relatedPanel.classList.remove("hidden");
  els.relatedType.textContent = relationTypeLabel(state.relation.type);
  els.relatedTitle.textContent = state.relation.label;
  els.relatedCount.textContent = `${formatNumber(related.length)} 人`;
  els.relatedMeta.textContent = `${formatNumber(crmCount)} 人已入 CRM · ${formatNumber(
    related.length - crmCount,
  )} 人来自 05-24 标签分析`;
  els.relatedList.replaceChildren(...related.map(relatedItem));
}

function chip(type, value, label, count) {
  const item = document.createElement("button");
  item.className = `relation-chip${isActiveRelation(type, value) ? " active" : ""}`;
  item.type = "button";
  item.dataset.relationType = type;
  item.dataset.relationValue = value;
  item.dataset.relationLabel = label;
  item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${formatNumber(count)}</strong>`;
  return item;
}

function selectRelation(type, value, label) {
  state.relation = { type, value, label: label || value };
  renderExplorePanel();
  renderProfiles();
  renderRelatedPanel();
  els.relatedPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearRelation() {
  state.relation = null;
  renderExplorePanel();
  renderProfiles();
  renderRelatedPanel();
}

function profileMatchesRelation(profile, relation) {
  if (relation.type === "flag" && relation.value === "missingInsight") return !profile.tagInsight;
  const insight = profile.tagInsight;
  if (!insight) return false;
  return insightMatchesRelation(insight, relation);
}

function insightMatchesRelation(insight, relation) {
  if (relation.type === "tag") return insight.recommendedTags?.includes(relation.value);
  if (relation.type === "theme") return insight.themes?.some((theme) => theme.theme === relation.value && theme.hits > 0);
  if (relation.type !== "flag") return false;
  if (relation.value === "notInCrm") return !insight.crmProfileId;
  if (relation.value === "needsFollowup") return Boolean(insight.needsFollowup);
  if (relation.value === "recentActive") return Boolean(insight.recentActive);
  if (relation.value === "highInteraction") return Boolean(insight.highInteraction);
  if (relation.value === "important") return Boolean(insight.important);
  return false;
}

function relatedInsights(relation) {
  const insights = state.data.tagInsights || [];
  if (relation.type === "flag" && relation.value === "missingInsight") return [];
  return sortInsights(insights.filter((insight) => insightMatchesRelation(insight, relation)));
}

function topInsightCounts(kind, limit) {
  const counts = new Map();
  for (const insight of state.data.tagInsights || []) {
    const values =
      kind === "tag"
        ? insight.recommendedTags || []
        : (insight.themes || []).filter((theme) => theme.hits > 0).map((theme) => theme.theme);
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([label]) => label && label !== "CRM已记录")
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"))
    .slice(0, limit);
}

function sortProfiles(profiles) {
  return [...profiles].sort((a, b) => compareInsights(a.tagInsight, b.tagInsight) || displayName(a).localeCompare(displayName(b), "zh-CN"));
}

function sortInsights(insights) {
  return [...insights].sort((a, b) => compareInsights(a, b) || insightName(a).localeCompare(insightName(b), "zh-CN"));
}

function compareInsights(a, b) {
  if (state.sort === "recent") return dateValue(b?.lastNonCrmAt || b?.lastAt) - dateValue(a?.lastNonCrmAt || a?.lastAt);
  if (state.sort === "messages") return (b?.effectiveMessageCount || 0) - (a?.effectiveMessageCount || 0);
  if (state.sort === "name") return 0;
  return (b?.priorityScore || 0) - (a?.priorityScore || 0);
}

function dateValue(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isActiveRelation(type, value) {
  return state.relation?.type === type && state.relation?.value === value;
}

function relationTypeLabel(type) {
  if (type === "tag") return "Tag";
  if (type === "theme") return "Theme";
  return "View";
}

function profileHaystack(profile) {
  return [
    profile.originalDisplayName,
    profile.chineseName,
    profile.englishName,
    profile.preferredName,
    profile.locations.join(" "),
    profile.occupation,
    profile.mbti,
    profile.wechatRemark,
    ...(profile.tagInsight?.recommendedTags || []),
    ...(profile.tagInsight?.crmLabels || []),
    ...(profile.tagInsight?.recommendationReasons || []),
    ...(profile.tagInsight?.themes || []).map((theme) => theme.theme),
    ...Object.entries(profile.socialIds).flat(),
  ]
    .join(" ")
    .toLowerCase();
}

function profileCard(profile) {
  const card = document.createElement("article");
  card.className = "profile-card";
  card.innerHTML = `
    <header>
      <div>
        <span>${escapeHtml(profile.originalDisplayName || "WeChat")}</span>
        <h3>${escapeHtml(displayName(profile))}</h3>
      </div>
      <i class="pill status">${profile.remarkApplied ? "已贴备注" : "未同步"}</i>
    </header>
    <dl>
      <dt>地点</dt>
      <dd>${escapeHtml(joinOrEmpty(profile.locations))}</dd>
      <dt>职业</dt>
      <dd>${escapeHtml(profile.occupation || "未提供")}</dd>
      <dt>MBTI</dt>
      <dd>${escapeHtml(profile.mbti || "未提供")}</dd>
      <dt>社交</dt>
      <dd>${socialPills(profile.socialIds)}</dd>
      <dt>标签</dt>
      <dd>${tagPills(profile.tagInsight?.recommendedTags)}</dd>
      <dt>互动</dt>
      <dd>${interactionSummary(profile.tagInsight)}</dd>
      <dt>主题</dt>
      <dd>${themePills(profile.tagInsight?.themes)}</dd>
      <dt>备注</dt>
      <dd>${escapeHtml(profile.wechatRemark || "未设置")}</dd>
    </dl>
    ${reasonBlock(profile.tagInsight)}
  `;
  return card;
}

function profileRow(profile) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${escapeHtml(displayName(profile))}</td>
    <td>${escapeHtml(joinOrEmpty(profile.locations))}</td>
    <td>${escapeHtml(profile.occupation || "未提供")}</td>
    <td>${escapeHtml(profile.mbti || "未提供")}</td>
    <td>${tagText(profile.tagInsight?.recommendedTags)}</td>
    <td>${escapeHtml(interactionText(profile.tagInsight))}</td>
    <td>${socialText(profile.socialIds)}</td>
    <td>${escapeHtml(profile.wechatRemark || "未设置")}</td>
  `;
  return row;
}

function displayName(profile) {
  return [profile.chineseName, profile.englishName].filter(Boolean).join(" / ") || profile.preferredName || "未命名";
}

function joinOrEmpty(items) {
  return items?.length ? items.join(" / ") : "未提供";
}

function socialPills(socialIds) {
  const entries = Object.entries(socialIds || {});
  if (!entries.length) return `<span class="empty">未提供</span>`;
  return `<span class="pill-row">${entries
    .map(([platform, id]) => `<i class="pill">${escapeHtml(platform)}: ${escapeHtml(String(id))}</i>`)
    .join("")}</span>`;
}

function socialText(socialIds) {
  const entries = Object.entries(socialIds || {});
  if (!entries.length) return "未提供";
  return entries.map(([platform, id]) => `${escapeHtml(platform)}: ${escapeHtml(String(id))}`).join("; ");
}

function tagPills(tags) {
  const visibleTags = (tags || []).slice(0, 8);
  if (!visibleTags.length) return `<span class="empty">暂无匹配</span>`;
  return `<span class="pill-row">${visibleTags
    .map((tag) => relationButton("tag", tag, tag, "pill signal"))
    .join("")}</span>`;
}

function themePills(themes) {
  const visibleThemes = (themes || []).filter((theme) => theme.hits > 0).slice(0, 3);
  if (!visibleThemes.length) return `<span class="empty">暂无主题</span>`;
  return `<span class="pill-row">${visibleThemes
    .map((theme) => relationButton("theme", theme.theme, `${theme.theme} ${formatNumber(theme.hits)}`, "pill"))
    .join("")}</span>`;
}

function reasonBlock(insight) {
  const reasons = (insight?.recommendationReasons || []).slice(0, 3);
  if (!reasons.length) return "";
  return `<ul class="reason-list">${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>`;
}

function interactionSummary(insight) {
  if (!insight) return `<span class="empty">暂无 05-24 分析</span>`;
  return `
    <span class="metric-line">
      ${formatNumber(insight.effectiveMessageCount)} 条 · ${formatNumber(insight.activeMonths)} 月 · ${escapeHtml(
        insight.confidence || "unknown",
      )}
    </span>
    <span class="metric-line">最近 ${escapeHtml(formatDateTime(insight.lastNonCrmAt || insight.lastAt))}</span>
  `;
}

function interactionText(insight) {
  if (!insight) return "暂无 05-24 分析";
  return `${formatNumber(insight.effectiveMessageCount)} 条 / ${formatNumber(insight.activeMonths)} 月 / 最近 ${formatDateTime(
    insight.lastNonCrmAt || insight.lastAt,
  )}`;
}

function tagText(tags) {
  if (!tags?.length) return "暂无匹配";
  return tags
    .slice(0, 6)
    .map((tag) => relationButton("tag", tag, tag, "table-chip"))
    .join("");
}

function relatedItem(insight) {
  const profile = insight.crmProfileId ? state.profileById.get(insight.crmProfileId) : null;
  const item = document.createElement("article");
  item.className = "related-item";
  item.innerHTML = `
    <header>
      <div>
        <span>${profile ? "CRM" : "Tag Insight"}</span>
        <h3>${escapeHtml(profile ? displayName(profile) : insightName(insight))}</h3>
      </div>
      <strong>${formatNumber(insight.priorityScore)}</strong>
    </header>
    <div class="related-meta">
      <span>${formatNumber(insight.effectiveMessageCount)} 条</span>
      <span>${formatNumber(insight.activeMonths)} 月</span>
      <span>最近 ${escapeHtml(formatDateTime(insight.lastNonCrmAt || insight.lastAt))}</span>
      <span>${escapeHtml(insight.confidence || "unknown")}</span>
    </div>
    <div class="pill-row">${(insight.recommendedTags || [])
      .slice(0, 7)
      .map((tag) => relationButton("tag", tag, tag, "pill signal"))
      .join("")}</div>
    <div class="pill-row">${(insight.themes || [])
      .filter((theme) => theme.hits > 0)
      .slice(0, 4)
      .map((theme) => relationButton("theme", theme.theme, `${theme.theme} ${formatNumber(theme.hits)}`, "pill"))
      .join("")}</div>
    ${reasonBlock(insight)}
  `;
  return item;
}

function relatedProfileItem(profile) {
  const item = document.createElement("article");
  item.className = "related-item";
  item.innerHTML = `
    <header>
      <div>
        <span>CRM</span>
        <h3>${escapeHtml(displayName(profile))}</h3>
      </div>
      <strong>${profile.remarkApplied ? "已备注" : "待同步"}</strong>
    </header>
    <div class="related-meta">
      <span>${escapeHtml(joinOrEmpty(profile.locations))}</span>
      <span>${escapeHtml(profile.occupation || "未提供职业")}</span>
      <span>${escapeHtml(profile.mbti || "未提供 MBTI")}</span>
    </div>
    <p class="report-copy">${escapeHtml(profile.wechatRemark || profile.originalDisplayName || "未设置备注")}</p>
  `;
  return item;
}

function relationButton(type, value, label, className) {
  return `<button class="${className}${isActiveRelation(type, value) ? " active" : ""}" type="button" data-relation-type="${escapeHtml(
    type,
  )}" data-relation-value="${escapeHtml(value)}" data-relation-label="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
}

function insightName(insight) {
  return insight.displayName || insight.remark || insight.nickname || insight.alias || insight.username || "未命名";
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function formatDateTime(value) {
  if (!value) return "--";
  const normalized = String(value).includes("T") ? String(value) : `${value}T00:00:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
