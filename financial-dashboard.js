// Financial Dashboard JavaScript
let financialData = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Load data
    try {
        const response = await fetch('financial-data/processed_financial_data.json');
        if (!response.ok) throw new Error('Failed to load data');
        financialData = await response.json();
        
        // Initialize tabs
        initTabs();
        
        // Load each tab's content
        loadOverview();
        loadSummary();
        loadCashFlow();
        loadMonthly();
        loadDaily();
        loadExchange();
        loadOther();
    } catch (error) {
        console.error('Error loading financial data:', error);
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.innerHTML = `<div class="error-message">加载数据失败: ${error.message}</div>`;
        });
    }
});

// Tab switching
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update contents
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Overview Tab
function loadOverview() {
    const container = document.getElementById('overview');
    if (!financialData) return;
    
    let html = '<div class="section-title">数据总览</div>';
    
    // Stats
    html += '<div class="stats-grid">';
    html += `<div class="stat-card blue"><div class="stat-label">年度汇总表</div><div class="stat-value">${Object.keys(financialData.summary || {}).length}</div></div>`;
    html += `<div class="stat-card green"><div class="stat-label">现金流表</div><div class="stat-value">${Object.keys(financialData.cash_flows || {}).length}</div></div>`;
    html += `<div class="stat-card red"><div class="stat-label">月度详情</div><div class="stat-value">${Object.keys(financialData.monthly_details || {}).length}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">交易记录</div><div class="stat-value">${Object.keys(financialData.exchanges || {}).length}</div></div>`;
    html += '</div>';
    
    // Summary of each category
    html += '<div class="summary-grid">';
    
    // Summary sheets
    if (financialData.summary && Object.keys(financialData.summary).length > 0) {
        html += '<div class="summary-card">';
        html += '<h3>年度汇总</h3>';
        html += '<ul style="list-style: none; padding: 0;">';
        Object.keys(financialData.summary).forEach(sheet => {
            html += `<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">${sheet}</li>`;
        });
        html += '</ul></div>';
    }
    
    // Cash flows
    if (financialData.cash_flows && Object.keys(financialData.cash_flows).length > 0) {
        html += '<div class="summary-card">';
        html += '<h3>现金流数据</h3>';
        html += '<ul style="list-style: none; padding: 0;">';
        Object.keys(financialData.cash_flows).forEach(sheet => {
            html += `<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">${sheet}</li>`;
        });
        html += '</ul></div>';
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Summary Tab
function loadSummary() {
    const container = document.getElementById('summary');
    if (!financialData || !financialData.summary) {
        container.innerHTML = '<div class="error-message">没有年度汇总数据</div>';
        return;
    }
    
    let html = '<div class="section-title">年度汇总</div>';
    
    Object.keys(financialData.summary).forEach(sheetName => {
        const sheet = financialData.summary[sheetName];
        
        html += `<div class="data-table-container" style="margin-bottom: 2rem;">`;
        html += `<h3 style="margin-bottom: 1rem; color: var(--primary-color);">${sheetName}</h3>`;
        
        if (sheet.data && sheet.data.length > 0) {
            html += '<table class="data-table">';
            html += '<thead><tr>';
            sheet.columns.forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            sheet.data.slice(0, 50).forEach(row => {
                html += '<tr>';
                sheet.columns.forEach(col => {
                    const value = row[col];
                    html += `<td>${value !== null && value !== undefined ? formatValue(value) : '-'}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// Cash Flow Tab
function loadCashFlow() {
    const container = document.getElementById('cashflow');
    if (!financialData || !financialData.cash_flows) {
        container.innerHTML = '<div class="error-message">没有现金流数据</div>';
        return;
    }
    
    let html = '<div class="section-title">现金流分析</div>';
    
    Object.keys(financialData.cash_flows).forEach(sheetName => {
        const sheet = financialData.cash_flows[sheetName];
        
        html += `<div class="chart-container" style="margin-bottom: 2rem;">`;
        html += `<h3 style="margin-bottom: 1rem; color: var(--primary-color);">${sheetName}</h3>`;
        html += `<div class="chart-wrapper">`;
        html += `<canvas id="cashflow-chart-${sheetName.replace(/[^a-zA-Z0-9]/g, '-')}"></canvas>`;
        html += `</div></div>`;
        
        // Table
        html += `<div class="data-table-container">`;
        if (sheet.data && sheet.data.length > 0) {
            html += '<table class="data-table">';
            html += '<thead><tr>';
            sheet.columns.forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            sheet.data.slice(0, 100).forEach(row => {
                html += '<tr>';
                sheet.columns.forEach(col => {
                    const value = row[col];
                    html += `<td>${value !== null && value !== undefined ? formatValue(value) : '-'}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Create charts
    Object.keys(financialData.cash_flows).forEach(sheetName => {
        createCashFlowChart(sheetName, financialData.cash_flows[sheetName]);
    });
}

// Monthly Details Tab
function loadMonthly() {
    const container = document.getElementById('monthly');
    if (!financialData || !financialData.monthly_details) {
        container.innerHTML = '<div class="error-message">没有月度详情数据</div>';
        return;
    }
    
    let html = '<div class="section-title">月度详情</div>';
    html += '<div class="sheet-selector">';
    html += '<label for="monthly-sheet-select" style="margin-right: 1rem; font-weight: 600;">选择月份：</label>';
    html += '<select id="monthly-sheet-select" style="padding: 0.75rem 1rem; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem;">';
    
    const monthlySheets = Object.keys(financialData.monthly_details).sort();
    monthlySheets.forEach(sheet => {
        html += `<option value="${sheet}">${sheet}</option>`;
    });
    
    html += '</select></div>';
    html += '<div id="monthly-data-container"></div>';
    
    container.innerHTML = html;
    
    // Load first sheet
    if (monthlySheets.length > 0) {
        loadMonthlySheet(monthlySheets[0]);
    }
    
    // Add change listener
    document.getElementById('monthly-sheet-select').addEventListener('change', (e) => {
        loadMonthlySheet(e.target.value);
    });
}

function loadMonthlySheet(sheetName) {
    const container = document.getElementById('monthly-data-container');
    const sheet = financialData.monthly_details[sheetName];
    
    if (!sheet || !sheet.data || sheet.data.length === 0) {
        container.innerHTML = '<div class="error-message">该月份没有数据</div>';
        return;
    }
    
    let html = `<h3 style="margin-bottom: 1rem; color: var(--primary-color);">${sheetName}</h3>`;
    
    // Try to create a chart if there's date and numeric data
    const hasDate = sheet.columns.some(col => col.includes('日期') || col.includes('Date') || col.includes('date'));
    const numericCols = sheet.columns.filter(col => {
        if (!sheet.data[0]) return false;
        const val = sheet.data[0][col];
        return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
    });
    
    if (hasDate && numericCols.length > 0) {
        html += '<div class="chart-container">';
        html += '<div class="chart-wrapper">';
        html += `<canvas id="monthly-chart-${sheetName.replace(/[^a-zA-Z0-9]/g, '-')}"></canvas>`;
        html += '</div></div>';
    }
    
    // Table
    html += '<div class="data-table-container">';
    html += '<table class="data-table">';
    html += '<thead><tr>';
    sheet.columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    sheet.data.forEach(row => {
        html += '<tr>';
        sheet.columns.forEach(col => {
            const value = row[col];
            html += `<td>${value !== null && value !== undefined ? formatValue(value) : '-'}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '</div>';
    
    container.innerHTML = html;
    
    // Create chart if applicable
    if (hasDate && numericCols.length > 0) {
        createMonthlyChart(sheetName, sheet);
    }
}

// Daily Review Tab
function loadDaily() {
    const container = document.getElementById('daily');
    if (!financialData || !financialData.daily_reviews) {
        container.innerHTML = '<div class="error-message">没有每日回顾数据</div>';
        return;
    }
    
    let html = '<div class="section-title">每日财务回顾</div>';
    
    Object.keys(financialData.daily_reviews).forEach(sheetName => {
        const sheet = financialData.daily_reviews[sheetName];
        
        html += `<div class="data-table-container" style="margin-bottom: 2rem;">`;
        html += `<h3 style="margin-bottom: 1rem; color: var(--primary-color);">${sheetName}</h3>`;
        
        if (sheet.data && sheet.data.length > 0) {
            html += '<table class="data-table">';
            html += '<thead><tr>';
            sheet.columns.forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            sheet.data.forEach(row => {
                html += '<tr>';
                sheet.columns.forEach(col => {
                    const value = row[col];
                    html += `<td>${value !== null && value !== undefined ? formatValue(value) : '-'}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// Exchange Tab
function loadExchange() {
    const container = document.getElementById('exchange');
    if (!financialData || !financialData.exchanges) {
        container.innerHTML = '<div class="error-message">没有交易记录数据</div>';
        return;
    }
    
    let html = '<div class="section-title">交易记录</div>';
    
    Object.keys(financialData.exchanges).forEach(sheetName => {
        const sheet = financialData.exchanges[sheetName];
        
        html += `<div class="data-table-container" style="margin-bottom: 2rem;">`;
        html += `<h3 style="margin-bottom: 1rem; color: var(--primary-color);">${sheetName}</h3>`;
        
        if (sheet.data && sheet.data.length > 0) {
            html += '<table class="data-table">';
            html += '<thead><tr>';
            sheet.columns.forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            sheet.data.forEach(row => {
                html += '<tr>';
                sheet.columns.forEach(col => {
                    const value = row[col];
                    html += `<td>${value !== null && value !== undefined ? formatValue(value) : '-'}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// Other Tab
function loadOther() {
    const container = document.getElementById('other');
    if (!financialData || !financialData.other) {
        container.innerHTML = '<div class="error-message">没有其他数据</div>';
        return;
    }
    
    let html = '<div class="section-title">其他数据</div>';
    
    Object.keys(financialData.other).forEach(sheetName => {
        const sheet = financialData.other[sheetName];
        
        html += `<div class="data-table-container" style="margin-bottom: 2rem;">`;
        html += `<h3 style="margin-bottom: 1rem; color: var(--primary-color);">${sheetName}</h3>`;
        
        if (sheet.sample && sheet.sample.length > 0) {
            html += '<table class="data-table">';
            html += '<thead><tr>';
            sheet.columns.forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            sheet.sample.forEach(row => {
                html += '<tr>';
                sheet.columns.forEach(col => {
                    const value = row[col];
                    html += `<td>${value !== null && value !== undefined ? formatValue(value) : '-'}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            html += `<p style="margin-top: 1rem; color: var(--text-secondary);">显示前10条数据，共 ${sheet.rows || 0} 行</p>`;
        }
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// Helper functions
function formatValue(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
        // Format numbers with appropriate precision
        if (Math.abs(value) >= 1000000) {
            return (value / 1000000).toFixed(2) + 'M';
        } else if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(2) + 'K';
        } else {
            return value.toFixed(2);
        }
    }
    return String(value);
}

function createCashFlowChart(sheetName, sheetData) {
    const canvasId = `cashflow-chart-${sheetName.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas || !sheetData.data || sheetData.data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    // Extract data for chart
    const labels = [];
    const datasets = [];
    
    // Get numeric columns
    const numericColumns = sheetData.columns.filter(col => {
        if (!sheetData.data[0]) return false;
        const val = sheetData.data[0][col];
        return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
    });
    
    numericColumns.forEach((col, idx) => {
        const data = sheetData.data.map(row => {
            const val = row[col];
            return typeof val === 'number' ? val : parseFloat(val) || 0;
        });
        
        datasets.push({
            label: col,
            data: data,
            borderColor: `hsl(${idx * 60}, 70%, 50%)`,
            backgroundColor: `hsla(${idx * 60}, 70%, 50%, 0.1)`,
            tension: 0.4
        });
    });
    
    // Use first column as labels if it's not numeric
    if (sheetData.columns.length > 0 && numericColumns.indexOf(sheetData.columns[0]) === -1) {
        labels.push(...sheetData.data.map(row => String(row[sheetData.columns[0]] || '')));
    } else {
        labels.push(...sheetData.data.map((_, idx) => `Item ${idx + 1}`));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: sheetName }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createMonthlyChart(sheetName, sheetData) {
    const canvasId = `monthly-chart-${sheetName.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas || !sheetData.data || sheetData.data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    // Find date column
    const dateCol = sheetData.columns.find(col => 
        col.includes('日期') || col.includes('Date') || col.includes('date')
    );
    
    // Get numeric columns (exclude date)
    const numericCols = sheetData.columns.filter(col => {
        if (col === dateCol) return false;
        if (!sheetData.data[0]) return false;
        const val = sheetData.data[0][col];
        return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
    });
    
    const labels = dateCol ? sheetData.data.map(row => String(row[dateCol] || '')) : 
        sheetData.data.map((_, idx) => `Day ${idx + 1}`);
    
    const datasets = numericCols.slice(0, 5).map((col, idx) => {
        const data = sheetData.data.map(row => {
            const val = row[col];
            return typeof val === 'number' ? val : parseFloat(val) || 0;
        });
        
        return {
            label: col,
            data: data,
            borderColor: `hsl(${idx * 72}, 70%, 50%)`,
            backgroundColor: `hsla(${idx * 72}, 70%, 50%, 0.1)`,
            tension: 0.4
        };
    });
    
    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: sheetName }
            },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

