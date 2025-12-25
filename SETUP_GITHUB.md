# GitHub 仓库设置说明

## 当前状态
✅ Git 仓库已初始化
✅ 代码已提交到本地
✅ 远程仓库已配置：`https://github.com/jianwang0212/yz-web.git`

## 方式一：使用 GitHub CLI（推荐）

1. **登录 GitHub CLI：**
   ```bash
   cd /root/zy-personal-web
   gh auth login
   ```
   按照提示选择登录方式（浏览器或 token）

2. **创建并推送仓库：**
   ```bash
   gh repo create yz-web --public --source=. --remote=origin --push
   ```

## 方式二：手动创建仓库

1. **在 GitHub 上创建仓库：**
   - 访问 https://github.com/new
   - 仓库名称：`yz-web`
   - 选择 Public 或 Private
   - **不要**初始化 README、.gitignore 或 license（我们已经有了）
   - 点击 "Create repository"

2. **推送代码：**
   ```bash
   cd /root/zy-personal-web
   git push -u origin main
   ```

## 方式三：使用 Personal Access Token

如果你有 GitHub Personal Access Token：

```bash
cd /root/zy-personal-web
export GH_TOKEN=your_token_here
gh repo create yz-web --public --source=. --remote=origin --push
```

或者使用 curl：

```bash
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{"name":"yz-web","public":true}'
```

然后推送：
```bash
cd /root/zy-personal-web
git push -u origin main
```

