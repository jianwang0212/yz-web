// 入坞科技财务数据
// 数据从 CSV 文件生成
const dockingTechData = {
    // 这里的数据将从 CSV 文件动态加载
    rawData: [],
    processedData: null
};

// 加载并处理 CSV 数据
async function loadDockingTechData() {
    try {
        const response = await fetch('financial-data/DockingTech_cashflow.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            console.error('CSV file is empty or invalid');
            return null;
        }
        
        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index].trim().replace(/"/g, '');
                });
                data.push(row);
            }
        }
        
        return processDockingTechData(data);
    } catch (error) {
        console.error('Error loading CSV:', error);
        return null;
    }
}

// Parse CSV line (handling quoted values with commas)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Process data for chart
function processDockingTechData(data) {
    if (!data || data.length === 0) return null;
    
    const dates = [];
    const income = [];
    const expense = [];
    const dividend = [];
    const cumulativeIncome = [];
    let cumulative = 0;
    
    // Identify column names (flexible matching)
    let dateCol = null;
    let incomeCol = null;
    let expenseCol = null;
    let dividendCol = null;
    
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const headerLower = header.toLowerCase();
        if (!dateCol && (headerLower.includes('date') || header.includes('日期') || header.includes('时间'))) {
            dateCol = header;
        }
        if (!incomeCol && (headerLower.includes('income') || header.includes('收入') || headerLower.includes('revenue'))) {
            incomeCol = header;
        }
        if (!expenseCol && (headerLower.includes('expense') || header.includes('支出') || headerLower.includes('cost'))) {
            expenseCol = header;
        }
        if (!dividendCol && (headerLower.includes('dividend') || header.includes('分红') || header.includes('分红'))) {
            dividendCol = header;
        }
    });
    
    // Process each row
    data.forEach(row => {
        if (dateCol && row[dateCol]) {
            dates.push(row[dateCol]);
            
            const inc = parseFloat(row[incomeCol] || '0') || 0;
            const exp = parseFloat(row[expenseCol] || '0') || 0;
            const div = parseFloat(row[dividendCol] || '0') || 0;
            
            income.push(inc);
            expense.push(exp);
            dividend.push(div);
            
            cumulative += inc;
            cumulativeIncome.push(cumulative);
        }
    });
    
    return {
        dates,
        income,
        expense,
        dividend,
        cumulativeIncome
    };
}

