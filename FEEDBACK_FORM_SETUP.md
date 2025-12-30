# 年度回顾反馈表单设置说明

## 功能说明

在 `year-review.html` 页面底部新增了互动反馈区，访客可以填写2025年度回顾并提交。

## 环境变量配置

需要在 Vercel 项目设置中配置以下环境变量：

1. **EMAIL_USER**: Gmail邮箱地址（用于发送邮件）
2. **EMAIL_PASS**: Gmail应用专用密码（不是普通密码）

### 如何获取 Gmail 应用专用密码：

1. 登录 Google 账号
2. 前往 [Google 账号安全设置](https://myaccount.google.com/security)
3. 启用"两步验证"（如果尚未启用）
4. 在"应用专用密码"部分，生成新的应用专用密码
5. 将生成的16位密码设置为 `EMAIL_PASS` 环境变量

### 在 Vercel 中设置环境变量：

1. 登录 Vercel Dashboard
2. 选择项目 `zy-personal-web`
3. 进入 Settings → Environment Variables
4. 添加以下变量：
   - `EMAIL_USER`: 你的Gmail邮箱（如：your-email@gmail.com）
   - `EMAIL_PASS`: Gmail应用专用密码

## 功能特性

- ✅ 表单提交后自动发送邮件到 `silver.ziyin@gmail.com`
- ✅ 邮件标题格式：`【2025年度回顾】来自 {姓名} 的分享`
- ✅ 邮件内容包含所有填写字段，结构化排版
- ✅ 防重复提交（同一IP 1分钟内只能提交一次）
- ✅ 提交后显示感谢信息
- ✅ 无需登录，公开访问

## 数据存储

目前表单数据仅通过邮件发送，未存储到数据库。

如需持久化存储，可以：

1. **使用 Vercel Postgres**（推荐）
   - 在 Vercel Dashboard 中添加 Postgres 数据库
   - 在 API 函数中连接数据库并存储数据

2. **使用 Supabase**
   - 创建 Supabase 项目
   - 创建反馈表
   - 在 API 函数中连接 Supabase

3. **使用 MongoDB Atlas**
   - 创建 MongoDB 集群
   - 在 API 函数中连接 MongoDB

## API 端点

- **路径**: `/api/submit-feedback`
- **方法**: `POST`
- **Content-Type**: `application/json`

### 请求示例：

```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "contact": "微信：zhangsan",
  "impressive-event": "最印象深刻的一件事...",
  "interesting-people": "遇到有趣的人...",
  "keywords": "转型 / 学习 / 勇气",
  "keyword-importance": "转型最重要，因为...",
  "time-spent-1": "工作",
  "time-spent-2": "学习",
  "time-spent-3": "运动",
  "satisfaction-1": "购买课程",
  "satisfaction-2": "旅行",
  "satisfaction-3": "投资",
  "future-try": "学习新技能",
  "collaboration": "一起做项目"
}
```

### 响应示例：

成功：
```json
{
  "success": true,
  "message": "提交成功，感谢你的分享！"
}
```

失败：
```json
{
  "error": "错误信息"
}
```

## 测试

部署后，访问 `https://thisisyz.com/year-review.html`，滚动到页面底部，填写表单并提交。

检查：
1. 表单提交后是否显示成功消息
2. 是否收到邮件通知
3. 防重复提交是否生效（1分钟内重复提交应被拒绝）

## 注意事项

- 确保 Gmail 账号已启用"两步验证"
- 使用应用专用密码，不要使用普通密码
- 如果邮件发送失败，检查 Vercel 函数日志
- 建议定期检查 Vercel 函数日志以确保正常运行

