# DNS 配置说明 - thisisyz.com

## ✅ 已完成
- 网站已成功部署到 Vercel
- 域名 `thisisyz.com` 和 `www.thisisyz.com` 已添加到 Vercel 项目

## 📋 需要配置 DNS 记录

### 方式一：使用 A 记录（推荐）

在你的域名注册商（如 GoDaddy, Namecheap, Cloudflare 等）的 DNS 管理面板中添加以下记录：

1. **主域名 A 记录：**
   - 类型：A
   - 名称：@ 或 thisisyz.com
   - 值：76.76.21.21
   - TTL：3600（或自动）

2. **www 子域名 A 记录：**
   - 类型：A
   - 名称：www
   - 值：76.76.21.21
   - TTL：3600（或自动）

### 方式二：使用 CNAME 记录

1. **主域名：**
   - 类型：A
   - 名称：@
   - 值：76.76.21.21

2. **www 子域名：**
   - 类型：CNAME
   - 名称：www
   - 值：cname.vercel-dns.com

### 方式三：更改 Nameservers（最简单）

将域名的 nameservers 更改为 Vercel 的 nameservers：
- ns1.vercel-dns.com
- ns2.vercel-dns.com

## ⏱️ DNS 生效时间

DNS 更改通常需要 24-48 小时才能完全生效，但通常几分钟到几小时内就会开始生效。

## 🔍 验证 DNS 配置

配置完成后，你可以使用以下命令检查：

```bash
# 检查 A 记录
dig thisisyz.com A
dig www.thisisyz.com A

# 或使用 nslookup
nslookup thisisyz.com
```

## 📱 当前可访问的地址

在 DNS 配置完成之前，你可以通过以下地址访问网站：
- https://zy-personal-web.vercel.app
- https://zy-personal-njptbcty6-yinziaiesecjinan-4995s-projects.vercel.app

## ✅ 配置完成后

DNS 配置完成后，Vercel 会自动验证域名，你会收到确认邮件。之后就可以通过以下地址访问：
- https://thisisyz.com
- https://www.thisisyz.com

## 🆘 需要帮助？

如果遇到问题，可以：
1. 访问 Vercel 控制台：https://vercel.com/dashboard
2. 查看项目设置中的域名配置
3. 查看 Vercel 文档：https://vercel.com/docs/concepts/projects/domains

