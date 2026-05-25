const DATA_URL = "moments-memory-data.json?v=20260524e";

const state = {
  view: "overview",
  data: null,
  selectedContact: "",
  friendSearch: "",
  friendSort: "count",
  timelineSearch: "",
  contactFilter: "all",
  typeFilter: "all",
  monthFilter: "all",
  detailTypeFilter: "all",
  question: "",
  lightbox: null,
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
  summaryCards: [...document.querySelectorAll(".summary-grid article")],
  friendSearch: document.querySelector("#friendSearch"),
  friendSort: document.querySelector("#friendSort"),
  friendList: document.querySelector("#friendList"),
  friendDetail: document.querySelector("#friendDetail"),
  timelineSearch: document.querySelector("#timelineSearch"),
  contactFilter: document.querySelector("#contactFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  monthFilter: document.querySelector("#monthFilter"),
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
    applyHashState();
    if (!state.selectedContact) state.selectedContact = state.data.contacts[0]?.id || "";
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
      writeHash();
      render();
    });
  });

  els.summaryCards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (index === 0) {
        state.view = "friends";
      } else if (index === 1) {
        state.view = "timeline";
        state.contactFilter = "all";
        state.typeFilter = "all";
        state.monthFilter = "all";
      } else if (index === 2) {
        state.view = "timeline";
        state.contactFilter = "all";
        state.typeFilter = "media";
        state.monthFilter = "all";
      } else {
        state.view = "timeline";
        state.contactFilter = "all";
        state.typeFilter = "link";
        state.monthFilter = "all";
      }
      writeHash();
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
    writeHash();
    renderTimeline();
  });

  els.typeFilter.addEventListener("change", () => {
    state.typeFilter = els.typeFilter.value;
    writeHash();
    renderTimeline();
  });

  els.monthFilter.addEventListener("change", () => {
    state.monthFilter = els.monthFilter.value;
    writeHash();
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

  window.addEventListener("hashchange", () => {
    if (!state.data) return;
    applyHashState();
    render();
  });

  window.addEventListener("keydown", (event) => {
    if (!state.lightbox) return;
    if (event.key === "Escape") {
      state.lightbox = null;
      renderLightbox();
    } else if (event.key === "ArrowLeft") {
      state.lightbox.index = (state.lightbox.index - 1 + state.lightbox.previews.length) % state.lightbox.previews.length;
      renderLightbox();
    } else if (event.key === "ArrowRight") {
      state.lightbox.index = (state.lightbox.index + 1) % state.lightbox.previews.length;
      renderLightbox();
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
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `${item.month} ${item.count} 条`);
      node.addEventListener("click", () => openMonth(item.month));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openMonth(item.month);
        }
      });
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
  if (!els.monthFilter.options.length) {
    els.monthFilter.replaceChildren(
      option("all", "全部月份"),
      ...state.data.months.slice().reverse().map((item) => option(item.month, item.month)),
    );
  }
  els.contactFilter.value = state.contactFilter;
  els.typeFilter.value = state.typeFilter;
  els.monthFilter.value = state.monthFilter;
  els.timelineSearch.value = state.timelineSearch;

  const rows = state.data.moments
    .filter((item) => state.contactFilter === "all" || item.contactId === state.contactFilter)
    .filter((item) => state.monthFilter === "all" || String(item.date || "").startsWith(state.monthFilter))
    .filter((item) => momentMatchesType(item, state.typeFilter))
    .filter((item) => !state.timelineSearch || haystack(item).includes(state.timelineSearch))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  els.timelineList.replaceChildren(...rows.map(momentCard), rows.length ? "" : empty("没有匹配记录。"));
}

function renderAnswer() {
  if (!state.question) {
    const recent = state.data.moments[0];
    els.answerPanel.replaceChildren(recent ? htmlNode("h2", "最近线索") : empty("暂无数据。"), recent ? momentCard(recent) : "");
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
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${contact.name} ${contact.count} 条朋友圈`);
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
  const open = (event) => {
    if (event?.target?.closest("a")) return;
    openContact(contact.id, selectable ? "friends" : "friends");
  };
  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(event);
    }
  });
  return card;
}

function renderFriendDetail(contact) {
  const moments = contactMoments(contact.id).filter((item) => momentMatchesType(item, state.detailTypeFilter));
  els.friendDetail.replaceChildren(
    htmlNode("h2", contact.name),
    detailStats(contact),
    coverageNode(contact),
    detailToolbar(contact, moments.length),
    galleryNode(contact.mediaPreviews),
    linkListNode(contact.links),
    tagsNode(contact.topCategories.slice(0, 7)),
    relatedContactsNode(contact),
    sectionTitle("全部记录", `${moments.length}/${contact.count}`),
    ...moments.map(momentCard),
    moments.length ? "" : empty("没有匹配记录。"),
  );
}

function detailToolbar(contact, visibleCount) {
  const wrap = document.createElement("div");
  wrap.className = "detail-toolbar";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "详情筛选");
  [
    ["all", "全部"],
    ["link", "链接"],
    ["media", "媒体"],
    ["text", "文字"],
    ["2026", "2026"],
  ].forEach(([value, label]) => select.append(option(value, label)));
  select.value = state.detailTypeFilter;
  select.addEventListener("change", () => {
    state.detailTypeFilter = select.value;
    renderFriendDetail(contact);
  });

  const timelineButton = document.createElement("button");
  timelineButton.type = "button";
  timelineButton.textContent = "时间线";
  timelineButton.addEventListener("click", () => {
    openTimeline({ contactId: contact.id, type: state.detailTypeFilter });
  });

  const askButton = document.createElement("button");
  askButton.type = "button";
  askButton.textContent = "问这个人";
  askButton.addEventListener("click", () => askContact(contact));

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "复制链接";
  copyButton.addEventListener("click", () => copyContactLink(contact));

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = "导出";
  exportButton.addEventListener("click", () => exportContactJson(contact));

  const count = document.createElement("span");
  count.textContent = `${formatNumber(visibleCount)} 条`;
  wrap.append(select, timelineButton, askButton, copyButton, exportButton, count);
  return wrap;
}

function detailStats(contact) {
  const wrap = document.createElement("div");
  wrap.className = "detail-stats";
  const moments = contactMoments(contact.id);
  [
    ["all", moments.length || contact.count, "可见条目"],
    ["media", moments.filter((item) => momentMatchesType(item, "media")).length, "媒体记录"],
    ["link", moments.filter((item) => momentMatchesType(item, "link")).length, "链接记录"],
    ["2026", moments.filter((item) => momentMatchesType(item, "2026")).length, "2026"],
  ].forEach(([type, value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = type === state.detailTypeFilter ? "active" : "";
    button.innerHTML = `<strong>${formatNumber(value || 0)}</strong><span>${escapeHtml(label)}</span>`;
    button.addEventListener("click", () => {
      state.detailTypeFilter = type;
      renderFriendDetail(contact);
    });
    wrap.append(button);
  });
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
  if (!previews?.length) {
    wrap.textContent = "暂无图片预览";
    return wrap;
  }
  previews.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `查看第 ${index + 1} 张图片`);
    button.innerHTML = `<img src="${escapeAttr(item.src)}" alt="" loading="lazy" />`;
    button.addEventListener("click", () => openLightbox(previews, index));
    wrap.append(button);
  });
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
  if (!tags.length) {
    wrap.append(tagButton("未归类", () => openTimeline({ search: "" })));
    return wrap;
  }
  tags.forEach((tag) => {
    wrap.append(tagButton(tag, () => openTimeline({ search: tag })));
  });
  return wrap;
}

function relatedContactsNode(contact) {
  const related = relatedContacts(contact);
  const wrap = document.createElement("section");
  wrap.className = "related-contacts";
  wrap.append(sectionTitle("相关好友", related.length ? "点击跳转" : "暂无"));
  if (!related.length) return wrap;
  const list = document.createElement("div");
  list.className = "related-list";
  related.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${escapeHtml(item.name)}</strong><span>${formatNumber(item.count)} 条 · ${escapeHtml(item.visibleEnd || "无日期")}</span>`;
    button.addEventListener("click", () => openContact(item.id, "friends"));
    list.append(button);
  });
  wrap.append(list);
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
      <button type="button" class="inline-action contact-action">${escapeHtml(item.contactName || "")}</button>
      <button type="button" class="inline-action date-action">${escapeHtml(item.date || "未知日期")}</button>
    </header>
    <p>${escapeHtml(item.text || item.kind || "无文字")}</p>
    ${links ? `<div class="moment-links">${links}</div>` : item.linkMissing ? `<div class="missing-url">UI 未捕获 URL</div>` : ""}
    <footer>
      <button type="button" data-filter="${momentTypeForKind(item)}">${escapeHtml(item.kind || "未知")}</button>
      <button type="button" data-filter="media">${formatNumber(item.mediaCount || 0)} media</button>
      ${(item.categories || []).slice(0, 3).map((tag) => `<button type="button" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`).join("")}
    </footer>
  `;
  card.querySelector(".contact-action")?.addEventListener("click", (event) => {
    event.stopPropagation();
    openContact(item.contactId, "friends");
  });
  card.querySelector(".date-action")?.addEventListener("click", (event) => {
    event.stopPropagation();
    openTimeline({ contactId: item.contactId, month: item.month || String(item.date || "").slice(0, 7) });
  });
  card.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openTimeline({ contactId: item.contactId, type: button.dataset.filter });
    });
  });
  card.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openTimeline({ search: button.dataset.tag });
    });
  });
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${item.contactName || ""} ${item.date || ""}`);
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    openContact(item.contactId, "friends");
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openContact(item.contactId, "friends");
    }
  });
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

function openContact(contactId, view = "friends") {
  if (!contactId) return;
  state.selectedContact = contactId;
  state.view = view;
  state.contactFilter = contactId;
  writeHash();
  render();
}

function openMonth(month) {
  openTimeline({ month: month || "all" });
}

function openTimeline({ contactId = "all", type = "all", month = "all", search = "" } = {}) {
  state.view = "timeline";
  state.contactFilter = contactId || "all";
  state.typeFilter = type || "all";
  state.monthFilter = month || "all";
  state.timelineSearch = String(search || "").toLowerCase();
  if (contactId && contactId !== "all") state.selectedContact = contactId;
  writeHash();
  render();
}

function contactMoments(contactId) {
  return state.data.moments
    .filter((item) => item.contactId === contactId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function momentMatchesType(item, type) {
  if (!type || type === "all") return true;
  if (type === "2026") return Number(item.year) === 2026 || String(item.date || "").startsWith("2026");
  if (type === "link") return Boolean((item.links || []).length || item.linkMissing || String(item.kind || "").includes("链接"));
  if (type === "media") return Number(item.mediaCount || 0) > 0 || ["图片", "视频"].some((kind) => String(item.kind || "").includes(kind));
  if (type === "text") return Boolean(String(item.text || "").trim());
  return true;
}

function momentTypeForKind(item) {
  if ((item.links || []).length || item.linkMissing || String(item.kind || "").includes("链接")) return "link";
  if (Number(item.mediaCount || 0) > 0 || ["图片", "视频"].some((kind) => String(item.kind || "").includes(kind))) return "media";
  return "text";
}

function relatedContacts(contact) {
  const categories = new Set(contact.topCategories || []);
  const endMonth = String(contact.visibleEnd || "").slice(0, 7);
  return state.data.contacts
    .filter((item) => item.id !== contact.id && item.count > 0)
    .map((item) => {
      const sharedCategories = (item.topCategories || []).filter((tag) => categories.has(tag)).length;
      const sameEndMonth = endMonth && String(item.visibleEnd || "").startsWith(endMonth) ? 1 : 0;
      const similarMedia = Math.min(item.mediaPreviewCount || 0, contact.mediaPreviewCount || 0) > 0 ? 1 : 0;
      const similarLinks = Math.min(item.resolvedLinkCount || 0, contact.resolvedLinkCount || 0) > 0 ? 1 : 0;
      const score = sharedCategories * 4 + sameEndMonth * 2 + similarMedia + similarLinks + Math.min(item.count, 5) / 10;
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(b.visibleEnd).localeCompare(String(a.visibleEnd)))
    .slice(0, 4);
}

function askContact(contact) {
  state.view = "clues";
  state.question = `${contact.name} 最近有什么线索`;
  els.questionInput.value = state.question;
  writeHash();
  render();
}

async function copyContactLink(contact) {
  const base = location.origin === "null" ? location.href.split("#")[0] : `${location.origin}${location.pathname}`;
  const url = `${base}#view=friends&contact=${encodeURIComponent(contact.id)}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("已复制联系人深链");
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast("已复制联系人深链");
  }
}

function exportContactJson(contact) {
  const payload = {
    exportedAt: new Date().toISOString(),
    contact,
    moments: contactMoments(contact.id),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `moments-${contact.id || "contact"}.json`;
  document.body.append(link);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  link.remove();
  showToast("已导出单联系人 JSON");
}

function openLightbox(previews, index) {
  state.lightbox = { previews, index };
  renderLightbox();
}

function renderLightbox() {
  document.querySelector(".lightbox")?.remove();
  if (!state.lightbox) return;
  const { previews, index } = state.lightbox;
  const item = previews[index];
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML = `
    <div class="lightbox-inner" role="dialog" aria-modal="true" aria-label="媒体预览">
      <div class="lightbox-toolbar">
        <span>${index + 1}/${previews.length}</span>
        <a href="${escapeAttr(item.src)}" target="_blank" rel="noreferrer">原图</a>
        <button type="button" data-close>关闭</button>
      </div>
      <button type="button" class="lightbox-nav prev" aria-label="上一张">‹</button>
      <img src="${escapeAttr(item.src)}" alt="" />
      <button type="button" class="lightbox-nav next" aria-label="下一张">›</button>
    </div>
  `;
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-close]")) {
      state.lightbox = null;
      renderLightbox();
    }
  });
  overlay.querySelector(".prev")?.addEventListener("click", () => {
    state.lightbox.index = (index - 1 + previews.length) % previews.length;
    renderLightbox();
  });
  overlay.querySelector(".next")?.addEventListener("click", () => {
    state.lightbox.index = (index + 1) % previews.length;
    renderLightbox();
  });
  document.body.append(overlay);
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function tagButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function sectionTitle(title, meta) {
  const node = document.createElement("div");
  node.className = "detail-section-title";
  node.innerHTML = `<h3>${escapeHtml(title)}</h3><span>${escapeHtml(meta)}</span>`;
  return node;
}

function applyHashState() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const view = params.get("view");
  const contact = params.get("contact");
  const type = params.get("type");
  const month = params.get("month");
  if (view && els.views[view]) state.view = view;
  if (state.data && contact && state.data.contacts.some((item) => item.id === contact)) {
    state.selectedContact = contact;
    state.contactFilter = contact;
  }
  if (type) {
    state.typeFilter = type;
    state.detailTypeFilter = type;
  }
  if (month) state.monthFilter = month;
}

function writeHash() {
  const params = new URLSearchParams();
  params.set("view", state.view);
  if (state.selectedContact && (state.view === "friends" || state.contactFilter !== "all")) {
    params.set("contact", state.selectedContact);
  }
  if (state.view === "timeline" && state.typeFilter !== "all") params.set("type", state.typeFilter);
  if (state.view === "timeline" && state.monthFilter !== "all") params.set("month", state.monthFilter);
  const next = `#${params.toString()}`;
  if (location.hash !== next) history.replaceState(null, "", next);
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
