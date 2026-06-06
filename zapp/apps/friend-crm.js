const DATA_URL = "friend-crm-data.json?v=20260604perf1";
const DESKTOP_CARD_BATCH_SIZE = 24;
const MOBILE_CARD_BATCH_SIZE = 8;
const DESKTOP_TABLE_BATCH_SIZE = 48;
const MOBILE_TABLE_BATCH_SIZE = 8;
const RELATED_RENDER_LIMIT = 80;
const SEARCH_DEBOUNCE_MS = 120;
const COMPACT_MEDIA_QUERY = "(max-width: 640px)";
const compactMedia = window.matchMedia(COMPACT_MEDIA_QUERY);

const state = {
  data: null,
  profileById: new Map(),
  quickFilters: [],
  topCounts: { tag: [], theme: [] },
  query: "",
  queryTimer: 0,
  mbti: "all",
  relation: null,
  sort: "priority",
  visibleCards: currentCardBatchSize(),
  visibleRows: currentTableBatchSize(),
};

const els = {
  dataBadge: document.querySelector("#dataBadge"),
  statusPanel: document.querySelector("#statusPanel"),
  dataStatus: document.querySelector("#dataStatus"),
  summaryGrid: document.querySelector("#summaryGrid"),
  reportPanel: document.querySelector("#reportPanel"),
  signalPanel: document.querySelector("#signalPanel"),
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
  cardMorePanel: document.querySelector("#cardMorePanel"),
  loadMoreCards: document.querySelector("#loadMoreCards"),
  tablePanel: document.querySelector("#tablePanel"),
  profileRows: document.querySelector("#profileRows"),
  rowMorePanel: document.querySelector("#rowMorePanel"),
  loadMoreRows: document.querySelector("#loadMoreRows"),
  profileCount: document.querySelector("#profileCount"),
  tagMatchCount: document.querySelector("#tagMatchCount"),
  followupCount: document.querySelector("#followupCount"),
  remarkCount: document.querySelector("#remarkCount"),
  signalCount: document.querySelector("#signalCount"),
  mbtiCount: document.querySelector("#mbtiCount"),
  socialCount: document.querySelector("#socialCount"),
  reportMeta: document.querySelector("#reportMeta"),
  reportSource: document.querySelector("#reportSource"),
  signalMeta: document.querySelector("#signalMeta"),
  signalSource: document.querySelector("#signalSource"),
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
  if (compactMedia.addEventListener) {
    compactMedia.addEventListener("change", handleCompactLayoutChange);
  } else if (compactMedia.addListener) {
    compactMedia.addListener(handleCompactLayoutChange);
  }

  els.searchInput.addEventListener("input", scheduleQueryRender);
  els.searchInput.addEventListener("search", scheduleQueryRender);
  els.searchInput.addEventListener("change", scheduleQueryRender);

  els.mbtiFilter.addEventListener("change", () => {
    state.mbti = els.mbtiFilter.value;
    resetProfileWindow();
    renderProfiles();
  });

  els.sortFilter.addEventListener("change", () => {
    state.sort = els.sortFilter.value;
    resetProfileWindow();
    renderProfiles();
    renderRelatedPanel();
  });

  els.loadMoreCards.addEventListener("click", () => {
    state.visibleCards += currentCardBatchSize();
    renderProfiles();
  });

  els.loadMoreRows.addEventListener("click", () => {
    state.visibleRows += currentTableBatchSize();
    renderProfiles();
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
    prepareData();
    state.profileById = new Map(state.data.profiles.map((profile) => [profile.id, profile]));
    els.statusPanel.classList.add("hidden");
    els.summaryGrid.classList.remove("hidden");
    els.reportPanel.classList.remove("hidden");
    els.signalPanel.classList.remove("hidden");
    els.explorePanel.classList.remove("hidden");
    els.controlPanel.classList.remove("hidden");
    els.profileGrid.classList.remove("hidden");
    els.tablePanel.classList.remove("hidden");
    renderDataBadge();
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

function scheduleQueryRender() {
  clearTimeout(state.queryTimer);
  state.queryTimer = window.setTimeout(() => {
    state.query = normalizeSearchText(els.searchInput.value.trim());
    resetProfileWindow();
    renderProfiles();
  }, SEARCH_DEBOUNCE_MS);
}

function prepareData() {
  for (const profile of state.data.profiles) {
    profile.searchText = profileHaystack(profile);
    profile.sortName = displayName(profile);
  }
  state.quickFilters = buildQuickFilters();
  state.topCounts = {
    tag: buildTopInsightCounts("tag"),
    theme: buildTopInsightCounts("theme"),
  };
}

function renderSummary() {
  const meta = state.data.meta;
  els.profileCount.textContent = formatNumber(meta.profileCount);
  els.tagMatchCount.textContent = `${formatNumber(meta.tagMatchedProfileCount)}/${formatNumber(meta.profileCount)}`;
  els.followupCount.textContent = formatNumber(meta.needsFollowupCount);
  els.remarkCount.textContent = `${formatNumber(meta.remarkAppliedCount)}/${formatNumber(meta.profileCount)}`;
  els.signalCount.textContent = `${formatNumber(meta.signalMatchedProfileCount)}/${formatNumber(meta.signalContactCount)}`;
  els.mbtiCount.textContent = formatNumber(meta.mbtiCount);
  els.socialCount.textContent = formatNumber(meta.socialCount);
  els.reportMeta.textContent = `${formatNumber(meta.tagInsightCount)} 个标签联系人 · 最新互动 ${formatDateTime(
    meta.tagLatestActivityAt,
  )}`;
  els.reportSource.textContent = `${formatDateTime(meta.tagAnalysisGeneratedAt)} · ${formatNumber(
    meta.highConfidenceInsightCount,
  )} high confidence`;
  els.signalMeta.textContent = `${formatNumber(meta.signalContactCount)} 个私聊联系人 · CRM 匹配 ${formatNumber(
    meta.signalMatchedProfileCount,
  )} · 最新文本 ${formatDateTime(meta.signalLatestMessageAt)}`;
  els.signalSource.textContent = formatSignalSource(meta.signalSourceDb);
}

function renderProfiles() {
  const profiles = sortProfiles(filteredProfiles());
  const relationSuffix = state.relation ? ` · ${state.relation.label}` : "";
  const cardProfiles = profiles.slice(0, state.visibleCards);
  const rowProfiles = profiles.slice(0, state.visibleRows);
  els.tableCount.textContent = `${formatNumber(profiles.length)} / ${formatNumber(
    state.data.profiles.length,
  )}${relationSuffix} · 卡片 ${formatNumber(cardProfiles.length)} · 表格 ${formatNumber(rowProfiles.length)}`;
  els.profileGrid.replaceChildren(...cardProfiles.map(profileCard));
  els.profileRows.replaceChildren(...rowProfiles.map(profileRow));
  updateLoadMoreControls(profiles.length, cardProfiles.length, rowProfiles.length);
}

function filteredProfiles() {
  return state.data.profiles.filter((profile) => {
    const matchesMbti = state.mbti === "all" || profile.mbti === state.mbti;
    const matchesQuery = !state.query || profile.searchText.includes(state.query);
    const matchesRelation = !state.relation || profileMatchesRelation(profile, state.relation);
    return matchesMbti && matchesQuery && matchesRelation;
  });
}

function renderExplorePanel() {
  els.quickFilters.replaceChildren(
    ...state.quickFilters.map(([type, value, label, count]) => chip(type, value, label, count)),
  );
  els.topTags.replaceChildren(
    ...topInsightCounts("tag", isCompactLayout() ? 10 : 16).map(({ label, count }) => chip("tag", label, label, count)),
  );
  els.topThemes.replaceChildren(
    ...topInsightCounts("theme", isCompactLayout() ? 8 : 12).map(({ label, count }) =>
      chip("theme", label, label, count),
    ),
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
    const visibleProfiles = missingProfiles.slice(0, RELATED_RENDER_LIMIT);
    els.relatedPanel.classList.remove("hidden");
    els.relatedType.textContent = "Data Quality";
    els.relatedTitle.textContent = state.relation.label;
    els.relatedCount.textContent = `${formatNumber(missingProfiles.length)} 人`;
    els.relatedMeta.textContent = `这些结构化 CRM 联系人还没有匹配到 05-24 标签分析。${visibleLimitText(
      missingProfiles.length,
      visibleProfiles.length,
    )}`;
    els.relatedList.replaceChildren(...visibleProfiles.map(relatedProfileItem));
    return;
  }

  const related = relatedInsights(state.relation);
  const visibleRelated = related.slice(0, RELATED_RENDER_LIMIT);
  const crmCount = related.filter((insight) => insight.crmProfileId).length;
  els.relatedPanel.classList.remove("hidden");
  els.relatedType.textContent = relationTypeLabel(state.relation.type);
  els.relatedTitle.textContent = state.relation.label;
  els.relatedCount.textContent = `${formatNumber(related.length)} 人`;
  els.relatedMeta.textContent = `${formatNumber(crmCount)} 人已入 CRM · ${formatNumber(
    related.length - crmCount,
  )} 人来自 05-24 标签分析${visibleLimitText(related.length, visibleRelated.length)}`;
  els.relatedList.replaceChildren(...visibleRelated.map(relatedItem));
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
  resetProfileWindow();
  renderExplorePanel();
  renderProfiles();
  renderRelatedPanel();
  els.relatedPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearRelation() {
  state.relation = null;
  resetProfileWindow();
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
  return (state.topCounts[kind] || []).slice(0, limit);
}

function buildQuickFilters() {
  const insights = state.data.tagInsights || [];
  const profileCount = state.data.profiles.length;
  return [
    ["flag", "needsFollowup", "需跟进", insights.filter((insight) => insight.needsFollowup).length],
    ["flag", "recentActive", "最近活跃", insights.filter((insight) => insight.recentActive).length],
    ["flag", "highInteraction", "高互动", insights.filter((insight) => insight.highInteraction).length],
    ["flag", "important", "重要/亲密", insights.filter((insight) => insight.important).length],
    ["flag", "notInCrm", "未入 CRM", insights.filter((insight) => !insight.crmProfileId).length],
    ["flag", "missingInsight", "缺标签分析", profileCount - state.data.meta.tagMatchedProfileCount],
  ];
}

function buildTopInsightCounts(kind) {
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
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"));
}

function sortProfiles(profiles) {
  return [...profiles].sort(
    (a, b) => compareInsights(a.tagInsight, b.tagInsight) || a.sortName.localeCompare(b.sortName, "zh-CN"),
  );
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
  return normalizeSearchText(
    [
      profile.originalDisplayName,
      profile.chineseName,
      profile.englishName,
      profile.preferredName,
      (profile.locations || []).join(" "),
      profile.occupation,
      profile.mbti,
      profile.wechatRemark,
      ...(profile.tagInsight?.recommendedTags || []),
      ...(profile.tagInsight?.crmLabels || []),
      ...(profile.tagInsight?.recommendationReasons || []),
      ...(profile.tagInsight?.themes || []).map((theme) => theme.theme),
      profile.signalInsight?.readFirst,
      profile.signalInsight?.evidenceLevel,
      ...Object.entries(profile.socialIds || {}).flat(),
    ]
      .join(" "),
  );
}

function resetProfileWindow() {
  state.visibleCards = currentCardBatchSize();
  state.visibleRows = currentTableBatchSize();
}

function updateLoadMoreControls(total, visibleCards, visibleRows) {
  const cardBatchSize = currentCardBatchSize();
  const tableBatchSize = currentTableBatchSize();
  const remainingCards = Math.max(total - visibleCards, 0);
  const remainingRows = Math.max(total - visibleRows, 0);
  els.cardMorePanel.classList.toggle("hidden", remainingCards === 0);
  els.rowMorePanel.classList.toggle("hidden", remainingRows === 0);
  if (remainingCards) {
    els.loadMoreCards.textContent = `再显示 ${formatNumber(Math.min(cardBatchSize, remainingCards))} 个联系人`;
  }
  if (remainingRows) {
    els.loadMoreRows.textContent = `再显示 ${formatNumber(Math.min(tableBatchSize, remainingRows))} 行`;
  }
}

function visibleLimitText(total, visible) {
  return total > visible ? ` · 当前先显示 ${formatNumber(visible)} 人` : "";
}

function normalizeSearchText(value) {
  return String(value || "").toLocaleLowerCase("zh-CN");
}

function isCompactLayout() {
  return compactMedia.matches;
}

function currentCardBatchSize() {
  return isCompactLayout() ? MOBILE_CARD_BATCH_SIZE : DESKTOP_CARD_BATCH_SIZE;
}

function currentTableBatchSize() {
  return isCompactLayout() ? MOBILE_TABLE_BATCH_SIZE : DESKTOP_TABLE_BATCH_SIZE;
}

function handleCompactLayoutChange() {
  resetProfileWindow();
  if (!state.data) return;
  renderDataBadge();
  renderExplorePanel();
  renderProfiles();
  renderRelatedPanel();
}

function renderDataBadge() {
  const meta = state.data.meta;
  els.dataBadge.textContent = isCompactLayout()
    ? `${formatNumber(meta.profileCount)} · ${formatNumber(meta.tagInsightCount)}`
    : `${formatNumber(meta.profileCount)} CRM · ${formatNumber(meta.tagInsightCount)} tags`;
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
      <dt>信号</dt>
      <dd>${signalBlock(profile.signalInsight || profile.tagInsight?.signalInsight)}</dd>
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
    <td data-label="姓名">${escapeHtml(displayName(profile))}</td>
    <td data-label="地点">${escapeHtml(joinOrEmpty(profile.locations))}</td>
    <td data-label="职业">${escapeHtml(profile.occupation || "未提供")}</td>
    <td data-label="MBTI">${escapeHtml(profile.mbti || "未提供")}</td>
    <td data-label="标签">${tagText(profile.tagInsight?.recommendedTags)}</td>
    <td data-label="信号">${signalText(profile.signalInsight || profile.tagInsight?.signalInsight)}</td>
    <td data-label="互动">${escapeHtml(interactionText(profile.tagInsight))}</td>
    <td data-label="社交">${socialText(profile.socialIds)}</td>
    <td data-label="备注">${escapeHtml(profile.wechatRemark || "未设置")}</td>
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
  const visibleEntries = entries.slice(0, isCompactLayout() ? 1 : entries.length);
  const hiddenCount = entries.length - visibleEntries.length;
  return `<span class="pill-row">${visibleEntries
    .map(([platform, id]) => `<i class="pill">${escapeHtml(platform)}: ${escapeHtml(String(id))}</i>`)
    .join("")}${hiddenCount ? `<i class="pill">+${formatNumber(hiddenCount)}</i>` : ""}</span>`;
}

function socialText(socialIds) {
  const entries = Object.entries(socialIds || {});
  if (!entries.length) return "未提供";
  return entries.map(([platform, id]) => `${escapeHtml(platform)}: ${escapeHtml(String(id))}`).join("; ");
}

function tagPills(tags) {
  const visibleTags = (tags || []).slice(0, isCompactLayout() ? 3 : 8);
  if (!visibleTags.length) return `<span class="empty">暂无匹配</span>`;
  return `<span class="pill-row">${visibleTags
    .map((tag) => relationButton("tag", tag, tag, "pill signal"))
    .join("")}</span>`;
}

function themePills(themes) {
  const visibleThemes = (themes || [])
    .filter((theme) => theme.hits > 0)
    .slice(0, isCompactLayout() ? 2 : 3);
  if (!visibleThemes.length) return `<span class="empty">暂无主题</span>`;
  return `<span class="pill-row">${visibleThemes
    .map((theme) => relationButton("theme", theme.theme, `${theme.theme} ${formatNumber(theme.hits)}`, "pill"))
    .join("")}</span>`;
}

function reasonBlock(insight) {
  const reasons = (insight?.recommendationReasons || []).slice(0, isCompactLayout() ? 1 : 3);
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
  return `<span class="table-chip-row">${tags
    .slice(0, isCompactLayout() ? 4 : 6)
    .map((tag) => relationButton("tag", tag, tag, "table-chip"))
    .join("")}</span>`;
}

function relatedItem(insight) {
  const profile = insight.crmProfileId ? state.profileById.get(insight.crmProfileId) : null;
  const signal = profile?.signalInsight || insight.signalInsight;
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
      ${signal ? `<span>证据 #${formatNumber(signal.indexRank)} · ${formatNumber(signal.evidenceScore)}</span>` : ""}
    </div>
    <div class="pill-row">${(insight.recommendedTags || [])
      .slice(0, isCompactLayout() ? 4 : 7)
      .map((tag) => relationButton("tag", tag, tag, "pill signal"))
      .join("")}</div>
    <div class="pill-row">${(insight.themes || [])
      .filter((theme) => theme.hits > 0)
      .slice(0, isCompactLayout() ? 2 : 4)
      .map((theme) => relationButton("theme", theme.theme, `${theme.theme} ${formatNumber(theme.hits)}`, "pill"))
      .join("")}</div>
    ${signalLink(signal)}
    ${reasonBlock(insight)}
  `;
  return item;
}

function relatedProfileItem(profile) {
  const signal = profile.signalInsight;
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
      ${signal ? `<span>证据 #${formatNumber(signal.indexRank)} · ${formatNumber(signal.evidenceScore)}</span>` : ""}
    </div>
    ${signalLink(signal)}
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

function signalBlock(signal) {
  if (!signal) return `<span class="empty">暂无报告</span>`;
  if (isCompactLayout()) {
    return `
      <span class="metric-line">#${formatNumber(signal.indexRank)} · ${formatNumber(signal.evidenceScore)} · ${escapeHtml(
        signal.evidenceLevel,
      )}</span>
      ${signalLink(signal)}
    `;
  }
  return `
    <span class="metric-line">#${formatNumber(signal.indexRank)} · 总证据 ${formatNumber(signal.evidenceScore)} · ${escapeHtml(
      signal.evidenceLevel,
    )}</span>
    <span class="metric-line">${escapeHtml(signal.readFirst || "先看证据")} · ${formatNumber(
      signal.total,
    )} 条 · ${formatNumber(signal.activeDays)} 天</span>
    ${signalLink(signal)}
  `;
}

function signalText(signal) {
  if (!signal) return "暂无报告";
  return `<a class="text-link" href="${escapeHtml(signal.reportUrl)}">#${formatNumber(signal.indexRank)} / ${formatNumber(
    signal.evidenceScore,
  )} / ${escapeHtml(signal.evidenceLevel)}</a>`;
}

function signalLink(signal) {
  if (!signal?.reportUrl) return "";
  return `<a class="mini-link" href="${escapeHtml(signal.reportUrl)}">打开信号报告</a>`;
}

function formatSignalSource(value) {
  if (!value) return "05-24 signal";
  return String(value).replace(/^wechat_memory_/, "wechat · ").replace(/_message0.*$/, "");
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
