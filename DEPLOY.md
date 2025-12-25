# 部署指南 - thisisyz.com

## 方式一：使用 Vercel（推荐）

Vercel 是最简单快速的部署方式，支持自动部署和自定义域名。

### 步骤：

1. **安装 Vercel CLI（如果还没有）：**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel：**
   ```bash
   vercel login
   ```

3. **部署项目：**
   ```bash
   cd /root/zy-personal-web
   vercel
   ```

4. **添加自定义域名：**
   - 访问 https://vercel.com/dashboard
   - 选择你的项目
   - 进入 Settings > Domains
   - 添加域名：`thisisyz.com` 和 `www.thisisyz.com`
   - 按照提示配置 DNS 记录

### DNS 配置：
在你的域名注册商处添加以下 DNS 记录：
- 类型：A
- 名称：@
- 值：76.76.21.21

或者使用 CNAME：
- 类型：CNAME
- 名称：@
- 值：cname.vercel-dns.com

## 方式二：使用 Netlify

1. **安装 Netlify CLI：**
   ```bash
   npm i -g netlify-cli
   ```

2. **登录并部署：**
   ```bash
   cd /root/zy-personal-web
   netlify login
   netlify deploy --prod
   ```

3. **添加自定义域名：**
   - 在 Netlify 控制台添加域名
   - 配置 DNS 记录

## 方式三：使用 GitHub Pages

1. **在仓库设置中启用 GitHub Pages**
2. **选择 main 分支作为源**
3. **使用自定义域名：**
   - 在仓库根目录创建 `CNAME` 文件
   - 内容：`thisisyz.com`
   - 配置 DNS 指向 GitHub Pages

## 方式四：直接部署到服务器

如果你有自己的服务器：

1. **使用 rsync 或 scp 上传文件：**
   ```bash
   rsync -avz --exclude '.git' /root/zy-personal-web/ user@your-server:/var/www/thisisyz.com/
   ```

2. **配置 Nginx：**
   ```nginx
   server {
       listen 80;
       server_name thisisyz.com www.thisisyz.com;
       
       root /var/www/thisisyz.com;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 推荐流程（Vercel）

最简单的方式是使用 Vercel：

```bash
cd /root/zy-personal-web
npm i -g vercel
vercel login
vercel --prod
```

然后在 Vercel 控制台添加自定义域名 `thisisyz.com`。

