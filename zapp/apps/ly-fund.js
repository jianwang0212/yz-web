const ENCRYPTED_DATA_URL = "ly-fund-data.enc.json?v=20260519enc1";
const BIOMETRIC_UNLOCK_KEY = "lyFund.biometricUnlock.v1";
const SHARED_BIOMETRIC_UNLOCK_KEYS = ["boaFinance.biometricUnlock.v1"];
const STORE_SESSION_PASSWORD_KEY = "zappStore.sessionUnlockPassword.v1";

const state = {
  view: "overview",
  metric: "balance",
  account: "all",
  month: "all",
  search: "",
  data: null,
  filtersReady: false,
};

let encryptedPackage = null;
let lastUnlockPassword = "";
let attemptedAutoBiometric = false;

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
  dataBadge: document.querySelector("#dataBadge"),
  summaryGrid: document.querySelector(".summary-grid"),
  tabs: [...document.querySelectorAll("[data-view]")],
  views: {
    overview: document.querySelector("#overviewView"),
    accounts: document.querySelector("#accountsView"),
    data: document.querySelector("#dataView"),
    downloads: document.querySelector("#downloadsView"),
  },
  totalBalance: document.querySelector("#totalBalance"),
  totalDate: document.querySelector("#totalDate"),
  totalProfit: document.querySelector("#totalProfit"),
  profitDate: document.querySelector("#profitDate"),
  dateRange: document.querySelector("#dateRange"),
  recordCount: document.querySelector("#recordCount"),
  sheetCount: document.querySelector("#sheetCount"),
  accountCount: document.querySelector("#accountCount"),
  overviewRange: document.querySelector("#overviewRange"),
  profitRange: document.querySelector("#profitRange"),
  totalBalanceChart: document.querySelector("#totalBalanceChart"),
  totalProfitChart: document.querySelector("#totalProfitChart"),
  latestDate: document.querySelector("#latestDate"),
  accountList: document.querySelector("#accountList"),
  quickDownloads: document.querySelector("#quickDownloads"),
  metricSelect: document.querySelector("#metricSelect"),
  accountMetricLabel: document.querySelector("#accountMetricLabel"),
  accountChartTitle: document.querySelector("#accountChartTitle"),
  accountRange: document.querySelector("#accountRange"),
  accountChart: document.querySelector("#accountChart"),
  monthTable: document.querySelector("#monthTable"),
  accountFilter: document.querySelector("#accountFilter"),
  monthFilter: document.querySelector("#monthFilter"),
  searchFilter: document.querySelector("#searchFilter"),
  tableCount: document.querySelector("#tableCount"),
  dataTable: document.querySelector("#dataTable"),
  downloadMeta: document.querySelector("#downloadMeta"),
  downloadList: document.querySelector("#downloadList"),
};

const accountColors = {
  总表: "#245f87",
  江凯: "#2f6f63",
  "银键键 银铮铮": "#ad7130",
  银子: "#b0414e",
};

const metricConfig = {
  balance: {
    label: "总余额",
    title: "各账户总余额折线图",
    recordKey: "总余额",
  },
  profit: {
    label: "净盈利",
    title: "各账户净盈利折线图",
    recordKey: "净盈利",
  },
  principal: {
    label: "总本金U",
    title: "各账户总本金折线图",
    recordKey: "总本金U",
  },
};

const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

init();

async function init() {
  bindEvents();
  renderShell();
  updateBiometricUI();
  await loadEncryptedPackage();
}

async function loadEncryptedPackage() {
  try {
    const response = await fetch(ENCRYPTED_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    encryptedPackage = await response.json();
    els.unlockStatus.textContent = `加密数据包已载入：${encryptedPackage.label || "LY Fund"}。正在使用 Zapp Store 会话打开。`;
    await unlockData(getStoreUnlockPassword(), { source: "store" });
  } catch (error) {
    els.dataBadge.textContent = "Load failed";
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

    state.data = await decryptPackage(encryptedPackage, password);
    state.filtersReady = false;
    lastUnlockPassword = options.source === "biometric" ? "" : password;
    els.unlockPassword.value = "";
    els.unlockStatus.textContent = `已解锁 ${state.data.summary.recordCount} 条记录。`;
    els.unlockPanel.classList.add("hidden");
    populateFilters();
    updateBiometricUI();
    render();
  } catch (error) {
    state.data = null;
    updateBiometricUI();
    els.unlockStatus.textContent = "密码不对，或数据包已损坏。";
    console.error(error);
  }
}

function bindEvents() {
  els.unlockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    unlockData(getStoreUnlockPassword(), { source: "store" });
  });

  els.biometricUnlock.addEventListener("click", () => unlockWithBiometric());
  els.biometricSetup.addEventListener("click", () => setupBiometricUnlock());
  els.biometricReset.addEventListener("click", () => resetBiometricUnlock());

  els.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      renderShell();
    });
  });

  els.metricSelect.addEventListener("change", () => {
    if (!state.data) return;
    state.metric = els.metricSelect.value;
    renderAccounts();
  });

  els.accountFilter.addEventListener("change", () => {
    if (!state.data) return;
    state.account = els.accountFilter.value;
    renderDataTable();
  });

  els.monthFilter.addEventListener("change", () => {
    if (!state.data) return;
    state.month = els.monthFilter.value;
    renderDataTable();
  });

  els.searchFilter.addEventListener("input", () => {
    if (!state.data) return;
    state.search = els.searchFilter.value.trim().toLowerCase();
    renderDataTable();
  });
}

function populateFilters() {
  if (!state.data || state.filtersReady) return;
  const accounts = state.data.summary.accounts || [];
  const months = [...new Set(state.data.records.map((row) => row.date?.slice(0, 7)).filter(Boolean))].sort().reverse();

  els.accountFilter.replaceChildren(option("all", "全部账户"), ...accounts.map((account) => option(account, account)));
  els.monthFilter.replaceChildren(option("all", "全部月份"), ...months.map((month) => option(month, month)));
  state.filtersReady = true;
}

function option(value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  return item;
}

function render() {
  if (!state.data) return;
  renderShell();
  renderSummary();
  renderOverview();
  renderAccounts();
  renderDataTable();
  renderDownloads();
}

function renderShell() {
  els.tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
  els.summaryGrid.classList.toggle("hidden", !state.data);
  Object.entries(els.views).forEach(([view, section]) => {
    section.classList.toggle("hidden", !state.data || view !== state.view);
  });
  if (!state.data) {
    els.dataBadge.textContent = "Encrypted";
    return;
  }
  const { summary } = state.data;
  els.dataBadge.textContent = `${summary.dateStart} - ${summary.dateEnd}`;
}

function renderSummary() {
  const { summary, latest } = state.data;
  const total = latest["总表"] || {};
  els.totalBalance.textContent = `${formatMoney(total.balance)} U`;
  els.totalDate.textContent = `截至 ${formatDate(total.date)}`;
  els.totalProfit.textContent = signedMoney(total.profit);
  els.totalProfit.className = signClass(total.profit);
  els.profitDate.textContent = `截至 ${formatDate(total.date)}`;
  els.dateRange.textContent = `${summary.dateStart.slice(0, 7)} → ${summary.dateEnd.slice(0, 7)}`;
  els.recordCount.textContent = `${formatMoney(summary.recordCount)} 条清洗记录`;
  els.sheetCount.textContent = `${summary.rawSheetCount} 张`;
  els.accountCount.textContent = `${summary.accounts.length} 个账户`;
}

function renderOverview() {
  const totalRows = state.data.series["总表"] || [];
  const range = seriesRange(totalRows);
  els.overviewRange.textContent = range;
  els.profitRange.textContent = range;
  els.totalBalanceChart.innerHTML = lineChart(
    [{ name: "基金总余额", color: accountColors["总表"], rows: totalRows }],
    "balance",
    {
      id: "total-balance",
      height: 400,
      valueFormat: (value) => `${formatCompact(value)} U`,
    },
  );
  els.totalProfitChart.innerHTML = lineChart(
    [{ name: "总表净盈利", color: "#ad7130", rows: totalRows }],
    "profit",
    {
      id: "total-profit",
      height: 300,
      valueFormat: (value) => `${formatCompact(value)} U`,
    },
  );
  renderAccountList();
  renderDownloadCards(els.quickDownloads, true);
}

function renderAccountList() {
  const latest = state.data.latest;
  const rows = state.data.summary.accounts.map((account) => ({ account, ...(latest[account] || {}) }));
  const latestDates = rows.map((row) => row.date).filter(Boolean).sort();
  els.latestDate.textContent = latestDates.at(-1) || "--";
  els.accountList.replaceChildren(
    ...rows.map((row) => {
      const item = document.createElement("article");
      item.className = "account-row";

      const text = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = row.account;
      const meta = document.createElement("small");
      meta.textContent = `${formatDate(row.date)} · 净盈利 ${signedMoney(row.profit)}`;
      meta.className = signClass(row.profit);
      text.append(name, meta);

      const value = document.createElement("strong");
      value.textContent = `${formatMoney(row.balance)} U`;
      value.style.color = accountColors[row.account] || "#17201d";

      item.append(text, value);
      return item;
    }),
  );
}

function renderAccounts() {
  const config = metricConfig[state.metric];
  els.accountMetricLabel.textContent = config.label;
  els.accountChartTitle.textContent = config.title;

  const chartRows = state.data.summary.accounts.map((account) => ({
    name: account,
    color: accountColors[account] || "#69736d",
    rows: state.data.series[account] || [],
  }));
  const allRows = chartRows.flatMap((series) => series.rows);
  els.accountRange.textContent = seriesRange(allRows);
  els.accountChart.innerHTML = lineChart(chartRows, state.metric, {
    id: `account-${state.metric}`,
    height: 400,
    valueFormat: (value) => `${formatCompact(value)} U`,
  });
  renderMonthTable();
}

function renderMonthTable() {
  const rows = [...state.data.monthly]
    .sort((a, b) => `${b.month}-${b.account}`.localeCompare(`${a.month}-${a.account}`))
    .slice(0, 96);
  els.monthTable.innerHTML = table(
    ["月份", "日期", "账户", "月末余额", "净盈利"],
    rows.map((row) => [
      row.month,
      row.date,
      row.account,
      `${formatMoney(row.balance)} U`,
      signedMoney(row.profit),
    ]),
    [false, false, false, true, true],
  );
}

function renderDataTable() {
  if (!state.data) return;
  const rows = filteredRecords();
  els.tableCount.textContent = `${formatMoney(rows.length)} 条`;
  const recent = rows.slice(0, 220);
  els.dataTable.innerHTML = table(
    ["日期", "账户", "页签", "区块", "总余额", "净盈利", "总本金U", "本金转入", "Arb", "Futu JK", "Futu LJL", "美股", "数字货币"],
    recent.map((row) => [
      row.date,
      row.account,
      row.sheet,
      row.block_title,
      formatCellMoney(row["总余额"]),
      signedCellMoney(row["净盈利"]),
      formatCellMoney(row["总本金U"]),
      formatCellMoney(row["本金转入"]),
      formatCellMoney(row.Arb),
      formatCellMoney(row["Futu JK"]),
      formatCellMoney(row["Futu LJL"]),
      formatCellMoney(row["美股"]),
      formatCellMoney(row["数字货币"]),
    ]),
    [false, false, false, false, true, true, true, true, true, true, true, true, true],
  );
}

function filteredRecords() {
  return [...state.data.records]
    .filter((row) => state.account === "all" || row.account === state.account)
    .filter((row) => state.month === "all" || row.date?.startsWith(state.month))
    .filter((row) => {
      if (!state.search) return true;
      return [
        row.date,
        row.account,
        row.sheet,
        row.block_title,
        ...Object.keys(row),
        ...Object.values(row),
      ]
        .join(" ")
        .toLowerCase()
        .includes(state.search);
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.account || "").localeCompare(b.account || ""));
}

function renderDownloads() {
  const { summary } = state.data;
  els.downloadMeta.textContent = "线上仅保留加密包";
  renderDownloadCards(els.downloadList, false);
}

function renderDownloadCards(target, compact) {
  const rows = [
    ["加密数据包", "手机 Zapp 在线加载并在浏览器内解密"],
    ["Excel / CSV / TSV", state.data.summary.localExportPath || "已保存在本机 LYFund/yuque_table_exports"],
  ];
  target.replaceChildren(
    ...rows.map(([label, description]) => {
      const card = document.createElement("article");
      card.className = "download-card";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = label;
      const desc = document.createElement("small");
      desc.textContent = compact && label !== "加密数据包" ? "本机文件" : description;
      copy.append(title, desc);
      card.append(copy);
      return card;
    }),
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

async function maybeAutoBiometricUnlock() {
  return;
  if (attemptedAutoBiometric || state.data || !loadBiometricRecord()) return;
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
  for (const key of [BIOMETRIC_UNLOCK_KEY, ...SHARED_BIOMETRIC_UNLOCK_KEYS]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const record = JSON.parse(raw);
      if (record?.version === 1 && record.credentialId && record.salt && record.wrappedPassword) {
        return { ...record, storageKey: key, shared: key !== BIOMETRIC_UNLOCK_KEY };
      }
    } catch {
      // Ignore malformed local records and keep looking for another usable one.
    }
  }
  return null;
}

function saveBiometricRecord(record) {
  localStorage.setItem(BIOMETRIC_UNLOCK_KEY, JSON.stringify(record));
}

function updateBiometricUI(message = "") {
  els.biometricUnlock.classList.add("hidden");
  els.deviceUnlockPanel.classList.add("hidden");
  els.biometricSetup.classList.add("hidden");
  els.biometricReset.classList.add("hidden");
  if (message && !state.data) els.unlockStatus.textContent = message;
  return;
  const record = loadBiometricRecord();
  const runtime = hasBiometricRuntime();
  const isUnlocked = Boolean(state.data);
  const hasOwnRecord = record && !record.shared;

  els.biometricUnlock.classList.toggle("hidden", isUnlocked || !record || !runtime);
  els.deviceUnlockPanel.classList.toggle("hidden", !isUnlocked || !runtime);
  els.biometricSetup.classList.toggle("hidden", Boolean(hasOwnRecord));
  els.biometricReset.classList.toggle("hidden", !hasOwnRecord);

  if (!runtime) {
    if (!isUnlocked) els.unlockStatus.textContent = els.unlockStatus.textContent || "这个浏览器暂不支持设备面容解锁。";
    return;
  }

  if (!message && !isUnlocked && record) {
    els.unlockStatus.textContent = record.shared
      ? "已找到 BOA Finance 的 Face ID 记录，可直接打开。"
      : "Face ID 已启用，可直接打开。";
  }

  if (isUnlocked) {
    els.biometricStatus.textContent =
      message ||
      (hasOwnRecord
        ? "Face ID / Touch ID 已为 LY Fund 启用。"
        : record?.shared
          ? "可直接使用 BOA Finance 的 Face ID 记录；也可以为 LY Fund 单独启用。"
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
  els.unlockStatus.textContent = "请先在 Zapp Store 用 Face ID 打开一次；LY Fund 不再单独输入密码。";
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
    updateBiometricUI("已启用。以后这台设备可用 Face ID / Touch ID 打开 LY Fund。");
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
  updateBiometricUI("已移除这台设备的 LY Fund Face ID 解锁。");
}

async function createBiometricSecret() {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "LY Fund" },
      user: {
        id: userId,
        name: "ly-fund-local",
        displayName: "LY Fund Local Unlock",
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
    secret = await getBiometricSecret({ credentialId: bytesToBase64Url(credentialId), salt: bytesToBase64(salt) });
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

function lineChart(seriesList, key, options = {}) {
  const parsed = seriesList
    .map((series) => ({
      ...series,
      points: series.rows
        .map((row) => ({
          date: row.date,
          x: Date.parse(`${row.date}T00:00:00`),
          value: numberOrNull(row[key]),
        }))
        .filter((point) => Number.isFinite(point.x) && point.value !== null),
    }))
    .filter((series) => series.points.length);

  const allPoints = parsed.flatMap((series) => series.points);
  if (!allPoints.length) return `<div class="empty-state">No chart data</div>`;

  const width = 1000;
  const height = options.height || 360;
  const pad = { top: 24, right: 82, bottom: 46, left: 78 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const minX = Math.min(...allPoints.map((point) => point.x));
  const maxX = Math.max(...allPoints.map((point) => point.x));
  const minY = Math.min(...allPoints.map((point) => point.value));
  const maxY = Math.max(...allPoints.map((point) => point.value));
  const yExtra = Math.max((maxY - minY) * 0.12, Math.abs(maxY || 1) * 0.006, 1);
  const lo = minY - yExtra;
  const hi = maxY + yExtra;
  const xSpan = Math.max(maxX - minX, 1);
  const ySpan = Math.max(hi - lo, 1);
  const xAt = (x) => pad.left + ((x - minX) * plotW) / xSpan;
  const yAt = (value) => pad.top + ((hi - value) * plotH) / ySpan;
  const yTicks = Array.from({ length: 5 }, (_, index) => lo + ((hi - lo) * index) / 4);
  const xTicks = dateTicks(minX, maxX, 6);
  const gradientId = `${options.id || key}-fill`.replace(/[^a-zA-Z0-9_-]/g, "-");

  const paths = parsed
    .map((series) => {
      const points = series.points.map((point) => `${xAt(point.x).toFixed(2)},${yAt(point.value).toFixed(2)}`).join(" ");
      const latest = series.points.at(-1);
      return `
        <polyline class="line" points="${points}" stroke="${series.color}"/>
        <circle cx="${xAt(latest.x).toFixed(2)}" cy="${yAt(latest.value).toFixed(2)}" r="4.8" fill="${series.color}" stroke="#fff" stroke-width="3"/>
      `;
    })
    .join("");

  const firstSeries = parsed[0];
  const areaPoints = firstSeries.points.map((point) => `${xAt(point.x).toFixed(2)},${yAt(point.value).toFixed(2)}`).join(" ");
  const area = `${pad.left},${pad.top + plotH} ${areaPoints} ${pad.left + plotW},${pad.top + plotH}`;

  const svg = `
    <svg class="chart" viewBox="0 0 ${width} ${height}" aria-label="${escapeHtml(options.id || key)} line chart">
      <defs>
        <linearGradient id="${gradientId}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="${firstSeries.color}" stop-opacity="0.14"/>
          <stop offset="1" stop-color="${firstSeries.color}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#fbfcf8"/>
      ${yTicks
        .map((value) => {
          const y = yAt(value);
          return `<line class="grid" x1="${pad.left}" y1="${y.toFixed(2)}" x2="${pad.left + plotW}" y2="${y.toFixed(2)}"/><text x="${pad.left - 12}" y="${(y + 4).toFixed(2)}" text-anchor="end">${escapeHtml(options.valueFormat ? options.valueFormat(value) : formatCompact(value))}</text>`;
        })
        .join("")}
      <line class="axis" x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}"/>
      <polygon points="${area}" fill="url(#${gradientId})"/>
      ${paths}
      ${xTicks
        .map((tick) => `<text x="${xAt(tick).toFixed(2)}" y="${height - 16}" text-anchor="middle">${escapeHtml(formatMonth(tick))}</text>`)
        .join("")}
    </svg>
  `;

  const legend = `<div class="legend">${parsed
    .map((series) => `<span><i style="background:${series.color}"></i>${escapeHtml(series.name)}</span>`)
    .join("")}</div>`;
  return `${svg}${legend}`;
}

function table(headers, rows, numeric = []) {
  if (!rows.length) return `<div class="empty-state">No rows</div>`;
  return `
    <table>
      <thead>
        <tr>${headers.map((header, index) => `<th class="${numeric[index] ? "num" : ""}">${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${row
                .map((cell, index) => `<td class="${numeric[index] ? `num ${valueClass(cell)}` : ""}">${escapeHtml(cell ?? "")}</td>`)
                .join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function seriesRange(rows) {
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  return dates.length ? `${dates[0]} - ${dates.at(-1)}` : "--";
}

function dateTicks(minX, maxX, count) {
  if (minX === maxX) return [minX];
  return Array.from({ length: count }, (_, index) => minX + ((maxX - minX) * index) / (count - 1));
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMoney(value) {
  const number = numberOrNull(value);
  return number === null ? "--" : numberFmt.format(number);
}

function formatCompact(value) {
  const number = numberOrNull(value);
  return number === null ? "--" : compactFmt.format(number);
}

function signedMoney(value) {
  const number = numberOrNull(value);
  if (number === null) return "--";
  return `${number >= 0 ? "+" : ""}${numberFmt.format(number)} U`;
}

function formatCellMoney(value) {
  const number = numberOrNull(value);
  return number === null ? "--" : numberFmt.format(number);
}

function signedCellMoney(value) {
  const number = numberOrNull(value);
  if (number === null) return "--";
  return `${number >= 0 ? "+" : ""}${numberFmt.format(number)}`;
}

function formatDate(value) {
  return value || "--";
}

function formatMonth(ms) {
  const date = new Date(ms);
  if (Number.isNaN(date.valueOf())) return "--";
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

function signClass(value) {
  const number = numberOrNull(value);
  if (number === null || number === 0) return "";
  return number > 0 ? "positive" : "negative";
}

function valueClass(value) {
  const text = String(value);
  if (text.startsWith("+")) return "positive";
  if (text.startsWith("-")) return "negative";
  return "";
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
