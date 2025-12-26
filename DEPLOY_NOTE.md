# ⚠️ 重要：数据文件部署说明

## 当前变更

已将所有大型数据文件从 git 中移除，以保持仓库精简：

- ❌ `data/content.json` (92KB) - 已从 git 移除
- ❌ `data/cleaned_content.json` (207KB) - 已从 git 移除
- ✅ 目录结构保留（通过 `.gitkeep` 文件）

## Vercel 部署问题

**重要**: 由于数据文件现在不在 git 仓库中，从 GitHub 自动部署到 Vercel 时，这些文件将不存在！

## 解决方案

### 方案 1: 本地部署（推荐用于当前情况）

如果数据文件仍然在本地文件系统中，可以直接部署：

```bash
cd /root/zy-personal-web
vercel --prod
```

Vercel CLI 会包含本地所有文件（包括被 gitignore 的文件）。

### 方案 2: 将数据文件放在 Vercel 项目中

1. 在 Vercel 项目设置中，可以在构建命令中下载数据文件
2. 或者使用 Vercel 的 File Storage 功能

### 方案 3: 修改代码从外部加载数据

修改 `script.js`，让数据从外部 URL 加载：

```javascript
const DATA_URL = 'https://your-cdn.com/data/cleaned_content.json';
```

### 方案 4: 暂时恢复数据文件到 git（临时方案）

如果需要从 GitHub 自动部署，可以暂时取消 gitignore 这些文件：

```bash
# 修改 .gitignore，注释掉 data/*.json
git add data/*.json
git commit -m "Temporarily add data files for deployment"
```

## 建议

对于生产环境，建议使用方案 3（外部 CDN）或方案 2（Vercel File Storage），这样：
- 代码仓库保持精简
- 数据可以独立更新
- 部署更灵活

