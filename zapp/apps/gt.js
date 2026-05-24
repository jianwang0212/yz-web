const DATA_URL = "gt-data.json?v=20260524";

const state = {
  view: "overview",
  interval: "daily",
  metric: "assetNetValue",
  search: "",
  data: null,
};

const els = {
  dataBadge: document.querySelector("#dataBadge"),
  tabs: [...document.querySelectorAll("[data-view]")],
  views: {
    overview: document.querySelector("#overviewView"),
    history: document.querySelector("#historyView"),
    remarks: document.querySelector("#remarksView"),
    data: document.querySelector("#dataView"),
  },
  totalAsset: document.querySelector("#totalAsset"),
  assetDate: document.querySelector("#assetDate"),
  netValue: document.querySelector("#netValue"),
  netMeta: document.querySelector("#netMeta"),
  sixtyChange: document.querySelector("#sixtyChange"),
  sixtyMeta: document.querySelector("#sixtyMeta"),
  todayProfit: document.querySelector("#todayProfit"),
  profitMeta: document.querySelector("#profitMeta"),
  overviewWindow: document.querySelector("#overviewWindow"),
  overviewLineChart: document.querySelector("#overviewLineChart"),
  overviewChangeChart: document.querySelector("#overviewChangeChart"),
  exchangeTotal: document.querySelector("#exchangeTotal"),
  allocationList: document.querySelector("#allocationList"),
  remarkCount: document.querySelector("#remarkCount"),
  latestRemarks: document.querySelector("#latestRemarks"),
  intervalButtons: [...document.querySelectorAll("[data-interval]")],
  metricSelect: document.querySelector("#metricSelect"),
  historyLabel: document.querySelector("#historyLabel"),
  historyTitle: document.querySelector("#historyTitle"),
  historyRange: document.querySelector("#historyRange"),
  historyChart: document.querySelector("#historyChart"),
  historySearch: document.querySelector("#historySearch"),
  historyTable: document.querySelector("#historyTable"),
  remarksTotal: document.querySelector("#remarksTotal"),
  allRemarks: document.querySelector("#allRemarks"),
  exportCount: document.querySelector("#exportCount"),
  exportTable: document.querySelector("#exportTable"),
  structuredAt: document.querySelector("#structuredAt"),
  coverageGrid: document.querySelector("#coverageGrid"),
  exchangeTable: document.querySelector("#exchangeTable"),
};

const money = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: "always",
});

const plain = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

const metricLabels = {
  assetNetValue: "基金净值",
  totalAsset: "总资产",
  todayProfit: "当期盈亏",
  btcAssetNetValue: "BTC 净值",
};

init();

async function init() {
  bindEvents();
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    render();
  } catch (error) {
    els.dataBadge.textContent = "Load failed";
    document.querySelector(".gt-shell").insertAdjacentHTML(
      "beforeend",
      `<div class="empty-state">GT 数据加载失败：${escapeHtml(error.message)}</div>`,
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

  els.intervalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.interval = button.dataset.interval;
      render();
    });
  });

  els.metricSelect.addEventListener("change", () => {
    state.metric = els.metricSelect.value;
    render();
  });

  els.historySearch.addEventListener("input", () => {
    state.search = els.historySearch.value.trim().toLowerCase();
    renderHistoryTable();
  });
}

function render() {
  if (!state.data) return;
  renderShell();
  renderSummary();
  renderOverview();
  renderHistory();
  renderRemarks();
  renderDataView();
}

function renderShell() {
  els.tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
  Object.entries(els.views).forEach(([view, section]) => {
    section.classList.toggle("hidden", view !== state.view);
  });
  els.intervalButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.interval === state.interval);
  });
  els.dataBadge.textContent = `${state.data.meta.account} · ${formatShortDate(state.data.current.date)}`;
}

function renderSummary() {
  const latest = latestDaily();
  const last60 = state.data.stats.last60Daily;
  els.totalAsset.textContent = `${formatMoney(state.data.current.totalAsset)} U`;
  els.assetDate.textContent = formatDate(state.data.current.date);
  els.netValue.textContent = formatDecimal(latest.assetNetValue, 4);
  els.netMeta.textContent = `${state.data.stats.daily.count} daily rows`;
  els.sixtyChange.textContent = formatPercent(last60.periodPctChange);
  els.sixtyChange.className = signClass(last60.periodPctChange);
  els.sixtyMeta.textContent = `${formatDate(last60.startDate)} - ${formatDate(last60.endDate)}`;
  els.todayProfit.textContent = `${formatMoney(latest.todayProfit)} U`;
  els.todayProfit.className = signClass(latest.todayProfit);
  els.profitMeta.textContent = `${formatPercent(latest.pctChange)} vs prev`;
}

function renderOverview() {
  const rows = state.data.series.last60Daily;
  const stats = state.data.stats.last60Daily;
  els.overviewWindow.textContent = `${formatDate(stats.startDate)} - ${formatDate(stats.endDate)}`;
  els.overviewLineChart.innerHTML = lineChart(rows, "assetNetValue", {
    title: "Net Value",
    color: "#2563eb",
    valueFormat: (value) => formatDecimal(value, 4),
  });
  els.overviewChangeChart.innerHTML = barChart(rows, "pctChange", {
    title: "Daily %",
    valueFormat: (value) => formatPercent(value),
  });
  renderAllocation();
  renderLatestRemarks();
}

function renderAllocation() {
  const rows = [...state.data.current.exchangeAssets].sort((a, b) => b.exchangeAsset - a.exchangeAsset);
  els.exchangeTotal.textContent = `${formatMoney(state.data.current.totalAsset)} U`;
  els.allocationList.replaceChildren(
    ...rows.map((row) => {
      const item = document.createElement("div");
      item.className = "allocation-row";
      const name = document.createElement("strong");
      name.textContent = row.platform;
      const track = document.createElement("div");
      track.className = "allocation-track";
      const bar = document.createElement("div");
      bar.className = "allocation-bar";
      bar.style.width = `${Math.max(0, Math.min(100, row.share || 0))}%`;
      track.append(bar);
      const value = document.createElement("span");
      value.textContent = `${formatMoney(row.exchangeAsset)} · ${formatPercent(row.share, false)}`;
      item.append(name, track, value);
      return item;
    }),
  );
}

function renderLatestRemarks() {
  const rows = [...state.data.remarks].slice(-4).reverse();
  els.remarkCount.textContent = `${state.data.remarks.length} 条`;
  els.latestRemarks.replaceChildren(...rows.map(renderRemarkItem));
}

function renderHistory() {
  const rows = activeRows();
  const label = state.interval === "daily" ? "Daily" : state.interval === "weekly" ? "Weekly" : "Monthly";
  els.historyLabel.textContent = label;
  els.historyTitle.textContent = metricLabels[state.metric] || state.metric;
  els.historyRange.textContent = rows.length ? `${formatDate(rows[0].date)} - ${formatDate(rows.at(-1).date)}` : "--";
  els.historyChart.innerHTML = lineChart(rows, state.metric, {
    title: metricLabels[state.metric],
    color: state.metric === "todayProfit" ? "#a96920" : state.metric.startsWith("btc") ? "#dc2626" : "#2f6f63",
    valueFormat: (value) => (state.metric.includes("Profit") || state.metric === "totalAsset" ? formatMoney(value) : formatDecimal(value, 4)),
  });
  renderHistoryTable();
}

function renderHistoryTable() {
  const rows = activeRows().filter((row) => {
    if (!state.search) return true;
    return `${row.date} ${row.remark || ""}`.toLowerCase().includes(state.search);
  });
  const recent = rows.slice(-90).reverse();
  els.historyTable.innerHTML = table(
    ["日期", "总资产", "净值", "变化", "盈亏", "BTC净值", "备注"],
    recent.map((row) => [
      row.date,
      formatMoney(row.totalAsset),
      formatDecimal(row.assetNetValue, 4),
      formatPercent(row.pctChange),
      signedMoney(row.todayProfit),
      row.btcAssetNetValue ? formatDecimal(row.btcAssetNetValue, 4) : "--",
      row.remark || "",
    ]),
    [false, true, true, true, true, true, false],
  );
}

function renderRemarks() {
  els.remarksTotal.textContent = `${state.data.remarks.length} 条`;
  els.allRemarks.replaceChildren(...[...state.data.remarks].reverse().map(renderRemarkItem));
  els.exportCount.textContent = `${state.data.exportRows.length} 行`;
  els.exportTable.innerHTML = table(
    ["日期", "总资产", "备注", "ETH价格"],
    state.data.exportRows.map((row) => [
      row.date,
      formatMoney(row.totalAsset),
      row.remark || "",
      row.ethPrice ? formatMoney(row.ethPrice) : "--",
    ]),
    [false, true, false, true],
  );
}

function renderDataView() {
  const meta = state.data.meta;
  els.structuredAt.textContent = formatDateTime(meta.structuredAt);
  const cards = [
    ["日线", `${state.data.stats.daily.count} rows`, `${formatDate(state.data.stats.daily.startDate)} - ${formatDate(state.data.stats.daily.endDate)}`],
    ["周线", `${state.data.stats.weekly.count} rows`, `${formatDate(state.data.stats.weekly.startDate)} - ${formatDate(state.data.stats.weekly.endDate)}`],
    ["月线", `${state.data.stats.monthly.count} rows`, `${formatDate(state.data.stats.monthly.startDate)} - ${formatDate(state.data.stats.monthly.endDate)}`],
    ["BTC 对照", `${state.data.stats.btcComparisonDays} days`, "365 天历史中非零"],
    ["备注", `${state.data.stats.remarksCount} events`, "资金出入记录"],
    ["Excel", `${state.data.stats.exportRowsCount} rows`, "2026-05 export"],
    ["baseAsset", `${state.data.stats.baseAssetDays} days`, "365 天历史中非零"],
    ["交易所", `${state.data.current.exchangeAssets.length} rows`, "当前快照"],
  ];
  els.coverageGrid.replaceChildren(
    ...cards.map(([label, value, sub]) => {
      const card = document.createElement("article");
      card.className = "coverage-card";
      card.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><span>${escapeHtml(sub)}</span>`;
      return card;
    }),
  );
  els.exchangeTable.innerHTML = table(
    ["平台", "资产价值(U)", "占比"],
    state.data.current.exchangeAssets.map((row) => [
      row.platform,
      formatMoney(row.exchangeAsset),
      formatPercent(row.share, false),
    ]),
    [false, true, true],
  );
}

function renderRemarkItem(row) {
  const item = document.createElement("article");
  item.className = "remark-item";
  const date = document.createElement("time");
  date.textContent = row.date;
  const body = document.createElement("strong");
  body.textContent = row.remark;
  const profit = document.createElement("span");
  profit.textContent = signedMoney(row.todayProfit);
  profit.className = signClass(row.todayProfit);
  item.append(date, body, profit);
  return item;
}

function activeRows() {
  return state.data.series[state.interval] || [];
}

function latestDaily() {
  return state.data.series.daily.at(-1) || {};
}

function lineChart(rows, key, options = {}) {
  const values = rows.map((row) => numberOrNull(row[key]));
  const valid = values.filter((value) => value !== null);
  if (!rows.length || !valid.length) return `<div class="empty-state">No chart data</div>`;

  const width = 1000;
  const height = 360;
  const pad = { top: 26, right: 24, bottom: 44, left: 72 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const extra = Math.max((max - min) * 0.1, Math.abs(max || 1) * 0.003, 0.01);
  const lo = min - extra;
  const hi = max + extra;
  const xAt = (index) => pad.left + (rows.length === 1 ? plotW / 2 : (index * plotW) / (rows.length - 1));
  const yAt = (value) => pad.top + ((hi - value) * plotH) / (hi - lo);
  const points = rows
    .map((row, index) => {
      const value = numberOrNull(row[key]);
      return value === null ? null : `${xAt(index).toFixed(2)},${yAt(value).toFixed(2)}`;
    })
    .filter(Boolean)
    .join(" ");
  const yTicks = Array.from({ length: 5 }, (_, index) => lo + ((hi - lo) * index) / 4);
  const xTicks = chooseTicks(rows, 6);
  const latestIndex = rows.length - 1;
  const latestValue = numberOrNull(rows[latestIndex][key]);
  const latestX = xAt(latestIndex);
  const latestY = latestValue === null ? pad.top : yAt(latestValue);
  const area = `${pad.left},${pad.top + plotH} ${points} ${pad.left + plotW},${pad.top + plotH}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" aria-label="${escapeHtml(options.title || key)} line chart">
      <defs>
        <linearGradient id="gtLineFill-${key}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="${options.color || "#2563eb"}" stop-opacity="0.18"/>
          <stop offset="1" stop-color="${options.color || "#2563eb"}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#fbfcf8"/>
      ${yTicks
        .map((value) => {
          const y = yAt(value);
          return `<line x1="${pad.left}" y1="${y}" x2="${pad.left + plotW}" y2="${y}" stroke="#dbe2d8"/><text x="${pad.left - 12}" y="${y + 4}" text-anchor="end" font-size="12" fill="#69736b">${escapeHtml(options.valueFormat ? options.valueFormat(value) : formatDecimal(value, 2))}</text>`;
        })
        .join("")}
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="#9aa79c"/>
      <polygon points="${area}" fill="url(#gtLineFill-${key})"/>
      <polyline points="${points}" fill="none" stroke="${options.color || "#2563eb"}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${xTicks
        .map((index) => {
          const x = xAt(index);
          return `<text x="${x}" y="${height - 16}" text-anchor="middle" font-size="12" fill="#69736b">${escapeHtml(shortMonthDay(rows[index].date))}</text>`;
        })
        .join("")}
      <circle cx="${latestX}" cy="${latestY}" r="5" fill="#b23a48" stroke="#fff" stroke-width="3"/>
    </svg>`;
}

function barChart(rows, key, options = {}) {
  const values = rows.map((row) => numberOrNull(row[key])).map((value) => value ?? 0);
  if (!rows.length) return `<div class="empty-state">No chart data</div>`;
  const width = 1000;
  const height = 180;
  const pad = { top: 16, right: 24, bottom: 30, left: 72 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const extra = Math.max((max - min) * 0.12, 0.02);
  const lo = min - extra;
  const hi = max + extra;
  const xStep = plotW / rows.length;
  const barW = Math.max(3, xStep * 0.55);
  const yAt = (value) => pad.top + ((hi - value) * plotH) / (hi - lo);
  const zeroY = yAt(0);
  const yTicks = [lo, 0, hi];
  return `
    <svg viewBox="0 0 ${width} ${height}" aria-label="${escapeHtml(options.title || key)} bar chart">
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#fbfcf8"/>
      ${yTicks
        .map((value) => {
          const y = yAt(value);
          return `<line x1="${pad.left}" y1="${y}" x2="${pad.left + plotW}" y2="${y}" stroke="#dbe2d8"/><text x="${pad.left - 12}" y="${y + 4}" text-anchor="end" font-size="12" fill="#69736b">${escapeHtml(options.valueFormat ? options.valueFormat(value) : formatDecimal(value, 2))}</text>`;
        })
        .join("")}
      <line x1="${pad.left}" y1="${zeroY}" x2="${pad.left + plotW}" y2="${zeroY}" stroke="#69736b"/>
      ${values
        .map((value, index) => {
          const x = pad.left + index * xStep + (xStep - barW) / 2;
          const y = yAt(value);
          const top = Math.min(y, zeroY);
          const h = Math.max(Math.abs(zeroY - y), 1);
          const color = value >= 0 ? "#2f6f63" : "#b23a48";
          return `<rect x="${x.toFixed(2)}" y="${top.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" rx="2" fill="${color}" opacity="0.78"/>`;
        })
        .join("")}
    </svg>`;
}

function table(headers, rows, numeric = []) {
  if (!rows.length) return `<div class="empty-state">No rows</div>`;
  return `
    <table>
      <thead><tr>${headers.map((header, index) => `<th class="${numeric[index] ? "number" : ""}">${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${rows
        .map(
          (row) =>
            `<tr>${row
              .map((cell, index) => `<td class="${numeric[index] ? `number ${valueClass(cell)}` : ""}">${escapeHtml(cell ?? "")}</td>`)
              .join("")}</tr>`,
        )
        .join("")}</tbody>
    </table>`;
}

function chooseTicks(rows, maxTicks) {
  if (rows.length <= maxTicks) return rows.map((_, index) => index);
  const step = Math.max(1, Math.floor((rows.length - 1) / (maxTicks - 1)));
  const ticks = [];
  for (let index = 0; index < rows.length; index += step) ticks.push(index);
  if (ticks.at(-1) !== rows.length - 1) ticks.push(rows.length - 1);
  return ticks;
}

function numberOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function formatMoney(value) {
  const n = numberOrNull(value);
  return n === null ? "--" : money.format(n);
}

function signedMoney(value) {
  const n = numberOrNull(value);
  if (n === null) return "--";
  return `${n >= 0 ? "+" : ""}${money.format(n)}`;
}

function formatDecimal(value, digits = 2) {
  const n = numberOrNull(value);
  return n === null ? "--" : plain.format(Number(n.toFixed(digits)));
}

function formatPercent(value, signed = true) {
  const n = numberOrNull(value);
  if (n === null) return "--";
  const formatter = signed ? pct : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return `${formatter.format(n)}%`;
}

function formatDate(value) {
  return value || "--";
}

function formatShortDate(value) {
  return value ? value.slice(5) : "--";
}

function shortMonthDay(value) {
  return value ? value.slice(5) : "--";
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function signClass(value) {
  const n = numberOrNull(value);
  if (n === null || n === 0) return "";
  return n > 0 ? "positive" : "negative";
}

function valueClass(value) {
  const text = String(value);
  if (text.startsWith("+")) return "positive";
  if (text.startsWith("-")) return "negative";
  return "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
