# THU AI · Shen Lab 微应用（MicroAPP）

一句话/点按钮即可使用的**零门槛微工具集合**。  
**纯前端**、**不开账号**、**不上传文件**、**不需要密钥**，适合快速演示与教学落地。

- 在线演示：<https://thu-nmrc.github.io/MicroAPP/>
- 主分支：`main`（GitHub Pages 自动发布）
- 技术栈：原生 HTML/JS、GitHub Pages + Actions（无后端）

---

## ✨ 功能亮点

- **卡片式工具**：每个卡片只做一件事，点开即用。
- **中文友好**：内置“中文格式优化器”等中文场景工具。
- **直达链接**：支持 `/#slug` 打开指定卡片弹窗。
- **自动上新**：每日从候补池自动追加 3–5 个到首页（可手动触发）。
- **安全可控**：纯静态站点，不收集数据、不调用外部 API。

---

## 📁 目录结构

```text
.
├─ index.html                # 首页（渲染卡片+弹窗 UI；默认即可满足多数工具）
├─ handlers.js               # 处理函数集合（每个卡片对应一个 handler）
├─ apps.json                 # 已上线卡片清单（首页从这里渲染）
├─ backlog.json              # 候补池（每天自动从这里追加到 apps.json）
└─ .github/
   ├─ workflows/
   │  ├─ pages.yml           # GitHub Pages 部署（on: push 到 main）
   │  └─ daily_append.yml    # 每日自动上新（手动/定时触发）
   └─ scripts/
      └─ daily_append.mjs    # 将 backlog.json 中的 3–5 个条目追加到 apps.json
```

---

## 🧪 本地预览（可选）

```bash
# 任意静态服务器均可，例如：
python3 -m http.server 8080

# 然后访问：
# http://localhost:8080
```
> 直接 `file://` 打开会有跨域问题，请使用本地静态服务器。

---

## ➕ 如何新增一个应用（卡片）

> 最常见的是**直接上线**（改 `handlers.js` + `apps.json`）。  
> 若想走“每日自动上新”，把卡片放进 `backlog.json`，并将处理器名加入白名单。

### 步骤 1：在 `handlers.js` 新增处理器

每个卡片对应一个函数，约定签名如下：

```js
// 返回字符串数组；入参为 (文本输入, 预设值, 上下文)
function myAwesomeToolV1(text = '', preset = '默认', ctx = {}) {
  // ...你的处理逻辑...
  return ['结果示例 1', '结果示例 2'];
}

export const AppHandlers = {
  // ...已有处理器...
  myAwesomeToolV1,  // 别忘了挂到导出对象
};
```

### 步骤 2：在 `apps.json` 追加卡片配置（立即可见）

```json
{
  "slug": "my-awesome-tool",
  "name": "我的新工具",
  "category": "demo",
  "description": "一句话说明这个工具做什么",
  "inputs": ["text"],
  "presets": ["默认", "方案A", "方案B"],
  "handler": "myAwesomeToolV1",
  "placeholder": "在此粘贴或输入内容（支持长文本）"
}
```

字段说明：
- `slug`：唯一标识，用于直达 `/#my-awesome-tool`
- `handler`：必须与 `handlers.js` 中函数名**完全一致**
- `inputs`：目前支持 `["text"]`（已取消字数上限，支持长文本）
- `presets`：可为空；会渲染为弹窗内的快捷按钮

### （可选）步骤 3：走“每日自动上新”

1. 把同样的卡片对象放到 `backlog.json` 的 `"queue"` 数组里。  
2. 在 `.github/scripts/daily_append.mjs` 的 **`allowed` 白名单**加上你的处理器名：
   ```js
   const allowed = new Set([
     // ...已有...
     'myAwesomeToolV1'
   ]);
   ```
3. 运行 **Actions → Daily Append Apps → Run workflow**（或等待定时任务）。脚本会自动把 3–5 个候补追加到 `apps.json` 并 push，随后触发 Pages 部署。

---

## 🧰 示例卡片：中文格式优化器

**用途**：把用户粘贴的大段文本（含英文/半角标点）转为**中文排版风格**：统一标点、智能中英空格、去掉“中文标点后多余空格”；保护 URL/邮箱/Markdown 链接/代码块；幂等可复跑。

- 处理器：`zhFormatterV1`（见 `handlers.js`）
- 卡片配置（位于 `apps.json`）：

```json
{
  "slug": "zh-formatter",
  "name": "中文格式优化器",
  "category": "format",
  "description": "把混合英文/半角标点/符号的文本转为中文排版风格；自动统一标点、智能空格、并保留 URL/邮箱/代码。",
  "inputs": ["text"],
  "presets": ["标准（推荐）", "仅替换标点", "严格（指北）", "保守（不加空格）"],
  "handler": "zhFormatterV1",
  "placeholder": "粘贴要优化的长文本（支持多行；保留URL/邮箱/代码/Markdown链接）"
}
```
直达链接：`/#zh-formatter`

---

## ⚙️ 自动化与发布

- **发布**：`pages.yml` 对 `main` 的 `push` 自动构建并部署 GitHub Pages。  
- **每日上新**：`daily_append.yml` 支持定时与手动触发；`daily_append.mjs` 会：
  - 从 `backlog.json.queue` 取 3–5 条（去重 & 白名单 `allowed`）
  - 追加到 `apps.json`
  - 提交并推送到 `main`（触发 Pages 构建）

**必要设置**：仓库 → **Settings → Actions → General → Workflow permissions** 设为 **Read and write**。  
> 不建议用 API 手动触发 `pages.yml`，直接依赖 `on: push` 更稳。

---

## 🧯 常见问题（FAQ）

- **Console 报 `Unexpected token '<'`**  
  `handlers.js` 或 `apps.json` 被 HTML（如 404 页）替代。检查线上：  
  - `…/handlers.js` 应以 `export const AppHandlers` 开头（纯 JS）  
  - `…/apps.json` 应以 `{` 开头（纯 JSON），`content-type: application/json`

- **`Daily Append` 403：`Resource not accessible by integration`**  
  不要用 `github-script` 调用 dispatch API；直接依赖 `on: push` 即可。

- **首页空白或“今日新增：0”**  
  打开 `…/apps.json` 看 `apps` 是否为空；确认 JSON 无尾逗号/注释。

- **直达链接无效/函数重复声明**  
  确保 `index.html` 的 `openByHash` 只注册一次（已实现为全局单例）。

- **文本框仍有限制/提示文案不对**  
  已取消字数上限。如看到“≤200 字符”，请更新 `index.html` 中的提示文案为“支持长文本”。

---

## 📝 贡献指南

- 处理器保持**纯前端**、**幂等**、**无外部网络请求**。  
- 输出请返回**字符串数组**（每条结果一块卡片）。  
- 注意**中文与中英混排**（空格、标点、引号等）的友好性。  
- 提交前本地起一个静态服务器做一次手动验证。

---

## 📄 许可证

本仓库用于教学与演示，可按团队规范二次开发与复用。对外发布或商用前请与团队负责人沟通确认。
