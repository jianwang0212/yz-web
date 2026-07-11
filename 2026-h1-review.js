(function () {
  const data = window.H1_REVIEW_DATA;
  if (!data) return;

  const make = (tagName, className, text) => {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };

  const renderOverview = () => {
    const container = document.querySelector('[data-overview]');
    if (!container) return;
    const rows = data.overview.map((item) => {
      const row = make('div', 'distribution-item');
      const label = make('div', 'distribution-label');
      label.append(make('strong', '', item.label), make('span', '', `${item.hours.toLocaleString('zh-CN')} 小时`));
      const track = make('div', 'distribution-bar-container');
      const bar = make('div', 'distribution-bar', `${item.percent}%`);
      bar.style.width = `${item.percent}%`;
      bar.style.background = `linear-gradient(135deg, ${item.color}, ${item.color}cc)`;
      track.append(bar);
      row.append(label, track);
      return row;
    });
    container.replaceChildren(...rows);
  };

  const renderMusic = () => {
    const container = document.querySelector('[data-music-achievements]');
    if (!container) return;
    const cards = data.musicAchievements.map((item) => {
      const card = make(item.href ? 'a' : 'article', 'achievement-item');
      if (item.href) {
        card.href = item.href;
        card.target = '_blank';
        card.rel = 'noopener';
        card.append(make('span', 'achievement-arrow', '↗'));
      }
      card.append(
        make('div', 'achievement-number', item.number),
        make('div', 'achievement-desc', item.description),
        make('div', 'achievement-detail', item.detail),
      );
      return card;
    });
    container.replaceChildren(...cards);
  };

  const renderWork = () => {
    const container = document.querySelector('[data-work-items]');
    if (!container) return;
    const cards = data.workItems.map((item) => {
      const card = make('article', 'work-item');
      card.style.setProperty('--item-accent', item.accent);
      card.append(make('h4', '', item.title), make('p', '', item.description));
      return card;
    });
    container.replaceChildren(...cards);
  };

  const renderFinance = () => {
    const container = document.querySelector('[data-finance]');
    if (!container) return;
    const finance = data.finance;
    if (!finance) return;

    const formatUsd = (value) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    const percent = (value, total) => `${Math.round((value / total) * 1000) / 10}%`;

    const summary = make('div', 'financial-summary-cards');
    summary.append(
      ...finance.summary.map((item) => {
        const card = make('article', `summary-card-large ${item.tone}-card`);
        const value = make('div', `summary-value-large ${item.tone}`);
        value.append(document.createTextNode(item.value), make('span', '', ` ${item.unit}`));
        card.append(make('div', 'summary-label', item.label), value, make('p', 'summary-note', item.note));
        return card;
      }),
    );

    const buildPie = (item) => {
      const panel = make('article', 'finance-chart-panel');
      panel.append(make('h4', 'chart-title', item.title));
      const body = make('div', 'finance-chart-body');
      const pie = make('div', 'finance-pie');
      let cursor = 0;
      const stops = item.slices.map((slice) => {
        const start = cursor;
        cursor += (slice.value / item.total) * 100;
        return `${slice.color} ${start}% ${cursor}%`;
      });
      pie.style.background = `conic-gradient(${stops.join(', ')})`;
      pie.setAttribute(
        'aria-label',
        item.slices.map((slice) => `${slice.label} ${percent(slice.value, item.total)}`).join('；'),
      );
      const center = make('div', 'finance-pie-center');
      center.append(make('strong', '', item.totalLabel), make('span', '', item.unit));
      pie.append(center);

      const legend = make('div', 'finance-legend');
      legend.append(
        ...item.slices.map((slice) => {
          const row = make('div', 'finance-legend-row');
          const label = make('span', 'finance-legend-label');
          const swatch = make('span', 'finance-legend-swatch');
          swatch.style.background = slice.color;
          label.append(swatch, document.createTextNode(slice.label));
          row.append(label, make('strong', '', percent(slice.value, item.total)));
          return row;
        }),
      );
      body.append(pie, legend);
      panel.append(body);
      return panel;
    };

    const charts = make('div', 'finance-charts-row');
    charts.append(buildPie(finance.income), buildPie(finance.expense));

    const structure = make('div', 'finance-structure-grid');
    const incomeCard = make('article', 'finance-structure-card');
    incomeCard.append(make('h4', '', '2026 上半年收入结构'));
    const incomeRows = make('div', 'finance-structure-rows');
    incomeRows.append(
      ...finance.income.slices.map((slice, index) => {
        const row = make('div', 'finance-structure-row');
        const label = make('span', 'finance-structure-label');
        label.append(make('span', 'finance-index', String(index + 1)), document.createTextNode(slice.label));
        const value = make('span', 'finance-structure-value');
        value.append(make('strong', '', `${slice.value} 万`), make('small', '', percent(slice.value, finance.income.total)));
        row.append(label, value);
        return row;
      }),
    );
    const incomeTotal = make('div', 'finance-structure-total');
    incomeTotal.append(make('span', '', 'H1 合计'), make('strong', '', '32 万人民币'));
    incomeCard.append(incomeRows, incomeTotal);

    const cashflowCard = make('article', 'finance-structure-card');
    cashflowCard.append(make('h4', '', 'BOA 支出口径'));
    const bridge = make('div', 'finance-bridge');
    [
      ['退款前毛消费', formatUsd(finance.expense.total)],
      ['退款抵扣', `−${formatUsd(finance.expense.refund)}`],
      ['退款后净支出', formatUsd(finance.expense.net)],
    ].forEach(([label, value], index) => {
      const row = make('div', `finance-bridge-row${index === 2 ? ' total' : ''}`);
      row.append(make('span', '', label), make('strong', '', value));
      bridge.append(row);
    });
    cashflowCard.append(bridge, make('p', 'finance-source-note', finance.sourceNote));
    structure.append(incomeCard, cashflowCard);

    const monthly = make('section', 'finance-monthly-section');
    monthly.append(make('h4', 'finance-subtitle', 'BOA 月度净支出'));
    const monthlyBars = make('div', 'finance-monthly-bars');
    const monthlyMax = Math.max(...finance.monthlySpend.map((item) => item.value));
    monthlyBars.append(
      ...finance.monthlySpend.map((item) => {
        const row = make('div', 'finance-monthly-row');
        const track = make('div', 'finance-monthly-track');
        const bar = make('div', 'finance-monthly-bar');
        bar.style.width = `${(item.value / monthlyMax) * 100}%`;
        track.append(bar);
        row.append(make('span', 'finance-month-label', item.month), track, make('strong', '', formatUsd(item.value)));
        return row;
      }),
    );
    monthly.append(monthlyBars);

    const performance = make('section', 'finance-performance-section');
    performance.append(make('h4', 'finance-subtitle', '资金表现（不计入 32 万收入）'));
    const performanceGrid = make('div', 'finance-performance-grid');
    performanceGrid.append(
      ...finance.performance.map((item) => {
        const card = make('article', 'finance-performance-card');
        card.dataset.tone = item.tone;
        card.append(make('h5', '', item.label), make('strong', '', item.value), make('span', '', item.note));
        return card;
      }),
    );
    performance.append(performanceGrid);

    container.replaceChildren(summary, charts, structure, monthly, performance);
  };

  const renderMonths = () => {
    const container = document.querySelector('[data-months]');
    if (!container) return;
    const cards = data.months.map((item) => {
      const card = make('article', `month-card${item.emphasis ? ' emphasis' : ''}`);
      const header = make('div', 'month-header');
      const monthNumber = item.month.replace('月', '').padStart(2, '0');
      header.append(make('span', 'month-number', monthNumber), make('span', 'month-name', item.month));
      const list = make('ul', 'month-events');
      list.append(...item.events.map((event) => make('li', '', event)));
      card.append(header, list);
      return card;
    });
    container.replaceChildren(...cards);
  };

  const renderProjects = () => {
    const container = document.querySelector('[data-projects]');
    if (!container) return;
    const cards = data.projects.map((item) => {
      const card = make('article', 'project-item');
      card.append(make('h4', '', item.title), make('p', '', item.description));
      return card;
    });
    container.replaceChildren(...cards);
  };

  const renderBooks = () => {
    const container = document.querySelector('[data-books]');
    if (!container) return;
    container.replaceChildren(...data.books.map((title) => make('div', 'book-item', title)));
  };

  const renderAi = () => {
    const stats = document.querySelector('[data-ai-stats]');
    if (stats) {
      stats.replaceChildren(
        ...data.aiStats.map((item) => {
          const card = make('div', 'ai-stat-item');
          card.append(make('div', 'stat-number', item.number), make('div', 'stat-label', item.label));
          return card;
        }),
      );
    }
    const tools = document.querySelector('[data-ai-tools]');
    if (tools) tools.replaceChildren(...data.aiTools.map((tool) => make('span', 'tool-tag', tool)));
  };

  const setupProgress = () => {
    const bar = document.querySelector('.progress-bar');
    if (!bar) return;
    const update = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = available > 0 ? Math.min(1, window.scrollY / available) : 0;
      bar.style.width = `${Math.round(ratio * 1000) / 10}%`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  };

  const setupNavigation = () => {
    const button = document.querySelector('.hamburger');
    const menu = document.querySelector('.nav-menu');
    if (!button || !menu) return;
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('active', !expanded);
    });
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
      });
    });
  };

  const setupDialog = () => {
    const dialog = document.querySelector('#method-dialog');
    const openButton = document.querySelector('[data-open-dialog="method-dialog"]');
    const closeButton = dialog?.querySelector('[data-close-dialog]');
    if (!dialog || !openButton || !closeButton) return;
    openButton.addEventListener('click', () => dialog.showModal());
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  };

  renderOverview();
  renderMusic();
  renderWork();
  renderFinance();
  renderMonths();
  renderProjects();
  renderBooks();
  renderAi();
  setupProgress();
  setupNavigation();
  setupDialog();
})();
