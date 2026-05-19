const SERVICE_RULES = [
  { id: "openai", name: "OpenAI / ChatGPT", kind: "AI workspace", tokens: ["OPENAI"], cadence: "usage + subscription" },
  { id: "apple", name: "Apple billing", kind: "Apple subscriptions", tokens: ["APPLE.COM/BILL"], cadence: "monthly" },
  { id: "suno", name: "Suno", kind: "Music AI", tokens: ["SUNO"], cadence: "monthly or credits" },
  { id: "splice", name: "Splice", kind: "Music production", tokens: ["SPLICE"], cadence: "monthly" },
  { id: "atlassian", name: "Atlassian", kind: "Software", tokens: ["ATLASSIAN"], cadence: "monthly" },
  { id: "cursor", name: "Cursor", kind: "AI code editor", tokens: ["CURSOR"], cadence: "monthly" },
  { id: "onepassword", name: "1Password", kind: "Password manager", tokens: ["1PASSWORD"], cadence: "subscription" },
  { id: "soundgym", name: "SoundGym", kind: "Music training", tokens: ["SOUNDGYM"], cadence: "subscription" },
  { id: "uber-one", name: "Uber One", kind: "Delivery membership", tokens: ["UBER *ONE"], cadence: "monthly" },
  { id: "starry", name: "Starry Internet", kind: "Internet", tokens: ["STARRY"], cadence: "monthly" },
  { id: "rcn", name: "RCN / Astound Internet", kind: "Internet", tokens: ["RCN"], cadence: "monthly" },
  { id: "tmobile", name: "T-Mobile prepaid", kind: "Mobile phone", tokens: ["TMOBILE", "T-MOBILE"], cadence: "monthly" },
  { id: "eversource", name: "Eversource", kind: "Electric", tokens: ["EVERSOURCE"], cadence: "monthly" },
  { id: "national-grid", name: "National Grid", kind: "Utility", tokens: ["NGRID"], cadence: "monthly" },
  { id: "youtube-premium", name: "YouTube Premium", kind: "Video subscription", tokens: ["YOUTUBEPREMIUM", "YOUTUBE PREMIUM"], cadence: "monthly" },
];

const DEFAULT_MANUAL_SERVICES = [
  {
    id: "apple-music",
    name: "Apple Music",
    monthly: "",
    note: "可能混在 APPLE.COM/BILL 里；需要到 Apple 订阅页确认具体项目。",
  },
  {
    id: "pro-tools",
    name: "Pro Tools / Avid",
    monthly: "",
    note: "当前 BOA 数据里还没有检测到 Avid 或 Pro Tools 扣款。",
  },
  {
    id: "notability",
    name: "Notability",
    monthly: "",
    note: "当前 BOA 数据里还没有检测到 Notability 扣款。",
  },
];

const EMPTY_META = {
  title: "BOA Finance",
  coverage: "Encrypted",
  months: [],
  postedCount: 0,
  pendingCount: 0,
  currency: "USD",
};

const ENCRYPTED_DATA_URL = "boa-finance-data.enc.json?v=20260512bio2";
const BIOMETRIC_UNLOCK_KEY = "boaFinance.biometricUnlock.v1";
const STORE_SESSION_PASSWORD_KEY = "zappStore.sessionUnlockPassword.v1";

let BOA_META = EMPTY_META;
let transactions = [];
let encryptedPackage = null;
let isUnlocked = false;
let lastUnlockPassword = "";
let attemptedAutoBiometric = false;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
});

const state = {
  view: "overview",
  month: "all",
  category: "all",
  status: "all",
  search: "",
  answer: "",
  answerRows: [],
  answerKind: "",
  pendingQuestion: "",
};

const els = {
  unlockPanel: document.querySelector("#unlockPanel"),
  unlockForm: document.querySelector("#unlockForm"),
  unlockPassword: document.querySelector("#unlockPassword"),
  unlockStatus: document.querySelector("#unlockStatus"),
  biometricUnlock: document.querySelector("#biometricUnlock"),
  deviceUnlockPanel: document.querySelector("#deviceUnlockPanel"),
  biometricStatus: document.querySelector("#biometricStatus"),
  biometricSetup: document.querySelector("#biometricSetup"),
  biometricReset: document.querySelector("#biometricReset"),
  sourceBadge: document.querySelector("#sourceBadge"),
  tabs: [...document.querySelectorAll("[data-view]")],
  views: {
    overview: document.querySelector("#overviewView"),
    services: document.querySelector("#servicesView"),
    transactions: document.querySelector("#transactionsView"),
  },
  totalSpend: document.querySelector("#totalSpend"),
  foodSpend: document.querySelector("#foodSpend"),
  serviceSpend: document.querySelector("#serviceSpend"),
  serviceCount: document.querySelector("#serviceCount"),
  totalMeta: document.querySelector("#totalMeta"),
  pendingMeta: document.querySelector("#pendingMeta"),
  questionForm: document.querySelector("#questionForm"),
  questionInput: document.querySelector("#questionInput"),
  answerLine: document.querySelector("#answerLine"),
  answerResults: document.querySelector("#answerResults"),
  monthCards: document.querySelector("#monthCards"),
  categoryBars: document.querySelector("#categoryBars"),
  categoryTotal: document.querySelector("#categoryTotal"),
  recentList: document.querySelector("#recentList"),
  serviceStatus: document.querySelector("#serviceStatus"),
  serviceWindowTotal: document.querySelector("#serviceWindowTotal"),
  detectedServices: document.querySelector("#detectedServices"),
  manualServiceForm: document.querySelector("#manualServiceForm"),
  manualServices: document.querySelector("#manualServices"),
  monthFilter: document.querySelector("#monthFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  searchFilter: document.querySelector("#searchFilter"),
  categorySummaryTable: document.querySelector("#categorySummaryTable"),
  categoryTableTotal: document.querySelector("#categoryTableTotal"),
  transactionSummary: document.querySelector("#transactionSummary"),
  transactionList: document.querySelector("#transactionList"),
};

init();

function init() {
  buildFilters();
  bindEvents();
  hydrateFromURL();
  updateBiometricUI();
  loadEncryptedPackage();
  render();
}

function hydrateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const question = params.get("q") || params.get("question");

  if (["overview", "services", "transactions"].includes(view)) {
    state.view = view;
  }

  if (question) {
    state.pendingQuestion = question;
    els.questionInput.value = question;
  }
}

async function loadEncryptedPackage() {
  try {
    const response = await fetch(ENCRYPTED_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    encryptedPackage = await response.json();
    els.unlockStatus.textContent = `加密数据包已载入：${encryptedPackage.label || "BOA Finance"}。正在使用 Zapp Store 会话打开。`;
    await unlockData(getStoreUnlockPassword(), { source: "store" });
  } catch (error) {
    els.unlockStatus.textContent = `加密数据包加载失败：${error.message}`;
  }
}

async function unlockData(password, options = {}) {
  if (!password) {
    requireStoreUnlock();
    return;
  }
  els.unlockStatus.textContent = "正在解密...";

  try {
    if (!encryptedPackage) {
      await loadEncryptedPackage();
    }
    if (!encryptedPackage) {
      throw new Error("找不到加密数据包");
    }

    const payload = await decryptPackage(encryptedPackage, password);
    BOA_META = payload.meta || EMPTY_META;
    transactions = (payload.transactions || []).map(normalizeTransaction);
    isUnlocked = true;
    lastUnlockPassword = options.source === "biometric" ? "" : password;
    els.unlockPassword.value = "";
    els.unlockStatus.textContent = `已解锁 ${transactions.length} 笔交易。`;
    els.unlockPanel.classList.add("hidden");
    buildFilters();
    updateBiometricUI();

    if (state.pendingQuestion) {
      const result = answerQuestion(state.pendingQuestion);
      applyAnswerResult(result);
      state.pendingQuestion = "";
    }

    render();
  } catch (error) {
    isUnlocked = false;
    updateBiometricUI();
    els.unlockStatus.textContent = "密码不对，或数据包已损坏。";
    console.error(error);
  }
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

async function maybeAutoBiometricUnlock() {
  return;
  if (attemptedAutoBiometric || isUnlocked || !loadBiometricRecord()) return;
  attemptedAutoBiometric = true;
  try {
    await unlockWithBiometric({ auto: true });
  } catch {
    updateBiometricUI("Face ID 已启用；点“Face ID 打开”即可解锁。");
  }
}

function hasBiometricRuntime() {
  return Boolean(
    window.isSecureContext &&
      window.PublicKeyCredential &&
      navigator.credentials &&
      crypto?.subtle &&
      crypto?.getRandomValues,
  );
}

function loadBiometricRecord() {
  try {
    const raw = localStorage.getItem(BIOMETRIC_UNLOCK_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    return record?.version === 1 && record.credentialId && record.salt && record.wrappedPassword ? record : null;
  } catch {
    return null;
  }
}

function saveBiometricRecord(record) {
  localStorage.setItem(BIOMETRIC_UNLOCK_KEY, JSON.stringify(record));
}

function updateBiometricUI(message = "") {
  els.biometricUnlock.classList.add("hidden");
  els.deviceUnlockPanel.classList.add("hidden");
  els.biometricSetup.classList.add("hidden");
  els.biometricReset.classList.add("hidden");
  if (message && !isUnlocked) els.unlockStatus.textContent = message;
  return;
  const record = loadBiometricRecord();
  const runtime = hasBiometricRuntime();

  els.biometricUnlock.classList.toggle("hidden", isUnlocked || !record || !runtime);
  els.deviceUnlockPanel.classList.toggle("hidden", !isUnlocked || !runtime);
  els.biometricSetup.classList.toggle("hidden", Boolean(record));
  els.biometricReset.classList.toggle("hidden", !record);

  if (!runtime) {
    els.unlockStatus.textContent = els.unlockStatus.textContent || "这个浏览器暂不支持设备面容解锁。";
    return;
  }

  if (!message && !isUnlocked && record) {
    els.unlockStatus.textContent = "Face ID 已启用，可直接打开。";
  }

  if (isUnlocked) {
    els.biometricStatus.textContent =
      message ||
      (record
        ? "Face ID / Touch ID 已为这台设备启用。"
        : "可在这台设备上启用 Face ID / Touch ID，下次不再输入密码。");
  } else if (message) {
    els.unlockStatus.textContent = message;
  }
}

function getStoreUnlockPassword() {
  return sessionStorage.getItem(STORE_SESSION_PASSWORD_KEY) || "";
}

function requireStoreUnlock() {
  els.unlockPassword.closest("label").classList.add("hidden");
  els.unlockForm.querySelector("button").textContent = "回到 Zapp Store";
  els.unlockStatus.textContent = "请先在 Zapp Store 用 Face ID 打开一次；BOA Finance 不再单独输入密码。";
  els.unlockForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      window.location.href = "../";
    },
    { once: true },
  );
}

async function setupBiometricUnlock() {
  if (!hasBiometricRuntime()) {
    updateBiometricUI("这个浏览器暂不支持 Face ID / Touch ID 解锁。");
    return;
  }
  if (!lastUnlockPassword) {
    updateBiometricUI("请先用密码解锁一次，再启用 Face ID。");
    return;
  }

  els.biometricStatus.textContent = "正在请求系统面容验证...";
  try {
    const { credentialId, salt, secret } = await createBiometricSecret();
    const wrappedPassword = await encryptSavedPassword(lastUnlockPassword, secret);
    saveBiometricRecord({
      version: 1,
      credentialId: bytesToBase64Url(credentialId),
      salt: bytesToBase64(salt),
      wrappedPassword,
      createdAt: new Date().toISOString(),
      origin: window.location.origin,
    });
    lastUnlockPassword = "";
    updateBiometricUI("已启用。以后这台设备可用 Face ID / Touch ID 打开。");
  } catch (error) {
    console.error(error);
    updateBiometricUI("这台浏览器没有完成 Face ID 绑定；仍可用密码或系统密码管理器打开。");
  }
}

async function unlockWithBiometric(options = {}) {
  const record = loadBiometricRecord();
  if (!record) {
    if (!options.auto) updateBiometricUI("这台设备还没有启用 Face ID。请先用密码解锁一次。");
    return;
  }
  if (!hasBiometricRuntime()) {
    if (!options.auto) updateBiometricUI("这个浏览器暂不支持 Face ID / Touch ID 解锁。");
    return;
  }

  els.unlockStatus.textContent = "正在请求 Face ID...";
  const secret = await getBiometricSecret(record);
  const password = await decryptSavedPassword(record.wrappedPassword, secret);
  await unlockData(password, { source: "biometric" });
}

function resetBiometricUnlock() {
  localStorage.removeItem(BIOMETRIC_UNLOCK_KEY);
  updateBiometricUI("已移除这台设备的 Face ID 解锁。");
}

async function createBiometricSecret() {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "BOA Finance" },
      user: {
        id: userId,
        name: "boa-finance-local",
        displayName: "BOA Finance Local Unlock",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
      extensions: {
        prf: {
          eval: { first: salt },
        },
      },
    },
  });
  if (!credential) throw new Error("No credential created");

  const credentialId = new Uint8Array(credential.rawId);
  const results = credential.getClientExtensionResults?.();
  let secret = results?.prf?.results?.first;
  if (!secret) {
    secret = await getBiometricSecret({ credentialId: bytesToBase64(credentialId), salt: bytesToBase64(salt) });
  }
  if (!secret) throw new Error("PRF extension unavailable");
  return { credentialId, salt, secret };
}

async function getBiometricSecret(record) {
  const credentialId = base64UrlToBytes(record.credentialId);
  const credentialIdKey = base64ToBase64Url(record.credentialId);
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: "public-key", id: credentialId }],
      userVerification: "required",
      timeout: 60000,
      extensions: {
        prf: {
          evalByCredential: {
            [credentialIdKey]: { first: base64ToBytes(record.salt) },
          },
        },
      },
    },
  });
  const results = credential?.getClientExtensionResults?.();
  const secret = results?.prf?.results?.first;
  if (!secret) throw new Error("PRF extension unavailable");
  return secret;
}

async function encryptSavedPassword(password, secret) {
  const key = await crypto.subtle.importKey("raw", secret, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(password));
  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };
}

async function decryptSavedPassword(wrappedPassword, secret) {
  const key = await crypto.subtle.importKey("raw", secret, "AES-GCM", false, ["decrypt"]);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(wrappedPassword.iv) },
    key,
    base64ToBytes(wrappedPassword.ciphertext),
  );
  return new TextDecoder().decode(plainBuffer);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function bytesToBase64Url(value) {
  return bytesToBase64(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64ToBase64Url(value) {
  return value.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  return base64ToBytes(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}

function normalizeTransaction(item) {
  return {
    ...item,
    amount: Number(item.amount || 0),
    outflow_amount: Number(item.outflow_amount || 0),
    spend_amount: Number(item.spend_amount || 0),
    inflow_amount: Number(item.inflow_amount || 0),
  };
}

function bindEvents() {
  els.unlockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await unlockData(getStoreUnlockPassword(), { source: "store" });
  });

  els.biometricUnlock.addEventListener("click", () => unlockWithBiometric());
  els.biometricSetup.addEventListener("click", () => setupBiometricUnlock());
  els.biometricReset.addEventListener("click", () => resetBiometricUnlock());

  els.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.jump;
      render();
    });
  });

  document.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => applyQuestion(button.dataset.question));
  });

  els.questionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyQuestion(els.questionInput.value);
  });

  els.monthFilter.addEventListener("change", () => {
    state.month = els.monthFilter.value;
    state.view = "transactions";
    clearAnswer();
    render();
  });

  els.categoryFilter.addEventListener("change", () => {
    state.category = els.categoryFilter.value;
    state.view = "transactions";
    clearAnswer();
    render();
  });

  els.statusFilter.addEventListener("change", () => {
    state.status = els.statusFilter.value;
    state.view = "transactions";
    clearAnswer();
    render();
  });

  els.searchFilter.addEventListener("input", () => {
    state.search = els.searchFilter.value.trim();
    clearAnswer();
    renderTransactions();
  });

  els.manualServiceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(els.manualServiceForm);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const service = {
      id: `${Date.now()}`,
      name,
      monthly: String(form.get("monthly") || "").trim(),
      note: String(form.get("note") || "").trim() || "手动添加，等待下一次银行数据确认。",
    };
    saveManualServices([...loadManualServices(), service]);
    els.manualServiceForm.reset();
    renderServices();
  });

  els.manualServices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    const next = loadManualServices().filter((service) => service.id !== button.dataset.remove);
    saveManualServices(next);
    renderServices();
  });
}

function buildFilters() {
  const years = [...new Set(BOA_META.months.map((month) => month.slice(0, 4)))].sort();
  const months = ["all", ...years, ...BOA_META.months];
  els.monthFilter.innerHTML = months
    .map((month) => `<option value="${month}">${month === "all" ? "全部" : formatMonth(month)}</option>`)
    .join("");

  const groups = [...new Set(transactions.map((item) => item.category_group).filter(Boolean))].sort();
  const categories = [
    { value: "all", label: "全部" },
    { value: "service-like", label: "订阅/服务/水电网" },
    ...groups.map((group) => ({ value: `group:${group}`, label: labelGroup(group) })),
  ];
  els.categoryFilter.innerHTML = categories.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
}

function render() {
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
  Object.entries(els.views).forEach(([view, element]) => element.classList.toggle("hidden", view !== state.view));
  els.unlockPanel.classList.toggle("hidden", isUnlocked);

  renderStats();
  renderOverview();
  renderServices();
  renderTransactions();
  syncControls();
}

function renderStats() {
  if (!isUnlocked) {
    els.sourceBadge.textContent = "Encrypted";
    els.totalSpend.textContent = "Locked";
    els.foodSpend.textContent = "Locked";
    els.serviceSpend.textContent = "Locked";
    els.serviceCount.textContent = "-";
    els.totalMeta.textContent = "输入密码解锁";
    els.pendingMeta.textContent = "encrypted package";
    return;
  }

  const spendRows = transactions.filter((item) => item.spend_amount > 0);
  const foodRows = transactions.filter((item) => item.category_group === "food");
  const serviceRows = transactions.filter(isServiceLike);
  const detected = detectServices();

  els.totalSpend.textContent = money.format(sum(transactions, "spend_amount"));
  els.foodSpend.textContent = money.format(sum(foodRows, "spend_amount"));
  els.serviceSpend.textContent = money.format(sum(serviceRows, "spend_amount"));
  els.serviceCount.textContent = String(detected.length);
  els.sourceBadge.textContent = `${BOA_META.coverage} · ${BOA_META.postedCount} posted`;
  els.totalMeta.textContent = `${spendRows.length} 笔支出`;
  els.pendingMeta.textContent = `${BOA_META.pendingCount || 0} pending observed`;
}

function renderOverview() {
  if (!isUnlocked) {
    els.monthCards.innerHTML = `<div class="empty">输入密码后显示 BOA 总览。</div>`;
    els.categoryTotal.textContent = "$0.00";
    els.categoryBars.innerHTML = `<div class="empty">分类支出已加密。</div>`;
    els.recentList.innerHTML = `<div class="empty">最近交易已加密。</div>`;
    return;
  }

  const monthRows = BOA_META.months.map((month) => {
    const rows = transactions.filter((item) => item.month === month);
    const spendRows = rows.filter((item) => item.spend_amount > 0);
    return {
      month,
      spend: sum(rows, "spend_amount"),
      food: sum(rows.filter((item) => item.category_group === "food"), "spend_amount"),
      services: sum(rows.filter(isServiceLike), "spend_amount"),
      count: spendRows.length,
    };
  });

  els.monthCards.innerHTML = monthRows
    .map(
      (item) => `
        <article class="month-card">
          <header>
            <h2>${formatMonth(item.month)}</h2>
            <span class="status-pill">${item.count} 笔</span>
          </header>
          <strong>${money.format(item.spend)}</strong>
          <div class="month-metrics">
            <div><b>${money.format(item.food)}</b><span>吃饭</span></div>
            <div><b>${money.format(item.services)}</b><span>服务</span></div>
            <div><b>${money.format(item.spend - item.food - item.services)}</b><span>其他</span></div>
          </div>
        </article>
      `,
    )
    .join("");

  const rows = transactions.filter((item) => item.spend_amount !== 0);
  const groupTotals = groupBy(rows, (item) => labelGroup(item.category_group));
  const sorted = [...groupTotals.entries()]
    .map(([label, list]) => ({ label, total: sum(list, "spend_amount") }))
    .sort((a, b) => b.total - a.total);
  const max = Math.max(...sorted.map((item) => item.total), 1);

  els.categoryTotal.textContent = money.format(sum(rows, "spend_amount"));
  els.categoryBars.innerHTML = sorted
    .map(
      (item) => `
        <div class="bar-row">
          <span>${escapeHTML(item.label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, (item.total / max) * 100)}%"></div></div>
          <strong>${money.format(item.total)}</strong>
        </div>
      `,
    )
    .join("");

  els.recentList.innerHTML = transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
    .map(renderCompactTransaction)
    .join("");
}

function renderServices() {
  if (!isUnlocked) {
    els.serviceWindowTotal.textContent = "$0.00";
    els.serviceStatus.innerHTML = `<div><strong>Locked</strong><span>服务清单已加密</span></div>`;
    els.detectedServices.innerHTML = `<div class="empty">输入密码后显示服务/订阅。</div>`;
    els.manualServices.innerHTML = `<div class="empty">输入密码后显示待确认服务。</div>`;
    return;
  }

  const detected = detectServices();
  const total = sum(detected.flatMap((service) => service.transactions), "spend_amount");
  const last = detected
    .flatMap((service) => service.transactions)
    .map((item) => item.date)
    .sort()
    .at(-1);

  els.serviceWindowTotal.textContent = money.format(total);
  els.serviceStatus.innerHTML = `
    <div><strong>${detected.length}</strong><span>检测到的服务流</span></div>
    <div><strong>${money.format(total)}</strong><span>服务相关支出</span></div>
    <div><strong>${last ? shortDate(last) : "none"}</strong><span>最近一次服务扣款</span></div>
  `;

  els.detectedServices.innerHTML = detected.length
    ? detected.map(renderServiceCard).join("")
    : `<div class="empty">当前 BOA 数据里没有检测到服务扣款。</div>`;

  const manual = loadManualServices();
  els.manualServices.innerHTML = manual.length
    ? manual.map(renderManualCard).join("")
    : `<div class="empty">没有手动待确认服务。</div>`;
}

function renderTransactions() {
  if (!isUnlocked) {
    els.categoryTableTotal.textContent = "$0.00";
    els.categorySummaryTable.innerHTML = `<div class="empty">输入密码后显示分类汇总表。</div>`;
    els.transactionSummary.innerHTML = `<strong>Locked</strong><span>交易明细已加密</span>`;
    els.transactionList.innerHTML = `<div class="empty">输入密码后显示交易数据表。</div>`;
    renderAnswerResults();
    return;
  }

  const rows = filteredTransactions();
  const spend = sum(rows, "spend_amount");
  const outflow = sum(rows, "outflow_amount");
  const inflow = sum(rows, "inflow_amount");
  const sortedRows = rows.slice().sort((a, b) => b.date.localeCompare(a.date));

  renderCategorySummaryTable(rows);
  els.transactionSummary.innerHTML = `
    <strong>${rows.length} 笔 · spend ${money.format(spend)}</strong>
    <span>outflow ${money.format(outflow)} · inflow ${money.format(inflow)}</span>
  `;

  els.transactionList.innerHTML = rows.length
    ? renderTransactionTable(sortedRows)
    : `<div class="empty">没有匹配的交易。</div>`;

  if (state.answer) {
    els.answerLine.textContent = state.answer;
  }
  renderAnswerResults();
}

function applyQuestion(raw) {
  const text = String(raw || "").trim();
  if (!text) return;
  if (!isUnlocked) {
    state.pendingQuestion = text;
    state.answer = "先输入密码解锁，然后我会执行这个问题。";
    state.answerRows = [];
    state.answerKind = "";
    els.questionInput.value = text;
    renderAnswerResults();
    els.answerLine.textContent = state.answer;
    els.unlockPassword.focus();
    return;
  }

  const result = answerQuestion(text);
  applyAnswerResult(result);
  els.questionInput.value = text;
  render();
}

function applyAnswerResult(result) {
  state.month = result.month;
  state.category = result.category;
  state.search = result.search;
  state.status = result.status;
  state.view = result.view;
  state.answer = result.answer;
  state.answerRows = result.rows;
  state.answerKind = result.kind;
}

function answerQuestion(text) {
  const query = parseQuestion(text);
  const rows = rowsForQuery(query);
  const scope = describeScope(query);

  if (query.intent === "services") {
    const services = detectServices();
    const names = services.map((service) => service.name).join("、");
    return {
      ...query,
      view: "services",
      kind: "services",
      rows: services,
      answer: names ? `当前从 BOA 数据推断的服务：${names}。` : "当前 BOA 数据没有检测到服务扣款。",
    };
  }

  if (query.intent === "category") {
    const stats = getCategoryStats(rows);
    return {
      ...query,
      view: "transactions",
      kind: "category",
      rows: stats.slice(0, 8),
      answer: `${scope} 分类汇总：${money.format(sum(rows, "spend_amount"))}，覆盖 ${rows.length} 笔交易。`,
    };
  }

  if (query.intent === "top") {
    const topRows = rows
      .filter((item) => item.spend_amount > 0)
      .slice()
      .sort((a, b) => b.spend_amount - a.spend_amount)
      .slice(0, 8);
    const top = topRows[0];
    return {
      ...query,
      view: "transactions",
      kind: "transactions",
      rows: topRows,
      answer: top
        ? `${scope} 最大支出是 ${cleanDescription(top.description)}，${money.format(top.spend_amount)}，日期 ${top.date}。`
        : `${scope} 没有匹配的支出。`,
    };
  }

  const spend = sum(rows, "spend_amount");
  const outflow = sum(rows, "outflow_amount");
  const inflow = sum(rows, "inflow_amount");
  const avg = rows.length ? spend / rows.length : 0;
  const answer =
    query.intent === "count"
      ? `${scope} 共 ${rows.length} 笔，spend ${money.format(spend)}。`
      : query.intent === "average"
        ? `${scope} 平均每笔 spend ${money.format(avg)}，总 spend ${money.format(spend)}。`
        : `${scope}：spend ${money.format(spend)}，outflow ${money.format(outflow)}，inflow ${money.format(inflow)}，共 ${rows.length} 笔。`;

  return {
    ...query,
    view: "transactions",
    kind: "transactions",
    rows: rows.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    answer,
  };
}

function parseQuestion(text) {
  const lower = text.toLowerCase();
  const month = parseMonth(lower);
  const merchant = merchantFromQuestion(lower);
  const category = merchant ? "all" : categoryFromQuestion(text);
  const status = lower.includes("pending") || text.includes("未入账") ? "pending_observed" : "all";
  const search = merchant || "";
  let intent = "total";

  if (/(现在|哪些|清单|service list)/i.test(text) && /(服务|订阅|services|subscriptions|service list)/i.test(text) && !merchant) {
    intent = "services";
  } else if (/(分类|类别|汇总|category|breakdown|表格|数据表|table)/i.test(text)) {
    intent = "category";
  } else if (/(最大|最多|最高|最贵|top|largest|highest)/i.test(text)) {
    intent = "top";
  } else if (/(平均|average|avg)/i.test(text)) {
    intent = "average";
  } else if (/(几笔|多少笔|count)/i.test(text)) {
    intent = "count";
  }

  return { month, category, status, search, intent };
}

function rowsForQuery(query) {
  return transactions.filter((item) => {
    if (!matchesMonth(item, query.month)) return false;
    if (query.status !== "all" && item.status !== query.status) return false;
    if (!matchesCategory(item, query.category)) return false;
    if (!query.search) return true;
    return searchableText(item).includes(query.search.toLowerCase());
  });
}

function renderAnswerResults() {
  if (!state.answerRows.length || !state.answerKind) {
    els.answerResults.innerHTML = "";
    if (!state.answer) {
      els.answerLine.textContent = "数据已载入，可以直接问 2023-2026、任意月份、吃饭、OpenAI、最大支出或按分类汇总。";
    }
    return;
  }

  if (state.answerKind === "category") {
    els.answerResults.innerHTML = renderMiniCategoryTable(state.answerRows);
    return;
  }

  if (state.answerKind === "services") {
    els.answerResults.innerHTML = `
      <div class="answer-service-row">
        ${state.answerRows
          .slice(0, 9)
          .map((service) => `<span>${escapeHTML(service.name)} · ${money.format(service.total)}</span>`)
          .join("")}
      </div>
    `;
    return;
  }

  els.answerResults.innerHTML = renderMiniTransactionTable(state.answerRows);
}

function renderCategorySummaryTable(rows) {
  const stats = getCategoryStats(rows);
  const displayMonths = BOA_META.months.filter((month) => rows.some((item) => item.month === month));
  els.categoryTableTotal.textContent = money.format(sum(rows, "spend_amount"));

  if (!stats.length) {
    els.categorySummaryTable.innerHTML = `<div class="empty">没有可汇总的分类。</div>`;
    return;
  }

  els.categorySummaryTable.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>大类</th>
          <th>小类</th>
          ${displayMonths.map((month) => `<th>${formatShortMonth(month)}</th>`).join("")}
          <th>合计</th>
          <th>笔数</th>
          <th>最近</th>
        </tr>
      </thead>
      <tbody>
        ${stats
          .map(
            (item) => `
              <tr>
                <td>${escapeHTML(labelGroup(item.group))}</td>
                <td>${escapeHTML(labelCategory(item.category))}</td>
                ${displayMonths.map((month) => `<td class="numeric">${money.format(item.months[month] || 0)}</td>`).join("")}
                <td class="numeric strong">${money.format(item.total)}</td>
                <td class="numeric">${item.count}</td>
                <td>${shortDate(item.latestDate)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderTransactionTable(rows) {
  return `
    <div class="data-table-wrap">
      <table class="data-table transaction-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>商户 / 描述</th>
            <th>大类</th>
            <th>小类</th>
            <th>状态</th>
            <th>账户</th>
            <th>Spend</th>
            <th>Outflow</th>
            <th>Inflow</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (item) => `
                <tr>
                  <td>${shortDate(item.date)}</td>
                  <td class="merchant-cell">${escapeHTML(cleanDescription(item.description))}</td>
                  <td>${escapeHTML(labelGroup(item.category_group))}</td>
                  <td>${escapeHTML(labelCategory(item.category))}</td>
                  <td>${escapeHTML(item.status)}</td>
                  <td>${escapeHTML(item.account_last4)}</td>
                  <td class="numeric strong">${money.format(item.spend_amount)}</td>
                  <td class="numeric">${money.format(item.outflow_amount)}</td>
                  <td class="numeric">${money.format(item.inflow_amount)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderMiniCategoryTable(rows) {
  return `
    <table class="mini-table">
      <thead><tr><th>分类</th><th>笔数</th><th>合计</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (item) => `
              <tr>
                <td>${escapeHTML(labelGroup(item.group))} / ${escapeHTML(labelCategory(item.category))}</td>
                <td>${item.count}</td>
                <td>${money.format(item.total)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderMiniTransactionTable(rows) {
  return `
    <table class="mini-table">
      <thead><tr><th>日期</th><th>描述</th><th>分类</th><th>金额</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (item) => `
              <tr>
                <td>${shortDate(item.date)}</td>
                <td>${escapeHTML(cleanDescription(item.description))}</td>
                <td>${escapeHTML(labelGroup(item.category_group))}</td>
                <td>${money.format(item.spend_amount || item.outflow_amount || Math.abs(item.amount))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function getCategoryStats(rows) {
  return [...groupBy(rows.filter((item) => item.spend_amount !== 0), (item) => `${item.category_group}||${item.category}`).entries()]
    .map(([key, list]) => {
      const [group, category] = key.split("||");
      const months = {};
      BOA_META.months.forEach((month) => {
        months[month] = sum(list.filter((item) => item.month === month), "spend_amount");
      });
      return {
        group,
        category,
        months,
        total: sum(list, "spend_amount"),
        count: list.length,
        latestDate: list.map((item) => item.date).sort().at(-1),
      };
    })
    .sort((a, b) => b.total - a.total);
}

function clearAnswer() {
  state.answer = "";
  state.answerRows = [];
  state.answerKind = "";
}

function parseMonth(lower) {
  if (/(20\d{2})\s*(?:-|到|至|~)\s*(20\d{2})/.test(lower)) return "all";

  const yearMonth = lower.match(/(20\d{2})\s*(?:年|-|\/|\.)\s*(0?[1-9]|1[0-2])\s*月?/);
  if (yearMonth) return normalizeMonth(yearMonth[1], yearMonth[2]);

  const englishMonths = {
    january: "01",
    jan: "01",
    february: "02",
    feb: "02",
    march: "03",
    mar: "03",
    april: "04",
    apr: "04",
    may: "05",
    june: "06",
    jun: "06",
    july: "07",
    jul: "07",
    august: "08",
    aug: "08",
    september: "09",
    sep: "09",
    october: "10",
    oct: "10",
    november: "11",
    nov: "11",
    december: "12",
    dec: "12",
  };
  const year = lower.match(/\b(20\d{2})\b/)?.[1] || latestYear();
  const english = Object.entries(englishMonths).find(([name]) => lower.includes(name));
  if (english) return normalizeMonth(year, english[1]);

  const chineseMonth = lower.match(/(?:^|[^\d])([1-9]|1[0-2])\s*月/);
  if (chineseMonth) return normalizeMonth(year, chineseMonth[1]);

  const yearOnly = lower.match(/\b(20\d{2})\b/);
  if (yearOnly) return yearOnly[1];

  return "all";
}

function normalizeMonth(year, month) {
  return `${year}-${String(Number(month)).padStart(2, "0")}`;
}

function categoryFromQuestion(text) {
  if (/(吃饭|餐|饭|外卖|超市|food|dining|grocer|sweetgreen|tatte|pho|matcha|market)/i.test(text)) return "group:food";
  if (/(订阅|服务|软件|数字|网费|网络|手机|电费|subscription|service|software|utility|internet|mobile|electric)/i.test(text)) {
    return "service-like";
  }
  if (/(房租|租房|住房|rent|housing)/i.test(text)) return "group:housing";
  if (/(个人转账|朋友|people|person|venmo|zelle)/i.test(text)) return "group:people_payments";
  if (/(药|药房|健康|pharmacy|health)/i.test(text)) return "group:health_pharmacy";
  if (/(收入|利息收入|income)/i.test(text)) return "group:income";
  if (/(信用卡还款|还款|internal transfer|credit card payment)/i.test(text)) return "group:internal_transfer";
  if (/(费用|手续费|利息|fee|fees)/i.test(text)) return "group:fees_interest";
  if (/(购物|买东西|amazon|shopping|merchandise)/i.test(text)) return "group:shopping";
  if (/(交通|打车|地铁|火车|油费|uber|lyft|mbta|amtrak|transport|fuel|gas)/i.test(text)) return "group:transportation";
  if (/(旅行|酒店|机票|travel|hotel|airfare)/i.test(text)) return "group:travel";
  if (/(娱乐|演出|票|concert|ticket|event)/i.test(text)) return "group:entertainment";
  if (/(学费|学校|教育|berklee|education|school)/i.test(text)) return "group:education";
  return "all";
}

function describeScope(query) {
  const parts = [
    query.month === "all" ? "全部月份" : formatMonth(query.month),
    describeCategory(query.category),
    query.search ? `搜索 ${query.search}` : "",
    query.status === "all" ? "" : query.status,
  ].filter(Boolean);
  return parts.join(" · ") || "全部数据";
}

function searchableText(item) {
  return [item.description, item.account_name, item.account_last4, item.category_group, item.category, item.status]
    .join(" ")
    .toLowerCase();
}

function filteredTransactions() {
  const query = state.search.toLowerCase();
  return transactions.filter((item) => {
    if (!matchesMonth(item, state.month)) return false;
    if (state.status !== "all" && item.status !== state.status) return false;
    if (!matchesCategory(item, state.category)) return false;
    if (!query) return true;
    return searchableText(item).includes(query);
  });
}

function matchesMonth(item, month) {
  if (month === "all") return true;
  if (/^20\d{2}$/.test(month)) return item.month.startsWith(`${month}-`);
  return item.month === month;
}

function detectServices() {
  return SERVICE_RULES.map((rule) => {
    const serviceTransactions = transactions
      .filter((item) => rule.tokens.some((token) => item.description.toUpperCase().includes(token)))
      .filter((item) => item.spend_amount > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!serviceTransactions.length) return null;
    const last = serviceTransactions.at(-1);
    const active = daysSince(last.date) <= 45;
    const monthly = latestMonthTotal(serviceTransactions);
    return {
      ...rule,
      transactions: serviceTransactions,
      total: sum(serviceTransactions, "spend_amount"),
      latestMonthTotal: monthly.total,
      latestMonth: monthly.month,
      lastDate: last.date,
      active,
    };
  }).filter(Boolean);
}

function renderServiceCard(service) {
  const txList = service.transactions
    .slice()
    .reverse()
    .map(
      (item) => `
        <li>
          <b>${shortDate(item.date)}</b>
          <span>${escapeHTML(cleanDescription(item.description))}</span>
          <strong>${money.format(item.spend_amount)}</strong>
        </li>
      `,
    )
    .join("");

  return `
    <article class="service-card">
      <header>
        <div>
          <small>${escapeHTML(service.kind)} · ${escapeHTML(service.cadence)}</small>
          <h3>${escapeHTML(service.name)}</h3>
        </div>
        <span class="status-pill ${service.active ? "" : "warn"}">${service.active ? "活跃推断" : "待确认"}</span>
      </header>
      <div class="service-metrics">
        <div><b>${money.format(service.total)}</b><span>窗口总额</span></div>
        <div><b>${money.format(service.latestMonthTotal)}</b><span>${formatMonth(service.latestMonth)}</span></div>
        <div><b>${shortDate(service.lastDate)}</b><span>最近扣款</span></div>
      </div>
      <details>
        <summary>${service.transactions.length} 笔交易</summary>
        <ul>${txList}</ul>
      </details>
    </article>
  `;
}

function renderManualCard(service) {
  const monthly = service.monthly ? money.format(Number(service.monthly)) : "未填";
  return `
    <article class="manual-card">
      <header>
        <div>
          <small>Manual watchlist</small>
          <h3>${escapeHTML(service.name)}</h3>
        </div>
        <button type="button" class="remove-button" data-remove="${escapeHTML(service.id)}">移除</button>
      </header>
      <div class="service-metrics">
        <div><b>${monthly}</b><span>月费</span></div>
        <div><b>待确认</b><span>银行数据状态</span></div>
        <div><b>Local</b><span>保存位置</span></div>
      </div>
      <p>${escapeHTML(service.note || "手动记录，等待下一次账单确认。")}</p>
    </article>
  `;
}

function renderCompactTransaction(item) {
  return `
    <div class="compact-item">
      <div class="tx-date">${shortDate(item.date)}</div>
      <div>
        <strong>${escapeHTML(cleanDescription(item.description))}</strong>
        <span>${labelGroup(item.category_group)} · ${escapeHTML(item.status)}</span>
      </div>
      ${renderAmount(item)}
    </div>
  `;
}

function renderTransactionRow(item) {
  return `
    <div class="transaction-row">
      <div class="tx-date">${shortDate(item.date)}</div>
      <div>
        <strong>${escapeHTML(cleanDescription(item.description))}</strong>
        <span>${labelGroup(item.category_group)} / ${escapeHTML(item.category || "other")} · ${escapeHTML(item.account_name)} ${escapeHTML(item.account_last4)}</span>
      </div>
      ${renderAmount(item)}
    </div>
  `;
}

function renderAmount(item) {
  if (item.inflow_amount > 0 && item.outflow_amount === 0) {
    return `<strong class="amount inflow">+${money.format(item.inflow_amount)}</strong>`;
  }
  return `<strong class="amount outflow">${money.format(item.outflow_amount || Math.abs(item.amount))}</strong>`;
}

function syncControls() {
  els.monthFilter.value = state.month;
  els.categoryFilter.value = state.category;
  els.statusFilter.value = state.status;
  if (document.activeElement !== els.searchFilter) {
    els.searchFilter.value = state.search;
  }
}

function matchesCategory(item, category) {
  if (category === "all") return true;
  if (category === "service-like") return isServiceLike(item);
  const [type, value] = category.split(":");
  if (type === "group") return item.category_group === value;
  return true;
}

function isServiceLike(item) {
  return (
    item.category_group === "subscriptions" ||
    (item.category_group === "utilities" && ["internet", "mobile_phone", "electric"].includes(item.category))
  );
}

function latestMonthTotal(rows) {
  const months = [...new Set(rows.map((item) => item.month))].sort();
  const month = months.at(-1);
  return {
    month,
    total: sum(rows.filter((item) => item.month === month), "spend_amount"),
  };
}

function latestYear() {
  return BOA_META.months.at(-1)?.slice(0, 4) || new Date().getFullYear().toString();
}

function merchantFromQuestion(lower) {
  const map = [
    ["openai", "openai"],
    ["chatgpt", "openai"],
    ["apple", "apple"],
    ["music", "apple"],
    ["apple music", "apple"],
    ["suno", "suno"],
    ["splice", "splice"],
    ["atlassian", "atlassian"],
    ["uber one", "uber *one"],
    ["uber eats", "uber *eats"],
    ["uber", "uber"],
    ["starry", "starry"],
    ["tmobile", "tmobile"],
    ["t-mobile", "t-mobile"],
    ["eversource", "eversource"],
    ["sweetgreen", "sweetgreen"],
    ["tatte", "tatte"],
    ["pho basil", "pho basil"],
    ["matcha", "matcha"],
    ["g y symphony", "g & y symphony"],
    ["pro tools", "avid"],
    ["avid", "avid"],
    ["notability", "notability"],
  ];
  return map.find(([key]) => lower.includes(key))?.[1] || "";
}

function loadManualServices() {
  const saved = localStorage.getItem("boaFinance.manualServices");
  if (!saved) return DEFAULT_MANUAL_SERVICES;
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : DEFAULT_MANUAL_SERVICES;
  } catch {
    return DEFAULT_MANUAL_SERVICES;
  }
}

function saveManualServices(services) {
  localStorage.setItem("boaFinance.manualServices", JSON.stringify(services));
}

function groupBy(items, getKey) {
  const map = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function sum(rows, field) {
  return rows.reduce((total, item) => total + Number(item[field] || 0), 0);
}

function daysSince(dateText) {
  const then = new Date(`${dateText}T12:00:00`);
  const now = new Date(`${BOA_META.coverage.split(" to ").at(-1)}T12:00:00`);
  return Math.round((now - then) / 86400000);
}

function cleanDescription(description) {
  return String(description || "")
    .replace(/\s+/g, " ")
    .replace(/HELP\.UBER\.COMCA/g, "Uber Eats")
    .trim();
}

function shortDate(dateText) {
  return dateFormatter.format(new Date(`${dateText}T12:00:00`));
}

function formatMonth(month) {
  if (!month) return "当前月";
  if (month === "all") return "全部月份";
  if (/^20\d{2}$/.test(month)) return `${month}年`;
  const [year, value] = month.split("-");
  return `${year}年${Number(value)}月`;
}

function formatShortMonth(month) {
  const [, value] = month.split("-");
  return `${Number(value)}月`;
}

function labelGroup(group) {
  const labels = {
    adjustments: "调整",
    business_admin: "事务/行政",
    cash: "现金",
    education: "教育",
    entertainment: "娱乐",
    fees_interest: "费用/利息",
    food: "吃饭",
    health_pharmacy: "健康/药房",
    housing: "住房",
    income: "收入",
    internal_transfer: "内部转账",
    people_payments: "个人转账",
    personal_care: "个人护理",
    refunds_credits: "退款/返现",
    shopping: "购物",
    subscriptions: "订阅/软件",
    transfers: "资金转入转出",
    transportation: "交通",
    travel: "旅行",
    utilities: "水电网手机",
  };
  return labels[group] || group || "其他";
}

function labelCategory(category) {
  const labels = {
    airfare: "机票",
    apple_billing: "Apple 扣款",
    balance_adjustment: "余额调整",
    bank_fee: "银行手续费",
    cash_deposit: "现金存入",
    cash_withdrawal: "现金取出",
    credit_card_payment: "信用卡还款",
    delivery_membership: "外卖会员",
    digital: "数字服务",
    dining: "餐饮",
    electric: "电费",
    external_transfer: "外部转账",
    fees_interest: "费用/利息",
    fuel: "油费",
    gas: "燃气",
    general_merchandise: "综合购物",
    groceries: "超市/杂货",
    haircut: "理发",
    identity_admin: "身份/行政",
    investment_transfer: "投资转账",
    interest_income: "利息收入",
    live_events: "演出/票务",
    lodging: "住宿",
    internet: "网络",
    mobile_deposit: "移动存款",
    mobile_phone: "手机",
    online_merchandise: "线上购物",
    person_to_person: "个人转账",
    pharmacy: "药房",
    refund_or_credit: "退款/返现",
    rent: "房租",
    rideshare_transit: "打车/公共交通",
    school: "学校",
    shipping_printing: "寄送/打印",
    software: "软件",
    uncategorized: "未分类",
  };
  return labels[category] || category || "其他";
}

function describeCategory(category) {
  if (category === "all") return "";
  if (category === "service-like") return "订阅/服务/水电网";
  const [, value] = category.split(":");
  return labelGroup(value);
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
