// Vercel Serverless Function for handling year review feedback form submissions
import nodemailer from 'nodemailer';

// 简单的防重复提交（基于IP和时间）
const submissions = new Map();

function checkDuplicate(ip, timestamp) {
    const lastSubmission = submissions.get(ip);
    
    if (lastSubmission && (timestamp - lastSubmission) < 60000) { // 1分钟内
        return true;
    }
    
    submissions.set(ip, timestamp);
    // 清理旧记录（保留最近1小时）
    setTimeout(() => {
        if (submissions.get(ip) === timestamp) {
            submissions.delete(ip);
        }
    }, 3600000);
    
    return false;
}

async function sendEmail(formData, clientIP) {
    // 使用环境变量配置邮件服务
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const emailContent = `
【2025年度回顾】来自 ${formData.name} 的分享

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【基本信息】
姓名：${formData.name}
Email：${formData.email || '未填写'}
联系方式：${formData.contact || '未填写'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【回顾 2025】

最印象深刻的一件事：
${formData['impressive-event'] || '未填写'}

遇到有趣的人 / 发生新鲜的事情：
${formData['interesting-people'] || '未填写'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【2025 年度关键词】

关键词：${formData.keywords || '未填写'}

最重要的关键词及原因：
${formData['keyword-importance'] || '未填写'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【时间与选择】

花时间最多的三件事：
① ${formData['time-spent-1'] || '未填写'}
② ${formData['time-spent-2'] || '未填写'}
③ ${formData['time-spent-3'] || '未填写'}

最满意的三笔消费 / 投入：
① ${formData['satisfaction-1'] || '未填写'}
② ${formData['satisfaction-2'] || '未填写'}
③ ${formData['satisfaction-3'] || '未填写'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【向未来】

2026年最想尝试的一件事：
${formData['future-try'] || '未填写'}

未来可以一起做的事情：
${formData.collaboration || '未填写'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
IP地址：${clientIP}
    `.trim();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'silver.ziyin@gmail.com',
        subject: `【2025年度回顾】来自 ${formData.name} 的分享`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>').replace(/━━━/g, '─')
    };

    await transporter.sendMail(mailOptions);
}

export default async function handler(req, res) {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                        req.headers['x-real-ip'] || 
                        req.connection?.remoteAddress || 
                        'unknown';
        const timestamp = Date.now();

        // 防重复提交检查
        if (checkDuplicate(clientIP, timestamp)) {
            return res.status(429).json({ error: '请勿重复提交，请稍后再试' });
        }

        const formData = req.body;

        // 验证必填字段
        if (!formData.name || formData.name.trim() === '') {
            return res.status(400).json({ error: '姓名是必填项' });
        }

        // 发送邮件
        await sendEmail(formData, clientIP);

        // TODO: 存储到数据库
        // 这里可以添加数据库存储逻辑，例如：
        // - 使用Vercel Postgres
        // - 使用Supabase
        // - 使用MongoDB Atlas
        // - 使用简单的文件存储（不推荐用于生产环境）

        return res.status(200).json({ 
            success: true,
            message: '提交成功，感谢你的分享！'
        });

    } catch (error) {
        console.error('Error processing form submission:', error);
        return res.status(500).json({ 
            error: '提交失败，请稍后重试',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
