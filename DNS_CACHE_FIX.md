# DNS 缓存问题修复 - ERR_CONNECTION_TIMED_OUT

## 🔍 问题诊断

错误 `ERR_CONNECTION_TIMED_OUT` 的原因是：

1. **DNS 解析到错误的 IP**：你的系统 DNS 缓存还保留着旧的 IP 地址 `8.216.38.222`
2. **正确的 IP**：应该是 `76.76.21.21`（Vercel 的 IP）
3. **Vercel 服务器正常**：服务器本身是正常工作的

## ✅ 解决方案

### 方法一：清除系统 DNS 缓存

#### Windows：

1. **以管理员身份**打开命令提示符（CMD）或 PowerShell
2. 运行以下命令：
   ```cmd
   ipconfig /flushdns
   ```
3. 如果还不行，运行：
   ```cmd
   ipconfig /release
   ipconfig /renew
   ```

#### Mac：

1. 打开终端（Terminal）
2. 运行：
   ```bash
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```
3. 输入你的管理员密码

#### Linux：

```bash
sudo systemd-resolve --flush-caches
# 或
sudo service network-manager restart
# 或
sudo service systemd-resolved restart
```

### 方法二：更改 DNS 服务器（临时）

如果清除缓存后还是不行，可以临时使用 Google 的公共 DNS：

#### Windows：

1. 打开 **控制面板** → **网络和共享中心**
2. 点击你的网络连接
3. 点击 **属性**
4. 选择 **Internet 协议版本 4 (TCP/IPv4)**
5. 点击 **属性**
6. 选择 **使用下面的 DNS 服务器地址**
7. 填入：
   - 首选 DNS：`8.8.8.8`
   - 备用 DNS：`8.8.4.4`
8. 点击 **确定**

#### Mac：

1. 系统偏好设置 → **网络**
2. 选择你的网络连接
3. 点击 **高级**
4. 选择 **DNS** 标签
5. 点击 **+** 添加：
   - `8.8.8.8`
   - `8.8.4.4`
6. 点击 **确定** → **应用**

### 方法三：验证 Namecheap DNS 配置

确保在 Namecheap 中 DNS 记录是正确的：

1. 登录 Namecheap
2. 进入 **Domain List** → **thisisyz.com** → **Advanced DNS**
3. 确认：
   - A Record: `@` → `76.76.21.21`
   - A Record: `www` → `76.76.21.21`

### 方法四：使用 hosts 文件（临时方案）

如果急需访问网站，可以临时修改 hosts 文件：

#### Windows：

1. 以管理员身份打开记事本
2. 打开文件：`C:\Windows\System32\drivers\etc\hosts`
3. 添加一行：
   ```
   76.76.21.21    thisisyz.com
   76.76.21.21    www.thisisyz.com
   ```
4. 保存文件

#### Mac/Linux：

```bash
sudo nano /etc/hosts
```

添加：
```
76.76.21.21    thisisyz.com
76.76.21.21    www.thisisyz.com
```

保存后清除浏览器缓存。

### 方法五：等待 DNS 传播

DNS 更改可能需要时间传播：

- **最快**：5-15 分钟
- **一般**：30 分钟到 2 小时
- **最长**：24-48 小时

## 🔍 验证 DNS 是否修复

修复后，运行以下命令验证：

### Windows：
```cmd
nslookup thisisyz.com 8.8.8.8
```
应该显示：`Address: 76.76.21.21`

### Mac/Linux：
```bash
dig thisisyz.com @8.8.8.8 +short
```
应该显示：`76.76.21.21`

## 📝 快速解决步骤（推荐顺序）

1. **清除系统 DNS 缓存**（见上面的命令）
2. **清除浏览器缓存**（Ctrl+Shift+Delete）
3. **重启浏览器**
4. **如果还不行，临时更改 DNS 为 Google DNS**（8.8.8.8）
5. **访问网站**：https://thisisyz.com

## ⚠️ 重要提示

- DNS 更改可能需要一些时间才能完全生效
- 不同地区的 DNS 服务器更新时间可能不同
- 如果使用 hosts 文件，记住这是临时方案，DNS 更新后应该删除

## ✅ 确认修复

修复后，你应该能够：
1. 正常访问 https://thisisyz.com
2. 不再看到 ERR_CONNECTION_TIMED_OUT 错误
3. 网站正常加载和显示

