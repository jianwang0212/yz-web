# 数据文件部署说明

## 概述

为了保持 GitHub 仓库的精简，大型数据文件已被排除在版本控制之外。这些文件需要单独部署。

## 需要部署的文件

### 数据文件 (`data/` 目录)
- `data/content.json` (92KB)
- `data/cleaned_content.json` (207KB)

这些文件包含网站的所有内容数据（时间线、文章、财务数据等）。

## 部署方式

### 方式 1: Vercel 本地文件部署（推荐）

Vercel 在构建时会包含这些文件，因为它们不在 `.gitignore` 中（只是不在 git 仓库中）。

确保在部署前将数据文件放在 `data/` 目录下：
```bash
# 在本地开发时，确保这些文件存在
ls data/*.json
```

### 方式 2: 使用环境变量或外部存储

如果需要从外部加载数据，可以修改 `script.js` 中的数据加载逻辑：

```javascript
// 从环境变量获取数据 URL
const DATA_URL = process.env.DATA_URL || 'data/content.json';
```

### 方式 3: 使用 Vercel 环境变量

可以将 JSON 数据作为环境变量存储在 Vercel 项目中。

## 当前状态

- ✅ 数据文件已从 git 中移除
- ✅ `.gitignore` 已更新，排除大型数据文件
- ✅ 目录结构通过 `.gitkeep` 文件保留
- ⚠️ **重要**: 部署时需要确保数据文件存在于项目中

## 恢复数据文件

如果需要恢复数据文件到项目中（用于部署），请从备份或其他来源复制：

```bash
cp /path/to/backup/content.json data/
cp /path/to/backup/cleaned_content.json data/
```

## 注意事项

1. 本地开发时需要确保 `data/` 目录下有 JSON 文件
2. Vercel 部署时会包含项目目录中的所有文件（包括被 gitignore 的文件）
3. 如果使用 CI/CD，需要在构建步骤中确保数据文件存在

