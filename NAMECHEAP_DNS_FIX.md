# Namecheap DNS 配置修复指南

## 🔴 当前问题
DNS 记录仍然指向旧的 IP 地址 `8.216.38.222`，需要更新为 Vercel 的 IP `76.76.21.21`。

## ✅ 正确的 DNS 配置

### 步骤 1：修改主域名 A 记录

1. 在 Namecheap 的 Advanced DNS 页面找到：
   - Type: **A Record**
   - Host: **@**
   - Value: **8.216.38.222** ← 这是旧的，需要修改

2. 点击该行的**编辑图标**（铅笔图标）或**删除后重新添加**

3. 修改为：
   - Type: **A Record**
   - Host: **@**
   - Value: **76.76.21.21** ← 改为这个
   - TTL: **Automatic**（或保持 30 min）

4. 点击 **Save** 保存

### 步骤 2：修改 www 子域名

**选项 A：使用 A 记录（推荐）**

1. **删除**现有的 CNAME 记录：
   - Type: CNAME Record
   - Host: www
   - Value: thisisyz.com.

2. **添加**新的 A 记录：
   - 点击 **"ADD NEW RECORD"** 按钮
   - 选择 **A Record**
   - Host: **www**
   - Value: **76.76.21.21**
   - TTL: **Automatic**（或 30 min）
   - 点击 **Save**

**选项 B：保持 CNAME（也可以）**

如果你想保持 CNAME 记录，确保它指向主域名：
- Type: **CNAME Record**
- Host: **www**
- Value: **thisisyz.com.**（注意末尾的点）

## 📋 最终配置应该是：

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | Automatic |
| A Record | www | 76.76.21.21 | Automatic |

或者：

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | Automatic |
| CNAME Record | www | thisisyz.com. | Automatic |

## ⏱️ 生效时间

DNS 更改后通常需要：
- **最快**：5-15 分钟
- **一般**：30 分钟到 2 小时
- **最长**：24-48 小时（很少见）

## ✅ 验证配置

配置完成后，等待几分钟，然后运行：

```bash
dig thisisyz.com A +short
```

应该显示：`76.76.21.21`

如果还是显示 `8.216.38.222`，说明 DNS 还没有更新，请再等待一段时间。

## 🎯 配置完成后

DNS 更新后，访问 https://thisisyz.com 应该就能看到你的网站了！

如果还有问题，可以：
1. 清除浏览器缓存
2. 尝试无痕模式访问
3. 等待更长时间让 DNS 完全传播

