const ENCRYPTED_DATA_URL = "ly-fund-data.enc.json?v=20260519enc1";
const STORE_SESSION_PASSWORD_KEY = "zappStore.sessionUnlockPassword.v1";
const SESSION_PAYLOAD_CACHE_KEY = "lyFund.decryptedPayload.v1";

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

const els = {
  unlockPanel: document.querySelector("#unlockPanel"),
  unlockForm: document.querySelector("#unlockForm"),
  unlockStatus: document.querySelector("#unlockStatus"),
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
  await loadEncryptedPackage();
}

async function loadEncryptedPackage() {
  try {
    const response = await fetch(ENCRYPTED_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    encryptedPackage = await response.json();
    els.unlockStatus.textContent = `加密数据包已载入：${encryptedPackage.label || "LY Fund"}。正在使用 Zapp Store 会话打开。`;
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
    if (!encryptedPackage) {
      await loadEncryptedPackage();
    }
    if (!encryptedPackage) {
      throw new Error("找不到加密数据包");
    }

    const cachedPayload = readCachedPayload(encryptedPackage);
    state.data = cachedPayload || (await decryptPackage(encryptedPackage, password));
    if (!cachedPayload) {
      writeCachedPayload(encryptedPackage, state.data);
    }
    state.filtersReady = false;
    els.unlockStatus.textContent = cachedPayload
      ? `已从 Zapp Store 会话缓存打开 ${state.data.summary.recordCount} 条记录。`
      : `已解锁 ${state.data.summary.recordCount} 条记录。`;
    els.unlockPanel.classList.add("hidden");
    populateFilters();
    render();
  } catch (error) {
    state.data = null;
    els.unlockStatus.textContent = "Zapp Store 会话无效，或数据包已损坏。请回到 Zapp Store 重新打开。";
    console.error(error);
  }
}

function bindEvents() {
  els.unlockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = getStoreUnlockPassword();
    if (!password) {
      window.location.href = "../";
      return;
    }
    unlockData(password);
  });

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

function getStoreUnlockPassword() {
  return sessionStorage.getItem(STORE_SESSION_PASSWORD_KEY) || "";
}

function requireStoreUnlock() {
  els.unlockForm.querySelector("button").textContent = "回到 Zapp Store";
  els.unlockStatus.textContent = "请先在 Zapp Store 用 Face ID 打开一次；LY Fund 会直接继承 Store 会话。";
}

function readCachedPayload(packageData) {
  try {
    const raw = sessionStorage.getItem(SESSION_PAYLOAD_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return matchesPackageSignature(cached?.package, packageData) ? cached.payload : null;
  } catch {
    return null;
  }
}

function writeCachedPayload(packageData, payload) {
  try {
    sessionStorage.setItem(
      SESSION_PAYLOAD_CACHE_KEY,
      JSON.stringify({
        version: 1,
        package: packageSignature(packageData),
        payload,
        cachedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // The app still works without the session cache; it only affects repeated unlock speed.
  }
}

function packageSignature(packageData) {
  return {
    version: packageData.version,
    label: packageData.label || "",
    iterations: packageData.iterations,
    hash: packageData.hash || "SHA-256",
    salt: packageData.salt,
    iv: packageData.iv,
    ciphertextLength: String(packageData.ciphertext || "").length,
  };
}

function matchesPackageSignature(signature, packageData) {
  if (!signature || !packageData) return false;
  const current = packageSignature(packageData);
  return Object.keys(current).every((key) => signature[key] === current[key]);
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
