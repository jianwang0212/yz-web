const DATA_URL = "moments-memory-data.json?v=20260524b";

const state = {
  view: "overview",
  data: null,
  selectedContact: "",
  friendSearch: "",
  friendSort: "count",
  timelineSearch: "",
  contactFilter: "all",
  question: "",
};

const els = {
  dataBadge: document.querySelector("#dataBadge"),
  tabs: [...document.querySelectorAll("[data-view]")],
  views: {
    overview: document.querySelector("#overviewView"),
    friends: document.querySelector("#friendsView"),
    timeline: document.querySelector("#timelineView"),
    clues: document.querySelector("#cluesView"),
  },
  contactCount: document.querySelector("#contactCount"),
  contactMeta: document.querySelector("#contactMeta"),
  momentCount: document.querySelector("#momentCount"),
  rangeMeta: document.querySelector("#rangeMeta"),
  mediaCount: document.querySelector("#mediaCount"),
  mediaMeta: document.querySelector("#mediaMeta"),
  linkCount: document.querySelector("#linkCount"),
  linkMeta: document.querySelector("#linkMeta"),
  monthWindow: document.querySelector("#monthWindow"),
  monthChart: document.querySelector("#monthChart"),
  rankGrid: document.querySelector("#rankGrid"),
  friendSearch: document.querySelector("#friendSearch"),
  friendSort: document.querySelector("#friendSort"),
  friendList: document.querySelector("#friendList"),
  friendDetail: document.querySelector("#friendDetail"),
  timelineSearch: document.querySelector("#timelineSearch"),
  contactFilter: document.querySelector("#contactFilter"),
  timelineList: document.querySelector("#timelineList"),
  questionInput: document.querySelector("#questionInput"),
  askButton: document.querySelector("#askButton"),
  answerPanel: document.querySelector("#answerPanel"),
};

const clueGroups = {
  relationship: ["结婚", "婚礼", "领证", "订婚", "老婆", "妻子", "女友", "男友", "伴侣", "对象", "婚"],
  work: ["公司", "工作", "创业", "融资", "客户", "办公室", "产品", "项目", "商业", "开店"],
  ai: ["AI", "LLM", "Agent", "模型", "技术", "系统", "数据", "效率"],
  location: ["长沙", "成都", "香港", "北京", "上海", "新加坡", "英国", "旅行", "出差"],
  family: ["妈妈", "爸爸", "孩子", "家", "家庭", "外婆", "亲戚"],
};

init();

async function init() {
  bindEvents();
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    state.selectedContact = state.data.contacts[0]?.id || "";
    render();
  } catch (error) {
    els.dataBadge.textContent = "Load failed";
    document.querySelector(".moments-shell").insertAdjacentHTML(
      "beforeend",
      `<div class="empty-state">数据加载失败：${escapeHtml(error.message)}</div>`,
    );
  }
}

function bindEvents() {
  els.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  els.friendSearch.addEventListener("input", () => {
    state.friendSearch = els.friendSearch.value.trim().toLowerCase();
    renderFriends();
  });

  els.friendSort.addEventListener("change", () => {
    state.friendSort = els.friendSort.value;
    renderFriends();
  });

  els.timelineSearch.addEventListener("input", () => {
    state.timelineSearch = els.timelineSearch.value.trim().toLowerCase();
    renderTimeline();
  });

  els.contactFilter.addEventListener("change", () => {
    state.contactFilter = els.contactFilter.value;
    renderTimeline();
  });

  els.askButton.addEventListener("click", () => {
    state.question = els.questionInput.value.trim();
    renderAnswer();
  });

  els.questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      state.question = els.questionInput.value.trim();
      renderAnswer();
    }
  });
}

function render() {
  if (!state.data) return;
  renderShell();
  renderSummary();
  renderOverview();
  renderFriends();
  renderTimeline();
  renderAnswer();
}

function renderShell() {
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
  Object.entries(els.views).forEach(([view, section]) => section.classList.toggle("hidden", view !== state.view));
  els.dataBadge.textContent = state.data.meta.build.split(".").slice(0, 3).join(".");
}

function renderSummary() {
  const meta = state.data.meta;
  els.contactCount.textContent = formatNumber(meta.contactCount);
  els.contactMeta.textContent = `${meta.doneCount}/${meta.blankCount}/${meta.pendingCount} 完成/空白/待跑`;
  els.momentCount.textContent = formatNumber(meta.momentCount);
  els.rangeMeta.textContent = `${meta.visibleStart} - ${meta.visibleEnd}`;
  els.mediaCount.textContent = formatNumber(meta.mediaPreviewCount);
  els.mediaMeta.textContent = `${formatNumber(meta.cacheFileCount)} 缓存文件`;
  els.linkCount.textContent = `${formatNumber(meta.resolvedLinkCount)}/${formatNumber(meta.linkCount)}`;
  els.linkMeta.textContent = `${formatNumber(meta.missingLinkCount)} 条待回填`;
}

function renderOverview() {
  const months = state.data.months.slice(-18);
  const max = Math.max(...months.map((item) => item.count), 1);
  els.monthWindow.textContent = months.length ? `${months[0].month} - ${months.at(-1).month}` : "--";
  els.monthChart.replaceChildren(
    ...months.map((item) => {
      const node = document.createElement("div");
      node.className = "month-bar";
      const bar = document.createElement("i");
      bar.style.height = `${Math.max(4, (item.count / max) * 150)}px`;
      bar.title = `${item.month}: ${item.count}`;
      const label = document.createElement("span");
      label.textContent = item.month.slice(2);
      node.append(bar, label);
      return node;
    }),
  );

  els.rankGrid.replaceChildren(...state.data.contacts.map((contact) => contactCard(contact)));
}

function renderFriends() {
  const contacts = filteredContacts();
  els.friendList.replaceChildren(...contacts.map((contact) => contactCard(contact, true)));
  const selected = state.data.contacts.find((contact) => contact.id === state.selectedContact) || contacts[0] || state.data.contacts[0];
  if (selected) {
    state.selectedContact = selected.id;
    renderFriendDetail(selected);
  }
}

function renderTimeline() {
  if (!els.contactFilter.options.length) {
    els.contactFilter.replaceChildren(
      option("all", "全部好友"),
      ...state.data.contacts.map((contact) => option(contact.id, contact.name)),
    );
  }
  const rows = state.data.moments
    .filter((item) => state.contactFilter === "all" || item.contactId === state.contactFilter)
    .filter((item) => !state.timelineSearch || haystack(item).includes(state.timelineSearch))
    .slice(0, 160);

  els.timelineList.replaceChildren(...rows.map(momentCard), rows.length ? "" : empty("没有匹配记录。"));
}

function renderAnswer() {
  if (!state.question) {
    const recent = state.data.moments[0];
    els.answerPanel.innerHTML = recent
      ? `<h2>最近线索</h2>${momentCard(recent).outerHTML}`
      : `<div class="empty-state">暂无数据。</div>`;
    return;
  }

  const result = answerQuestion(state.question);
  const evidence = result.evidence.map(momentCard);
  els.answerPanel.replaceChildren(
    probabilityNode(result),
    ...evidence,
    evidence.length ? "" : empty("没有直接证据。"),
  );
}

function filteredContacts() {
  const rows = state.data.contacts.filter((contact) => {
    if (!state.friendSearch) return true;
    return `${contact.name} ${contact.nickname} ${contact.status} ${contact.topCategories.join(" ")} ${contact.links.map((item) => item.title).join(" ")}`
      .toLowerCase()
      .includes(state.friendSearch);
  });
  return rows.sort((a, b) => {
    if (state.friendSort === "recent") return String(b.visibleEnd).localeCompare(String(a.visibleEnd));
    if (state.friendSort === "media") return b.mediaPreviewCount - a.mediaPreviewCount || b.mediaCount - a.mediaCount;
    return b.count - a.count;
  });
}

function contactCard(contact, selectable = false) {
  const card = document.createElement("article");
  card.className = `friend-card rich ${contact.status}${contact.id === state.selectedContact ? " active" : ""}`;
  card.innerHTML = `
    <div class="friend-topline">
      <span>${escapeHtml(contact.visibleStart || "未开始")} - ${escapeHtml(contact.visibleEnd || "无可见日期")}</span>
      <i>${statusLabel(contact.status)}</i>
    </div>
    <h3>${escapeHtml(contact.name)}</h3>
    <div class="card-metrics">
      <b>${formatNumber(contact.count)} 条</b>
      <span>${formatNumber(contact.mediaPreviewCount)} 图</span>
      <span>${formatNumber(contact.resolvedLinkCount)}/${formatNumber(contact.resolvedLinkCount + contact.missingLinkCount)} 链接</span>
    </div>
    ${mediaStrip(contact.mediaPreviews, 4)}
    ${linkStrip(contact.links, 3)}
    <div class="tags">${contact.topCategories.slice(0, 3).map((tag) => `<i>${escapeHtml(tag)}</i>`).join("") || "<i>未归类</i>"}</div>
  `;
  if (selectable) {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      state.selectedContact = contact.id;
      renderFriends();
    });
  }
  return card;
}

function renderFriendDetail(contact) {
  const recent = contact.moments.slice(0, 8).map(momentCard);
  els.friendDetail.replaceChildren(
    htmlNode("h2", contact.name),
    detailStats(contact),
    coverageNode(contact),
    galleryNode(contact.mediaPreviews),
    linkListNode(contact.links),
    tagsNode(contact.topCategories.slice(0, 7)),
    ...recent,
  );
}

function detailStats(contact) {
  const wrap = document.createElement("div");
  wrap.className = "detail-stats";
  wrap.innerHTML = `
    <div><strong>${formatNumber(contact.count)}</strong><span>可见条目</span></div>
    <div><strong>${formatNumber(contact.mediaPreviewCount)}</strong><span>图片预览</span></div>
    <div><strong>${formatNumber(contact.resolvedLinkCount)}</strong><span>真实链接</span></div>
  `;
  return wrap;
}

function coverageNode(contact) {
  const node = document.createElement("p");
  node.className = "coverage-note";
  node.textContent = contact.coverageNote || contact.method || statusLabel(contact.status);
  return node;
}

function galleryNode(previews) {
  const wrap = document.createElement("div");
  wrap.className = previews?.length ? "media-gallery" : "media-gallery empty-gallery";
  wrap.innerHTML = previews?.length
    ? previews.map((item) => `<a href="${escapeAttr(item.src)}"><img src="${escapeAttr(item.src)}" alt="" loading="lazy" /></a>`).join("")
    : "暂无图片预览";
  return wrap;
}

function linkListNode(links) {
  const wrap = document.createElement("div");
  wrap.className = links?.length ? "link-list" : "link-list empty-links";
  wrap.innerHTML = links?.length
    ? links
        .map((item) =>
          item.url
            ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer"><time>${escapeHtml(item.date)}</time><span>${escapeHtml(item.title)}</span></a>`
            : `<div><time>${escapeHtml(item.date)}</time><span>${escapeHtml(item.title)}</span><em>UI 未捕获 URL</em></div>`,
        )
        .join("")
    : "暂无链接型动态";
  return wrap;
}

function tagsNode(tags) {
  const wrap = document.createElement("div");
  wrap.className = "tags";
  wrap.innerHTML = tags.map((tag) => `<i>${escapeHtml(tag)}</i>`).join("");
  return wrap;
}

function momentCard(item) {
  const card = document.createElement("article");
  card.className = `moment-card${item.linkMissing ? " missing-link" : ""}`;
  const links = (item.links || [])
    .map((link) => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.title || link.url)}</a>`)
    .join("");
  card.innerHTML = `
    <header>
      <h3>${escapeHtml(item.contactName || "")}</h3>
      <time>${escapeHtml(item.date || "未知日期")}</time>
    </header>
    <p>${escapeHtml(item.text || item.kind || "无文字")}</p>
    ${links ? `<div class="moment-links">${links}</div>` : item.linkMissing ? `<div class="missing-url">UI 未捕获 URL</div>` : ""}
    <footer>
      <span>${escapeHtml(item.kind || "未知")}</span>
      <span>${formatNumber(item.mediaCount || 0)} media</span>
      ${(item.categories || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </footer>
  `;
  return card;
}

function answerQuestion(question) {
  const normalized = question.toLowerCase();
  const contact = state.data.contacts.find((item) => normalized.includes(item.name.toLowerCase().slice(0, 2)));
  const terms = termsForQuestion(question);
  const scope = contact ? state.data.moments.filter((item) => item.contactId === contact.id) : state.data.moments;
  const evidence = scope
    .map((item) => ({ item, score: matchScore(item, terms, normalized) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || String(b.item.date).localeCompare(String(a.item.date)))
    .slice(0, 8)
    .map((row) => row.item);

  const probability = evidence.length >= 4 ? 78 : evidence.length >= 2 ? 56 : evidence.length === 1 ? 34 : 18;
  const confidence = evidence.length >= 4 ? "较高" : evidence.length >= 2 ? "中等" : evidence.length === 1 ? "较低" : "很低";
  const target = contact ? contact.name : "这些好友";
  const phrase = terms.length ? `关键词：${terms.slice(0, 5).join("、")}` : "没有稳定关键词";

  return {
    probability,
    evidence,
    summary: `${target} 的可见朋友圈里，直接证据强度为${confidence}。${phrase}。`,
  };
}

function mediaStrip(previews, limit) {
  if (!previews?.length) return '<div class="mini-gallery empty-gallery">暂无图片</div>';
  return `<div class="mini-gallery">${previews
    .slice(0, limit)
    .map((item) => `<img src="${escapeAttr(item.src)}" alt="" loading="lazy" />`)
    .join("")}</div>`;
}

function linkStrip(links, limit) {
  if (!links?.length) return "";
  return `<div class="mini-links">${links
    .slice(0, limit)
    .map((item) =>
      item.url
        ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>`
        : `<span>${escapeHtml(item.title)} <em>缺 URL</em></span>`,
    )
    .join("")}</div>`;
}

function termsForQuestion(question) {
  const upper = question.toUpperCase();
  const terms = new Set();
  Object.values(clueGroups).flat().forEach((term) => {
    const probe = /[a-z]/i.test(term) ? upper : question;
    if (probe.includes(/[a-z]/i.test(term) ? term.toUpperCase() : term)) terms.add(term);
  });
  question
    .split(/[，,。？?\s/]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && !state.data.contacts.some((contact) => contact.name.includes(part)))
    .forEach((part) => terms.add(part));
  return [...terms];
}

function matchScore(item, terms, question) {
  const text = haystack(item);
  let score = 0;
  terms.forEach((term) => {
    const probe = /[a-z]/i.test(term) ? term.toLowerCase() : term;
    if (text.includes(probe)) score += 3;
  });
  if (question && item.contactName.toLowerCase().includes(question)) score += 1;
  return score;
}

function probabilityNode(result) {
  const wrap = document.createElement("div");
  wrap.className = "probability";
  wrap.innerHTML = `
    <strong>${result.probability}%</strong>
    <div>
      <h2>概率判断</h2>
      <p>${escapeHtml(result.summary)}</p>
      <div class="answer-meta">${result.evidence.length} 条可见证据</div>
    </div>
  `;
  return wrap;
}

function option(value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  return item;
}

function haystack(item) {
  return `${item.contactName} ${item.text} ${(item.links || []).map((link) => link.title).join(" ")} ${(item.categories || []).join(" ")} ${item.location || ""}`.toLowerCase();
}

function empty(text) {
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = text;
  return node;
}

function htmlNode(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function statusLabel(status) {
  return { done: "已归档", blank: "空白/受限", pending: "待采集" }[status] || status || "未知";
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}
