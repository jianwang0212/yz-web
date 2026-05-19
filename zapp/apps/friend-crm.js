const ENCRYPTED_DATA_URL = "friend-crm-data.enc.json?v=20260515a";
const STORE_SESSION_PASSWORD_KEY = "zappStore.sessionUnlockPassword.v1";

const state = {
  data: null,
  query: "",
  mbti: "all",
};

let encryptedPackage = null;

const els = {
  dataBadge: document.querySelector("#dataBadge"),
  unlockPanel: document.querySelector("#unlockPanel"),
  unlockForm: document.querySelector("#unlockForm"),
  unlockPassword: document.querySelector("#unlockPassword"),
  unlockStatus: document.querySelector("#unlockStatus"),
  summaryGrid: document.querySelector("#summaryGrid"),
  controlPanel: document.querySelector("#controlPanel"),
  profileGrid: document.querySelector("#profileGrid"),
  tablePanel: document.querySelector("#tablePanel"),
  profileRows: document.querySelector("#profileRows"),
  profileCount: document.querySelector("#profileCount"),
  remarkCount: document.querySelector("#remarkCount"),
  mbtiCount: document.querySelector("#mbtiCount"),
  socialCount: document.querySelector("#socialCount"),
  searchInput: document.querySelector("#searchInput"),
  mbtiFilter: document.querySelector("#mbtiFilter"),
  tableCount: document.querySelector("#tableCount"),
};

init();

async function init() {
  bindEvents();
  await loadEncryptedPackage();
}

function bindEvents() {
  els.unlockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    unlockData(getStoreUnlockPassword());
  });

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value.trim().toLowerCase();
    renderProfiles();
  });

  els.mbtiFilter.addEventListener("change", () => {
    state.mbti = els.mbtiFilter.value;
    renderProfiles();
  });
}

async function loadEncryptedPackage() {
  try {
    const response = await fetch(ENCRYPTED_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    encryptedPackage = await response.json();
    els.unlockStatus.textContent = `加密数据包已载入：${encryptedPackage.label || "Friend CRM"}。正在使用 Zapp Store 会话打开。`;
    await unlockData(getStoreUnlockPassword());
  } catch (error) {
    els.dataBadge.textContent = "Load failed";
    els.unlockStatus.textContent = `加密数据包加载失败：${error.message}`;
  }
}

async function unlockData(password) {
  if (!password) {
    requireStoreUnlock();
    return;
  }
  els.unlockStatus.textContent = "正在解密...";

  try {
    if (!encryptedPackage) await loadEncryptedPackage();
    if (!encryptedPackage) throw new Error("找不到加密数据包");

    state.data = await decryptPackage(encryptedPackage, password);
    els.unlockPassword.value = "";
    els.unlockPanel.classList.add("hidden");
    els.summaryGrid.classList.remove("hidden");
    els.controlPanel.classList.remove("hidden");
    els.profileGrid.classList.remove("hidden");
    els.tablePanel.classList.remove("hidden");
    els.dataBadge.textContent = `${state.data.meta.profileCount} profiles`;
    populateMbtiFilter();
    render();
  } catch (error) {
    state.data = null;
    els.unlockStatus.textContent = "密码不对，或数据包已损坏。";
    console.error(error);
  }
}

function getStoreUnlockPassword() {
  return sessionStorage.getItem(STORE_SESSION_PASSWORD_KEY) || "";
}

function requireStoreUnlock() {
  els.unlockPassword.closest("label").classList.add("hidden");
  els.unlockForm.querySelector("button").textContent = "回到 Zapp Store";
  els.unlockStatus.textContent = "请先在 Zapp Store 用 Face ID 打开一次；这个 app 不再单独输入密码。";
  els.unlockForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      window.location.href = "../";
    },
    { once: true },
  );
}

async function decryptPackage(packageData, password) {
  const salt = base64ToBytes(packageData.salt);
  const iv = base64ToBytes(packageData.iv);
  const ciphertext = base64ToBytes(packageData.ciphertext);
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: packageData.iterations,
      hash: packageData.hash || "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plainBuffer));
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
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
  renderProfiles();
}

function renderSummary() {
  const meta = state.data.meta;
  els.profileCount.textContent = formatNumber(meta.profileCount);
  els.remarkCount.textContent = `${formatNumber(meta.remarkAppliedCount)}/${formatNumber(meta.profileCount)}`;
  els.mbtiCount.textContent = formatNumber(meta.mbtiCount);
  els.socialCount.textContent = formatNumber(meta.socialCount);
}

function renderProfiles() {
  const profiles = filteredProfiles();
  els.tableCount.textContent = `${profiles.length} / ${state.data.profiles.length}`;
  els.profileGrid.replaceChildren(...profiles.map(profileCard));
  els.profileRows.replaceChildren(...profiles.map(profileRow));
}

function filteredProfiles() {
  return state.data.profiles.filter((profile) => {
    const matchesMbti = state.mbti === "all" || profile.mbti === state.mbti;
    const matchesQuery = !state.query || profileHaystack(profile).includes(state.query);
    return matchesMbti && matchesQuery;
  });
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
      <dt>备注</dt>
      <dd>${escapeHtml(profile.wechatRemark || "未设置")}</dd>
    </dl>
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

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
