# Codex Monitor Website Sync

这个页面会展示来自本地 `MacBookPro` 的公开摘要数据，并通过网站 API 每 5 分钟更新一次。

## 网站端需要的环境变量

在 Vercel 项目中设置：

- `CODEX_MONITOR_INGEST_TOKEN`
  与本地 `apps/html-dashboard/.env` 中的 `REMOTE_SYNC_TOKEN` 保持一致
- `BLOB_READ_WRITE_TOKEN`
  由 Vercel Blob 自动提供

## 网站端需要的存储

1. 在 Vercel 项目里创建一个 Blob Store
2. 连接到当前网站项目
3. 让 `BLOB_READ_WRITE_TOKEN` 注入到 Production 环境

## 本地端

本地 `Codex Monitor` 已支持这些变量：

- `REMOTE_SYNC_URL`
- `REMOTE_SYNC_TOKEN`
- `REMOTE_SYNC_MACHINE_ID`
- `REMOTE_SYNC_MACHINE_NAME`
- `REMOTE_SYNC_INTERVAL_MS`

默认目标：

```env
REMOTE_SYNC_URL=https://thisisyz.com/api/codex-monitor/ingest
REMOTE_SYNC_MACHINE_ID=macbookpro
REMOTE_SYNC_MACHINE_NAME=MacBookPro
REMOTE_SYNC_INTERVAL_MS=300000
```

## 公开同步范围

只上传公开摘要：

- machine label
- active agents
- token totals
- CPU / memory
- top agents summary
- top model summary
- coarse history points

不会上传：

- prompt 原文
- 源码内容
- 本地日志原文
- 完整命令行
- 敏感 token / cookie
