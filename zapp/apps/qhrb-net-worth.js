const DATA_URL = "qhrb-san-ci-can-sai-data.json?v=20260512";

const els = {
  playerName: document.querySelector("#playerName"),
  dataBadge: document.querySelector("#dataBadge"),
  rankLabel: document.querySelector("#rankLabel"),
  tradeDate: document.querySelector("#tradeDate"),
  latestNetWorth: document.querySelector("#latestNetWorth"),
  netWorthRange: document.querySelector("#netWorthRange"),
  equity: document.querySelector("#equity"),
  company: document.querySelector("#company"),
  netProfit: document.querySelector("#netProfit"),
  score: document.querySelector("#score"),
  chartWindow: document.querySelector("#chartWindow"),
  netWorthChart: document.querySelector("#netWorthChart"),
  playerId: document.querySelector("#playerId"),
  recordList: document.querySelector("#recordList"),
  matchDate: document.querySelector("#matchDate"),
  profileList: document.querySelector("#profileList"),
  rowCount: document.querySelector("#rowCount"),
  netWorthTable: document.querySelector("#netWorthTable"),
};

const groupNames = {
  1: "轻量组",
  2: "重量组",
  3: "高净值组",
  4: "量化组",
};

const money = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const decimal = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 5,
});

init();

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    render(data);
  } catch (error) {
    document.querySelector(".qhrb-shell").insertAdjacentHTML(
      "beforeend",
      `<div class="empty-state">数据加载失败：${escapeHtml(error.message)}</div>`,
    );
    els.dataBadge.textContent = "Load failed";
  }
}

function render(data) {
  const record = data.records?.[0];
  const playerId = record?.playerId;
  const detail = playerId ? data.detailsByPlayerId?.[playerId] || {} : {};
  const basic = detail.basicDataFrontVO || {};
  const netWorthRows = detail.netWorthVOList || [];

  if (!record) {
    els.dataBadge.textContent = "No record";
    return;
  }

  const first = netWorthRows[0];
  const latest = netWorthRows.at(-1);
  const firstValue = Number(first?.netWorth || 0);
  const latestValue = Number(latest?.netWorth || 0);
  const change = firstValue ? (latestValue / firstValue - 1) * 100 : 0;

  els.playerName.textContent = record.playerNickName;
  els.dataBadge.textContent = `${groupNames[record.groupType] || data.groupName} · ${formatDate(data.tradeDate)}`;
  els.rankLabel.textContent = `${groupNames[record.groupType] || data.groupName} #${record.sortNo}`;
  els.tradeDate.textContent = `总榜 · ${formatDate(data.tradeDate)}`;
  els.latestNetWorth.textContent = latest ? formatDecimal(latest.netWorth, 5) : "--";
  els.netWorthRange.textContent = latest ? `${netWorthRows.length} 日 · ${formatSigned(change)}%` : "--";
  els.equity.textContent = `${formatMoney(record.dateBalanceToday)} 元`;
  els.company.textContent = record.companyName || "--";
  els.netProfit.textContent = `${formatMoney(record.netProfit)} 元`;
  els.netProfit.className = Number(record.netProfit) >= 0 ? "positive" : "negative";
  els.score.textContent = `综合得分 ${record.comprehensiveScore}`;
  els.playerId.textContent = shortId(playerId);
  els.matchDate.textContent = basic.beginMatchTime || "--";
  els.rowCount.textContent = `${netWorthRows.length} rows`;
  els.chartWindow.textContent = netWorthRows.length ? `${formatDate(first.tradeDate)} - ${formatDate(latest.tradeDate)}` : "--";

  els.netWorthChart.innerHTML = lineChart(netWorthRows);
  els.recordList.replaceChildren(
    recordItem("客户昵称", record.playerNickName),
    recordItem("Player ID", playerId),
    recordItem("排名", `${record.sortNo}`),
    recordItem("交易日期", formatDate(record.tradeDate)),
    recordItem("风险度", formatRatio(record.riskDegree)),
    recordItem("回撤率", formatRatio(record.withrawalRate)),
    recordItem("最大本金收益率", `${formatDecimal(record.maxPrincipal, 5)}%`),
    recordItem("最大本金收益率得分", formatDecimal(record.maxPrincipalScore, 3)),
    recordItem("指定交易商", record.companyName || "--"),
  );
  els.profileList.replaceChildren(
    recordItem("参赛日期", basic.beginMatchTime || "--"),
    recordItem("累计净值", formatDecimal(basic.netWorth, 5)),
    recordItem("预计年化收益率", formatRatio(basic.expectAnnualized)),
    recordItem("交易天数", basic.realDealDays ?? "--"),
    recordItem("盈利 / 亏损天数", `${basic.profitDays ?? "--"} / ${basic.lossDays ?? "--"}`),
    recordItem("交易胜率", formatRatio(basic.dealWin)),
    recordItem("夏普比率", formatDecimal(basic.sharpeRatio, 5)),
    recordItem("最大连续盈利天数", basic.maxContinuityProfitDays ?? "--"),
    recordItem("期权累计净利润", `${formatMoney(detail.optFrontVO?.netProfit)} 元`),
  );
  els.netWorthTable.innerHTML = netWorthTable(netWorthRows);
}

function recordItem(label, value) {
  const row = document.createElement("div");
  row.className = "record-row";
  const name = document.createElement("span");
  name.textContent = label;
  const content = document.createElement("strong");
  content.textContent = value ?? "--";
  row.append(name, content);
  return row;
}

function lineChart(rows) {
  if (!rows.length) return '<div class="empty-state">暂无净值数据。</div>';

  const width = 980;
  const height = 420;
  const left = 66;
  const right = 30;
  const top = 34;
  const bottom = 58;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = rows.map((row) => Number(row.netWorth));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yMin = Math.max(0, minValue - 0.0025);
  const yMax = maxValue + 0.0025;
  const yRange = yMax - yMin || 1;

  const x = (index) => left + (chartWidth * index) / Math.max(rows.length - 1, 1);
  const y = (value) => top + chartHeight - ((value - yMin) / yRange) * chartHeight;
  const points = rows.map((row, index) => [x(index), y(Number(row.netWorth))]);
  const path = points.map(([px, py], index) => `${index ? "L" : "M"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ");
  const area = [
    `${left},${top + chartHeight}`,
    ...points.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`),
    `${left + chartWidth},${top + chartHeight}`,
  ].join(" ");
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (yRange * index) / 4);
  const labelIndexes = Array.from(new Set(rows.map((_, index) => index)));
  const latest = rows.at(-1);
  const latestPoint = points.at(-1);

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="累计净值曲线">
    <defs>
      <linearGradient id="netWorthArea" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f766e" stop-opacity="0.24" />
        <stop offset="100%" stop-color="#0f766e" stop-opacity="0.03" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#fffaf5" />
    ${yTicks
      .map((tick) => {
        const py = y(tick);
        return `<line x1="${left}" y1="${py}" x2="${width - right}" y2="${py}" stroke="#eadbd1" />
          <text x="${left - 12}" y="${py + 4}" text-anchor="end" fill="#756964" font-size="13">${formatDecimal(tick, 4)}</text>`;
      })
      .join("")}
    <line x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}" stroke="#c8b9af" />
    <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" stroke="#c8b9af" />
    <polygon points="${area}" fill="url(#netWorthArea)" />
    <path d="${path}" fill="none" stroke="#0f766e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    ${points
      .map(([px, py]) => `<circle cx="${px}" cy="${py}" r="5" fill="#0f766e" stroke="#fff" stroke-width="2" />`)
      .join("")}
    <circle cx="${latestPoint[0]}" cy="${latestPoint[1]}" r="8" fill="#d71920" stroke="#fff" stroke-width="3" />
    <text x="${latestPoint[0] - 10}" y="${latestPoint[1] - 15}" text-anchor="end" fill="#970e14" font-size="16" font-weight="800">${formatDecimal(latest.netWorth, 5)}</text>
    ${labelIndexes
      .map((index) => {
        const px = x(index);
        return `<text x="${px}" y="${height - 24}" text-anchor="middle" fill="#756964" font-size="13">${formatDate(rows[index].tradeDate).slice(5)}</text>`;
      })
      .join("")}
  </svg>`;
}

function netWorthTable(rows) {
  if (!rows.length) return '<div class="empty-state">暂无净值明细。</div>';
  let previous = null;
  const body = rows
    .map((row) => {
      const value = Number(row.netWorth);
      const change = previous === null ? 0 : value - previous;
      previous = value;
      const changeClass = change >= 0 ? "positive" : "negative";
      return `<tr>
        <td>${escapeHtml(formatDate(row.tradeDate))}</td>
        <td>${formatDecimal(value, 5)}</td>
        <td class="${changeClass}">${formatSigned(change)}</td>
      </tr>`;
    })
    .join("");
  return `<table>
    <thead>
      <tr>
        <th>日期</th>
        <th>累计净值</th>
        <th>日变化</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>`;
}

function formatMoney(value) {
  const number = Number(value || 0);
  return money.format(number);
}

function formatDecimal(value, digits = 4) {
  const number = Number(value || 0);
  return decimal.format(Number(number.toFixed(digits)));
}

function formatRatio(value) {
  return `${formatDecimal(Number(value || 0) * 100, 3)}%`;
}

function formatSigned(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}${formatDecimal(number, 5)}`;
}

function formatDate(value) {
  return String(value || "--").split(" ")[0];
}

function shortId(value) {
  if (!value) return "--";
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
