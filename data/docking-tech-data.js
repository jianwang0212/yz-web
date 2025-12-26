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
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.date || a['\ufeffdate'] || '');
        const dateB = new Date(b.date || b['\ufeffdate'] || '');
        return dateA - dateB;
    });
    
    const dates = [];
    const income = []; // 所有收入（分红+工资，金额为正）
    const expense = []; // 支出（入股等，金额为负的转为正数）
    const dividend = []; // 分红（包含项目收入分红、分红、分红/工资）
    const cumulativeIncome = [];
    let cumulative = 0;
    
    sortedData.forEach(row => {
        const dateKey = row.date || row['\ufeffdate'] || '';
        const amount = parseFloat(row.amount || '0');
        const type = row.type || '';
        
        if (dateKey && !isNaN(amount)) {
            dates.push(dateKey);
            
            // 分类处理
            let inc = 0;
            let exp = 0;
            let div = 0;
            
            if (amount > 0) {
                // 正数：收入或分红
                if (type.includes('分红') || type.includes('工资') || type === '分红/工资') {
                    inc = amount / 10000; // 转换为万
                    
                    // 分红
                    if (type.includes('分红') || type === '分红/工资') {
                        div = amount / 10000;
                    }
                } else {
                    inc = amount / 10000;
                }
            } else if (amount < 0) {
                // 负数：支出（如入股）
                exp = Math.abs(amount) / 10000; // 转为正数并转换为万
            }
            
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

