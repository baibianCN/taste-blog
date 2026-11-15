# taste-blog · 一键部署到 Cloudflare 的个人博客

> 深色石墨 + 安全橙的编辑部级设计，文章 / 公告 / 评论 / 点赞 / 抖音视频 / 自定义背景图，全部功能。
> **无需服务器、无需数据库经验、全部使用 Cloudflare 免费额度，部署只要几分钟。**

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/baibianCN/taste-blog)

**👆 点上面的按钮一键部署**：全程网页操作，不用改任何代码或链接。按钮图片打不开？直接访问部署链接：
`https://deploy.workers.cloudflare.com/?url=https://github.com/baibianCN/taste-blog`

## 🖱️ 部署 = 4 次点击 + 填一次名字

> **开始前需要两个免费账号**（没有就先注册，各 30 秒，都不用绑卡）：
>
> 1. **GitHub 账号** —— 部署按钮会请求 GitHub 授权，因为 Cloudflare 要把博客代码复制一份到你自己的 GitHub 仓库（这就是你没有手动 Fork 的原因）。还没有的话去 [github.com](https://github.com) 注册，只要一个用户名和邮箱
> 2. **Cloudflare 账号** —— 博客跑在你自己的 Cloudflare 免费额度上。还没有的话去 [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) 注册，填邮箱即可
>
> 两个账号都齐了再点按钮，全程不会再卡住。

> ⚠️ **大陆用户请提前准备一个域名**：部署完成后默认网址是 `xxx.workers.dev`，**这个域名在中国大陆被墙，大陆访客打不开**（海外正常）。解决办法很简单：现在就顺手去 [DNSHE](https://www.dnshe.com/) 免费领一个域名（2 分钟，不要钱），部署完按下面「免费域名一条龙」绑定即可，大陆就能正常访问了。**不想提前领也行**，部署不受影响，绑域名随时可以后补。

```text
① 点上面的 Deploy 按钮
② 按 GitHub 提示授权（第一次会跳转 GitHub 点一次 Authorize）
③ Cloudflare 页面上每一屏都点「下一步 / Deploy」（自动建库，不用填任何东西）
④ 构建跑完（1~2 分钟），打开它给你的网址
⑤ 网站自动跳到安装面板，填上博客名字和管理员密码 → 完事，你的博客上线了
```

之后想发文章？打开 `你的网址/admin`，输安装时设的密码就行。**没有第五步，没有命令行，没有配置文件。**

> 💡 过程中弹出的所有确认框（授权 GitHub、创建 D1 数据库、Provision）都是 Cloudflare 自动办理，一路点确认即可。

<details>
<summary><b>🧭 安装向导每个字段是什么</b>（点开看）</summary>

第一次打开网站会自动跳到 `/install` 安装面板，一共一个页面：

| 字段 | 说明 |
|---|---|
| 站点名称 | 你的博客名字，显示在顶栏 / 页脚 / 浏览器标题 |
| 一句话介绍 | 显示在首页 hero 和页脚，可留空 |
| 管理员用户名 | 以后进后台用的账号 |
| 管理员密码 | 至少 6 位，请记牢 |
| 博客头像 | 可选，不上传就用默认图标 |

点 **完成安装** → 自动进入管理后台，示例文章已就位（可以删掉），直接开写。

</details>

<details>
<summary><b>📖 日常使用手册</b>（发文章 / 公告 / 背景图 / 评论管理，点开看）</summary>

### 发文章

网址输入 `/admin`（或点右下角 **＋** 按钮）→ 输入安装时设置的用户名密码 → **文章** 标签：

- **标题**：1 - 80 字
- **正文**：支持换行，最多 1 万字
- **抖音视频**（可选）：把抖音 App 的「分享链接」整段粘贴进去就行，比如
  `9.48 复制打开抖音，看看【xx的作品】 https://v.douyin.com/xxxxx/`
  也可以只填纯视频 ID。前台会显示竖屏播放按钮，**访客点击后才加载官方播放器**
- **图片**：每张 ≤ 1.5MB，最多 9 张
- **附件**：每个 ≤ 512KB，最多 5 个（txt / md / pdf / zip / 配置文件等）

### 公告

后台 → **公告** 标签。最新一条会显示在首页顶部横条。

### 站点信息 / 头像 / 背景图

后台 → **外观** 标签：

- **站点信息**：改博客名字和一句话介绍（顶栏页脚即时生效）
- **博客头像**：显示在首页顶部等处
- **网站背景**：上传一张图后全站固定显示——**背景不动，内容在背景上滚动**，顶栏半透明融合（无模糊）；不想用了点「恢复默认背景」

### 访客怎么互动

- **评论**：文章底部填昵称（可空，默认「访客」）+ 内容即可，无需任何账号
- **点赞**：直接点 ♥，一台浏览器设备计一次
- 你可以在后台删除任何评论

### 绑定自己的域名（可选）

Cloudflare 控制台 → **Workers 和 Pages** → `taste-blog` → **设置** → **域和路由** → **添加自定义域**，输入你在 Cloudflare 托管的域名（例如 `blog.example.com`），一分钟生效，证书自动配好。

> 💡 没有域名？往下看「免费域名一条龙」，0 元搞定，全程不用花钱。

</details>

<details>
<summary><b>🆓 免费域名一条龙：DNSHE 注册 → 托管到 Cloudflare → 绑定博客</b>（0 元，约 15 分钟，点开看）</summary>

[DNSHE](https://www.dnshe.com/) 是一个免费域名注册平台：不用信用卡、不用手机号，国内外邮箱都能注册，送二级域名（如 `.de5.net` / `.us.ci` 等后缀），并且**支持修改 NS 托管到 Cloudflare**——这正是我们要的。整套流程四步：

**第 1 步：注册 DNSHE 账号**

1. 打开 [www.dnshe.com](https://www.dnshe.com/) → 右上角「注册 / 免费注册」
2. 支持谷歌、微软、GitHub、QQ、163 等账号直接登录，填个邮箱就行
3. 建议顺手在账号设置里绑定邮箱提醒（后面讲为什么要）

**第 2 步：注册一个免费域名**

1. 登录后进入「免费域名」页面，能看到可注册的后缀列表
2. 输入你想要的前缀（比如 `myblog`），选一个后缀（推荐 `.de5.net`，短、好记、实测可托管 Cloudflare），点查询
3. 显示可用 → 确认注册，几秒钟后 `myblog.de5.net` 就归你了

> ⚠️ **免费域名规则（务必知道）**：域名默认有效期 1 年；到期前 **180 天内可以免费续期**，次数不限，等于可以一直白嫖但每年要主动点一次续期。DNSHE 会发邮件提醒，绑定 Telegram 还能收到提醒——所以记得把提醒渠道配好，域名忘了续被回收就可惜了。控制台里还有「域名永久升级」活动，可以免续期。

**第 3 步：把域名托管到 Cloudflare**

这一步的意义：把域名的 DNS 解析权交给 Cloudflare，之后就能用 Cloudflare 的免费 CDN、HTTPS 证书和防护。

1. 打开 Cloudflare 控制台 → 首页 → **添加站点**（Add a domain）
2. 输入你刚注册的**完整域名**（如 `myblog.de5.net`）→ 如果提示需要手动输入 DNS 记录，直接留空继续
3. 选 **Free 免费计划** → 继续
4. Cloudflare 会给你**两个 NS 地址**（形如 `xxx.ns.cloudflare.com` / `yyy.ns.cloudflare.com`），复制下来
5. 回到 DNSHE 控制台 → 找到你刚注册的域名 → **DNS 服务器 / NS 设置** → 把默认 NS 替换成 Cloudflare 给的那两个 → 保存
6. 回到 Cloudflare 点「检查名称服务器」，几分钟到几小时后显示「已激活」即托管成功

**第 4 步：把域名绑定到你的博客**

1. Cloudflare 控制台 → **Workers 和 Pages** → `taste-blog` → **设置**
2. **域和路由** → **添加自定义域** → 输入你想用的地址，比如 `www.myblog.de5.net` 或 `blog.myblog.de5.net`
3. 一分钟生效，HTTPS 证书自动配好，大陆和海外都能访问

**完成后**：打开你绑定的域名 → 就是你的博客。原来的 `*.workers.dev` 网址继续可用（大陆打不开而已），以后发文章都在 `/admin`。

> 💡 三步全免费：Cloudflare 免费套餐 + DNSHE 免费域名 + 免费证书。唯一要记住的事：**每年去 DNSHE 点一次免费续期**（或者做永久升级）。

</details>

<details>
<summary><b>🔧 进阶玩法</b>（命令行部署 / Git 自动构建 / 忘密码 / 备份，点开看）</summary>

### 命令行部署（想手动控制的人用，一般用不到）

**前提**：装好 [Node.js 18+](https://nodejs.org)。

```bash
git clone https://github.com/baibianCN/taste-blog.git
cd taste-blog
npx wrangler login
npx wrangler d1 create taste-blog-db        # 复制输出的 database_id
# 打开 wrangler.toml，把 database_id 的占位符换成刚才的 id
npx wrangler d1 execute taste-blog-db --remote --file=./schema.sql
npx wrangler deploy
```

本地预览：`npx wrangler dev` → http://localhost:8787

### push 即上线（Git 自动构建）

一键部署完成后 Cloudflare 已自动配好 CI/CD：以后在你账号下那份仓库 `git push`，网站几十秒内自动更新，什么都不用做。

### 忘记管理员密码怎么办

一条命令删除管理员记录，然后 `/admin` 会变成「设置管理员」表单，重新创建即可（文章数据不受影响）：

```bash
npx wrangler d1 execute taste-blog-db --remote --command "DELETE FROM kv WHERE k='admin'"
```

### 备份 / 导出数据

```bash
npx wrangler d1 export taste-blog-db --remote --table kv --output backup.sql
```

所有文章、公告、评论、设置都在 D1 的 `kv` 表里，换机器部署时执行这个 SQL 即可完整还原。

</details>

<details>
<summary><b>❓ FAQ</b>（点开看）</summary>

**Q：大陆访问 `workers.dev` 网址打不开？**
是的，`*.workers.dev` 在中国大陆被墙（DNS 污染）。这只影响默认网址，部署流程本身不受影响。解决办法是绑一个自定义域名，走海外节点，不需要备案，大陆可正常访问——没有域名可以去 [DNSHE](https://www.dnshe.com/) 免费领一个，完整教程见上方「🆓 免费域名一条龙」。

**Q：部署时报错 `database_id` 相关 / D1001？**
用一键部署不会遇到（Cloudflare 自动建库）；命令行部署的话是 `wrangler.toml` 的 id 没换，见上方命令行步骤。

**Q：打开网站 1101 报错？**
命令行部署时表还没建：执行一次 `npx wrangler d1 execute taste-blog-db --remote --file=./schema.sql`，再刷新。

**Q：免费额度够用吗？**
Cloudflare Workers 免费版每天 10 万次请求、D1 每天 500 万次读 / 10 万次写。个人博客远远用不完。

**Q：图片存在哪里？会不会丢？**
存在你自己的 D1 数据库里，跟着 Cloudflare 账号走，不依赖任何第三方图床。

**Q：怎么删掉示例文章？**
后台 → 文章 → 每条右侧「删除」。

**Q：能改配色吗？**
能。`public/assets/style.css` 顶部就是设计令牌（`--accent` 安全橙、`--bg` 石墨底），改几个变量全站生效。

**Q：我 Fork 了仓库再点部署按钮，部署的是谁的代码？**
点按钮部署的始终是按钮链接指向的仓库（原作者的 `baibianCN/taste-blog`），Cloudflare 会把那份代码克隆到你自己账号下再部署，所以 Fork 不 Fork 都能直接用。想基于自己的修改部署：一键部署后代码已在你账号下的仓库里，直接在那份仓库改代码并 `git push` 即可自动重新部署，不需要改按钮链接。

**Q：为什么没有注册 / 登录页面？**
这是刻意设计的极简单人博客：访客只管看、评论、点赞；站长的一切操作都在 `/admin`。没有可被攻击的注册体系，也没有垃圾注册。

</details>

---

## ✨ 功能一览

- ✅ 文章：图片（最多 9 张）/ 附件（下载）/ 抖音视频竖屏播放器（只存视频 ID，不占空间）
- ✅ 公告：首页顶部横条 + 独立公告页
- ✅ 访客互动：评论（昵称 + 内容，无需注册）、点赞（一台设备一次）
- ✅ 管理后台：发文 / 管评论 / 发公告 / 站点信息 / 博客头像 / **全站背景图**（背景固定不滚动，顶栏透明融合）
- ✅ 深色为默认主题，一键切换浅色；手机 / 电脑两套排版
- ✅ 安全：PBKDF2 密码哈希、签名 Cookie 会话、CSRF 双提交校验、上传文件魔数校验
- ✅ 全部数据存你自己的 Cloudflare D1 数据库，随时可导出

> 📌 发布者信息：仓库地址 `github.com/baibianCN/taste-blog`（使用者点按钮后，Cloudflare 会自动把仓库克隆到使用者自己的账号下，所以使用者不需要 Fork、不需要改任何东西）。

---

## 🗂 项目结构

```
taste-blog/
├── wrangler.toml          # Cloudflare 配置（项目名 / 静态资源 / D1 绑定）
├── schema.sql             # 数据库建表语句（只需执行一次）
├── src/
│   ├── worker.js          # 入口路由：页面 / 动作 / 安装 / 上传服务
│   ├── lib.js             # 数据层：D1 存储 / 密码哈希 / 会话 / 上传 / 抖音 ID 提取
│   └── views.js           # 全部页面渲染（安装面板 / 首页 / 详情 / 后台 …）
├── public/                # 静态资源（Cloudflare 全球 CDN 直出）
│   ├── assets/style.css   # 设计令牌 + 全站样式
│   ├── assets/app.js      # 前端交互（主题 / 抽屉 / 预览 / 懒加载）
│   └── assets/fonts/      # 自托管字体（不依赖 Google CDN）
└── test/                  # 本地 mock 运行器 + 33 项全流程自动测试
```

**本地开发 / 测试**

```bash
node test/serve.mjs        # 内存模拟 D1，http://localhost:8600 直接可用，无需 Cloudflare 账号
node test/flow.mjs         # 33 项全流程自动测试（安装→发文→评论→点赞→后台→背景图）
```

## 📜 许可证

MIT — 随便用，改完记得保留 LICENSE 文件。
