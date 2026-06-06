const DATA_URL = "yinzi-equity-data.json?v=20260602";

const els = {
  dataBadge: document.querySelector("#dataBadge"),
  latestCumulative: document.querySelector("#latestCumulative"),
  breakEvenGap: document.querySelector("#breakEvenGap"),
  totalInvested: document.querySelector("#totalInvested"),
  totalRecovered: document.querySelector("#totalRecovered"),
  recoveryRate: document.querySelector("#recoveryRate"),
  dateRange: document.querySelector("#dateRange"),
  recordCount: document.querySelector("#recordCount"),
  chartWindow: document.querySelector("#chartWindow"),
  cumulativeChart: document.querySelector("#cumulativeChart"),
  typeCount: document.querySelector("#typeCount"),
  typeBreakdown: document.querySelector("#typeBreakdown"),
  latestDate: document.querySelector("#latestDate"),
  milestoneList: document.querySelector("#milestoneList"),
  yearSummary: document.querySelector("#yearSummary"),
  yearChart: document.querySelector("#yearChart"),
  yearTable: document.querySelector("#yearTable"),
  typeFilter: document.querySelector("#typeFilter"),
  searchFilter: document.querySelector("#searchFilter"),
  tableCount: document.querySelector("#tableCount"),
  cashflowTable: document.querySelector("#cashflowTable"),
};

const views = {
  overview: document.querySelector("#overviewView"),
  years: document.querySelector("#yearsView"),
  data: document.querySelector("#dataView"),
};

const state = {
  rows: [],
  years: [],
  activeView: "overview",
};

const moneyOne = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const moneyAuto = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
});

const moneyWhole = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
});

init();

async function init() {
  bindEvents();

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.rows = prepareRows(data.records || []);
    state.years = buildYearRows(state.rows);
    render(data);
  } catch (error) {
    document.querySelector(".equity-shell").insertAdjacentHTML(
      "beforeend",
      `<div class="empty-state">数据加载失败：${escapeHtml(error.message)}</div>`,
    );
    els.dataBadge.textContent = "Load failed";
  }
}

function bindEvents() {
  document.querySelectorAll(".view-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeView = button.dataset.view;
      document.querySelectorAll(".view-tabs button").forEach((item) => item.classList.toggle("active", item === button));
      Object.entries(views).forEach(([view, section]) => section.classList.toggle("hidden", view !== state.activeView));
    });
  });

  els.typeFilter.addEventListener("change", renderTable);
  els.searchFilter.addEventListener("input", renderTable);
}

function prepareRows(records) {
  let cumulative = 0;
  return [...records]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((record, index) => {
      const amount = Number(record.amount || 0);
      cumulative = roundCurrency(cumulative + amount);
      return {
        ...record,
        amount,
        cumulative,
        index: index + 1,
        year: String(record.date || "").slice(0, 4),
      };
    });
}

function render(data) {
  if (!state.rows.length) {
    els.dataBadge.textContent = "No rows";
    return;
  }

  const first = state.rows[0];
  const latest = state.rows.at(-1);
  const invested = Math.abs(sumBy(state.rows.filter((row) => row.amount < 0), "amount"));
  const recovered = sumBy(state.rows.filter((row) => row.amount > 0), "amount");
  const gap = Math.max(0, -latest.cumulative);
  const rate = invested ? (recovered / invested) * 100 : 0;

  els.dataBadge.textContent = `${state.rows.length} rows · ${formatDate(latest.date)}`;
  els.latestCumulative.textContent = formatMoney(latest.cumulative);
  els.latestCumulative.className = latest.cumulative >= 0 ? "positive" : "negative";
  els.breakEvenGap.textContent = gap ? `距回本 ${formatMoney(gap)}` : "已回本";
  els.totalInvested.textContent = formatMoney(-invested);
  els.totalInvested.className = "negative";
  els.totalRecovered.textContent = formatMoney(recovered);
  els.totalRecovered.className = "positive";
  els.recoveryRate.textContent = `回收率 ${formatPercent(rate)}`;
  els.dateRange.textContent = `${first.date.slice(0, 4)}-${latest.date.slice(0, 4)}`;
  els.recordCount.textContent = `${state.rows.length} 条记录`;
  els.chartWindow.textContent = `${formatDate(first.date)} - ${formatDate(latest.date)}`;
  els.latestDate.textContent = formatDate(latest.date);
  els.yearSummary.textContent = `${state.years.length} 年`;

  els.cumulativeChart.innerHTML = cumulativeChart(state.rows);
  els.yearChart.innerHTML = yearChart(state.years);
  els.yearTable.innerHTML = yearTable(state.years);
  renderTypeBreakdown(state.rows, invested);
  renderMilestones(state.rows, { invested, recovered, gap, rate });
  renderFilters(state.rows);
  renderTable();
}

function renderTypeBreakdown(rows, invested) {
  const groups = [...groupBy(rows, (row) => row.type).entries()]
    .map(([type, typeRows]) => {
      const total = sumBy(typeRows, "amount");
      return { type, total, count: typeRows.length };
    })
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const max = Math.max(...groups.map((item) => Math.abs(item.total)), invested, 1);

  els.typeCount.textContent = `${groups.length} types`;
  els.typeBreakdown.innerHTML = groups
    .map((item) => {
      const width = Math.max(3, (Math.abs(item.total) / max) * 100);
      const className = item.type === "入股" ? "invest" : item.type === "工资" ? "salary" : item.type.includes("/") ? "mixed" : "";
      return `<article class="breakdown-row">
        <div class="breakdown-row__head">
          <span>${escapeHtml(item.type)} · ${item.count} 条</span>
          <strong class="${item.total >= 0 ? "positive" : "negative"}">${formatMoney(item.total)}</strong>
        </div>
        <div class="bar-track"><div class="bar-fill ${className}" style="width: ${width.toFixed(1)}%"></div></div>
      </article>`;
    })
    .join("");
}

function renderMilestones(rows, summary) {
  const firstInvestment = rows.find((row) => row.amount < 0);
  const lastInvestment = [...rows].reverse().find((row) => row.amount < 0);
  const firstIncome = rows.find((row) => row.amount > 0);
  const maxIncome = rows
    .filter((row) => row.amount > 0)
    .reduce((best, row) => (row.amount > (best?.amount || 0) ? row : best), null);
  const latest = rows.at(-1);

  els.milestoneList.replaceChildren(
    recordItem("首次入股", `${formatDate(firstInvestment?.date)} · ${formatAmount(firstInvestment?.amount)}`),
    recordItem("最后入股", `${formatDate(lastInvestment?.date)} · ${formatAmount(lastInvestment?.amount)}`),
    recordItem("首次回款", `${formatDate(firstIncome?.date)} · ${formatAmount(firstIncome?.amount)}`),
    recordItem("最大单笔回款", `${formatDate(maxIncome?.date)} · ${formatAmount(maxIncome?.amount)}`),
    recordItem("最新记录", `${formatDate(latest?.date)} · ${formatAmount(latest?.amount)}`),
    recordItem("回本进度", `${formatPercent(summary.rate)} · ${summary.gap ? `差 ${formatMoney(summary.gap)}` : "已回本"}`),
  );
}

function renderFilters(rows) {
  const types = ["全部", ...new Set(rows.map((row) => row.type))];
  els.typeFilter.replaceChildren(
    ...types.map((type) => {
      const option = document.createElement("option");
      option.value = type === "全部" ? "" : type;
      option.textContent = type;
      return option;
    }),
  );
}

function renderTable() {
  const type = els.typeFilter.value;
  const query = els.searchFilter.value.trim().toLowerCase();
  const rows = state.rows.filter((row) => {
    const matchesType = !type || row.type === type;
    const haystack = [row.date, row.type, row.note, row.amount, row.cumulative].join(" ").toLowerCase();
    return matchesType && (!query || haystack.includes(query));
  });

  els.tableCount.textContent = `${rows.length} rows`;
  els.cashflowTable.innerHTML = cashflowTable(rows);
}

function cumulativeChart(rows) {
  if (!rows.length) return '<div class="empty-state">暂无累计数据。</div>';

  const compact = isCompactViewport();
  const width = compact ? 720 : 980;
  const height = 430;
  const left = compact ? 70 : 78;
  const right = compact ? 26 : 34;
  const top = 34;
  const bottom = 60;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = rows.map((row) => row.cumulative);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const padding = Math.max((maxValue - minValue) * 0.07, 12000);
  const yMin = minValue - padding;
  const yMax = maxValue + padding;
  const yRange = yMax - yMin || 1;
  const x = (index) => left + (chartWidth * index) / Math.max(rows.length - 1, 1);
  const y = (value) => top + chartHeight - ((value - yMin) / yRange) * chartHeight;
  const points = rows.map((row, index) => [x(index), y(row.cumulative)]);
  const path = points.map(([px, py], index) => `${index ? "L" : "M"} ${px.toFixed(2)} ${py.toFixed(2)}`).join(" ");
  const zeroY = y(0);
  const area = [
    `${points[0][0].toFixed(2)},${zeroY.toFixed(2)}`,
    ...points.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`),
    `${points.at(-1)[0].toFixed(2)},${zeroY.toFixed(2)}`,
  ].join(" ");
  const yTicks = makeTicks(yMin, yMax, 5);
  const labelIndexes = pickIndexes(rows.length, compact ? 5 : 7);
  const latest = rows.at(-1);
  const latestPoint = points.at(-1);

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="累计金额折线图">
    <defs>
      <linearGradient id="cumulativeArea" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#176f69" stop-opacity="0.20" />
        <stop offset="100%" stop-color="#176f69" stop-opacity="0.04" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#ffffff" />
    ${yTicks
      .map((tick) => {
        const py = y(tick);
        return `<line class="grid" x1="${left}" y1="${py.toFixed(2)}" x2="${width - right}" y2="${py.toFixed(2)}" />
          <text x="${left - 12}" y="${py + 4}" text-anchor="end">${formatCompactMoney(tick)}</text>`;
      })
      .join("")}
    <line class="zero-line" x1="${left}" y1="${zeroY.toFixed(2)}" x2="${width - right}" y2="${zeroY.toFixed(2)}" />
    <text x="${width - right}" y="${zeroY - 8}" text-anchor="end" fill="#a97122">回本线</text>
    <line class="axis" x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}" />
    <line class="axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" />
    <polygon points="${area}" fill="url(#cumulativeArea)" />
    <path class="main-line" d="${path}" />
    ${points
      .map(([px, py], index) => `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${index === rows.length - 1 ? 7 : 4}" fill="${index === rows.length - 1 ? "#b4233d" : "#176f69"}" stroke="#fff" stroke-width="2" />`)
      .join("")}
    <text x="${Math.max(left + 95, latestPoint[0] - 10).toFixed(2)}" y="${Math.max(top + 22, latestPoint[1] - 17).toFixed(2)}" text-anchor="end" fill="#b4233d" font-size="16" font-weight="850">${formatMoney(latest.cumulative)}</text>
    ${labelIndexes
      .map((index) => {
        const px = x(index);
        return `<text x="${px.toFixed(2)}" y="${height - 24}" text-anchor="middle">${rows[index].date.slice(0, 7)}</text>`;
      })
      .join("")}
  </svg>`;
}

function yearChart(years) {
  if (!years.length) return '<div class="empty-state">暂无年度数据。</div>';

  const compact = isCompactViewport();
  const width = compact ? 720 : 980;
  const height = 360;
  const left = compact ? 70 : 78;
  const right = compact ? 26 : 34;
  const top = 30;
  const bottom = 58;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = years.map((row) => row.cashflow);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const padding = Math.max((maxValue - minValue) * 0.08, 10000);
  const yMin = minValue - padding;
  const yMax = maxValue + padding;
  const yRange = yMax - yMin || 1;
  const y = (value) => top + chartHeight - ((value - yMin) / yRange) * chartHeight;
  const zeroY = y(0);
  const slot = chartWidth / years.length;
  const barWidth = Math.min(82, slot * 0.58);
  const yTicks = makeTicks(yMin, yMax, 5);

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="年度现金流柱状图">
    <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#ffffff" />
    ${yTicks
      .map((tick) => {
        const py = y(tick);
        return `<line class="grid" x1="${left}" y1="${py.toFixed(2)}" x2="${width - right}" y2="${py.toFixed(2)}" />
          <text x="${left - 12}" y="${py + 4}" text-anchor="end">${formatCompactMoney(tick)}</text>`;
      })
      .join("")}
    <line class="zero-line" x1="${left}" y1="${zeroY.toFixed(2)}" x2="${width - right}" y2="${zeroY.toFixed(2)}" />
    ${years
      .map((row, index) => {
        const x = left + slot * index + slot / 2 - barWidth / 2;
        const barY = Math.min(y(row.cashflow), zeroY);
        const heightValue = Math.max(3, Math.abs(y(row.cashflow) - zeroY));
        const labelY = row.cashflow >= 0 ? barY - 10 : barY + heightValue + 18;
        return `<rect class="bar ${row.cashflow >= 0 ? "positive" : "negative"}" x="${x.toFixed(2)}" y="${barY.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${heightValue.toFixed(2)}" rx="6" />
          <text x="${(x + barWidth / 2).toFixed(2)}" y="${labelY.toFixed(2)}" text-anchor="middle">${formatCompactMoney(row.cashflow)}</text>
          <text x="${(x + barWidth / 2).toFixed(2)}" y="${height - 24}" text-anchor="middle">${row.year}</text>`;
      })
      .join("")}
  </svg>`;
}

function cashflowTable(rows) {
  if (!rows.length) return '<div class="empty-state">没有匹配的现金流。</div>';
  const body = rows
    .map((row) => `<tr>
      <td>${escapeHtml(row.date)}</td>
      <td class="num ${row.amount >= 0 ? "positive" : "negative"}">${formatAmount(row.amount)}</td>
      <td>${escapeHtml(row.type)}</td>
      <td class="note">${escapeHtml(row.note || "-")}</td>
      <td class="num ${row.cumulative >= 0 ? "positive" : "negative"}">${formatMoney(row.cumulative)}</td>
    </tr>`)
    .join("");
  return `<table>
    <thead>
      <tr>
        <th>日期</th>
        <th class="num">金额</th>
        <th>类型</th>
        <th>备注</th>
        <th class="num">累计金额</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>`;
}

function yearTable(years) {
  if (!years.length) return '<div class="empty-state">暂无年度汇总。</div>';
  const body = years
    .map((row) => `<tr>
      <td>${row.year}</td>
      <td class="num ${row.invested ? "negative" : ""}">${formatMoney(row.invested ? -row.invested : 0)}</td>
      <td class="num positive">${formatMoney(row.recovered)}</td>
      <td class="num ${row.cashflow >= 0 ? "positive" : "negative"}">${formatMoney(row.cashflow)}</td>
      <td class="num ${row.endCumulative >= 0 ? "positive" : "negative"}">${formatMoney(row.endCumulative)}</td>
      <td class="num">${row.count}</td>
    </tr>`)
    .join("");
  return `<table>
    <thead>
      <tr>
        <th>年份</th>
        <th class="num">投入</th>
        <th class="num">回款</th>
        <th class="num">年现金流</th>
        <th class="num">年末累计</th>
        <th class="num">记录</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>`;
}

function buildYearRows(rows) {
  return [...groupBy(rows, (row) => row.year).entries()].map(([year, yearRows]) => {
    const invested = Math.abs(sumBy(yearRows.filter((row) => row.amount < 0), "amount"));
    const recovered = sumBy(yearRows.filter((row) => row.amount > 0), "amount");
    return {
      year,
      invested,
      recovered,
      cashflow: sumBy(yearRows, "amount"),
      endCumulative: yearRows.at(-1)?.cumulative || 0,
      count: yearRows.length,
    };
  });
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

function groupBy(rows, getKey) {
  return rows.reduce((groups, row) => {
    const key = getKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
    return groups;
  }, new Map());
}

function sumBy(rows, key) {
  return roundCurrency(rows.reduce((total, row) => total + Number(row[key] || 0), 0));
}

function pickIndexes(length, maxLabels) {
  if (length <= maxLabels) return Array.from({ length }, (_, index) => index);
  const step = (length - 1) / (maxLabels - 1);
  return Array.from(new Set(Array.from({ length: maxLabels }, (_, index) => Math.round(index * step))));
}

function makeTicks(min, max, count) {
  if (count <= 1) return [min, max];
  return Array.from({ length: count }, (_, index) => min + ((max - min) * index) / (count - 1));
}

function isCompactViewport() {
  return window.matchMedia("(max-width: 620px)").matches;
}

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  return `${Number(value || 0) < 0 ? "-" : ""}¥${moneyOne.format(Math.abs(Number(value || 0)))}`;
}

function formatAmount(value) {
  return `${Number(value || 0) < 0 ? "-" : ""}¥${moneyAuto.format(Math.abs(Number(value || 0)))}`;
}

function formatCompactMoney(value) {
  const number = Number(value || 0);
  const abs = Math.abs(number);
  const sign = number < 0 ? "-" : "";
  if (abs >= 10000) return `${sign}${decimal.format(abs / 10000)}w`;
  return `${sign}${moneyWhole.format(abs)}`;
}

function formatPercent(value) {
  return `${decimal.format(Number(value || 0))}%`;
}

function formatDate(value) {
  return String(value || "--").split(" ")[0];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
