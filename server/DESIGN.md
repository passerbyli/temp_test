# LLM Wiki Web — 服务端设计文档

> 本文档描述 `server/` 下 Agentic RAG 知识库问答服务的完整设计，供 AI 模型或开发者据此重新实现。

---

## 1. 项目概述

### 1.1 定位

基于 Obsidian 知识库（`wiki/` + `scheme/`），搭建 Web 问答服务。团队成员通过浏览器提问，大模型通过 **Function Calling** 自主搜索知识库，经过多轮「搜索 → 阅读 → 再搜索」后给出完整答案。发现知识缺口时，主动建议创建草稿补全。

### 1.2 核心理念

```
传统 RAG:  用户问题 → 一次检索 → 一次生成（质量差）
本方案:    用户问题 → 模型分析 → 调工具搜索 → 读文件 → 发现不够 → 再搜 → 综合回答（质量好）
```

### 1.3 设计边界

| Server 做 | Server 不做 |
|-----------|------------|
| 读取 wiki/、scheme/、raw/ | 不修改 wiki/ |
| 写入 server/drafts/ 暂存区 | 不重建索引 |
| 搜索、查询、回答 | 不合并草稿到 wiki/ |
| 列出暂存区草稿 | — |

草稿的审核、编辑、合并由用户在 **Obsidian + Claude Code** 中手动处理。

### 1.4 技术选型

| 项目 | 选择 | 原因 |
|------|------|------|
| 语言 | Node.js (CommonJS) | 无需构建 |
| Web 框架 | Express 4.x | 成熟稳定 |
| 大模型 SDK | `openai` npm 包 | 兼容所有 OpenAI 兼容接口 |
| Frontmatter | `gray-matter` | 解析 YAML 元数据 |
| 前端 | 纯 HTML + CSS + Vanilla JS | 无框架依赖 |
| SSE | 原生 HTTP Response | 无额外依赖 |

---

## 2. 目录结构

```
server/
├── package.json            # 依赖声明
├── .env.example            # 环境变量模板（含各大厂配置示例）
├── .env                    # 实际环境变量（不入库）
├── .gitignore              # 忽略 node_modules/、.env、drafts/
├── config.js               # 配置管理
├── rate-limit.js           # 并发控制（限流 + 并发锁 + 超时）
├── app.js                  # Express 入口
│
├── drafts/                 # 草稿暂存区（write_wiki_file 写入此目录）
│   └── US/.../*.md         # 按 wiki/ 目录结构镜像存放
│
├── knowledge/              # 知识库读写层
│   ├── frontmatter.js      # YAML frontmatter 解析
│   ├── reader.js           # 文件读写 + scheme 缓存 + 草稿管理
│   └── search.js           # 全文搜索 + US/API 索引筛选
│
├── agent/                  # Agent 引擎
│   ├── tools.js            # 8 个工具的 schema + 执行器
│   ├── loop.js             # Agentic 循环（含超时控制）
│   └── prompts.js          # System Prompt
│
├── routes/                 # HTTP 路由
│   ├── chat.js             # POST /api/chat（SSE + 限流 + 并发控制）
│   ├── knowledge.js        # GET /api/us, /api/modules, /api/stats, /api/system
│   └── search.js           # GET /api/search
│
└── public/                 # 前端静态文件
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 3. 配置层

### 3.1 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `OPENAI_API_KEY` | 是 | — | 大模型 API 密钥 |
| `BASE_URL` | 否 | `http://localhost:11434/v1` | API 地址 |
| `MODEL` | 否 | `mimo` | 模型名称 |
| `PORT` | 否 | `3000` | 服务端口 |
| `MAX_ITERATIONS` | 否 | `10` | Agent 最大工具调用轮次 |
| `MAX_TOKENS` | 否 | `4096` | 单次回答最大 token |
| `RATE_LIMIT_PER_IP` | 否 | `10` | 每 IP 每分钟请求数 |
| `MAX_CONCURRENCY` | 否 | `5` | 最大并发 Agent 任务 |
| `AGENT_TIMEOUT_SEC` | 否 | `120` | 单次任务超时（秒） |
| `MAX_QUEUE_SIZE` | 否 | `20` | 并发排队上限 |

### 3.2 config.js 导出

```javascript
{
  port, apiKey, baseUrl, model,
  vaultRoot,    // vault 根目录（上级）
  wikiRoot,     // vaultRoot/wiki
  rawRoot,      // vaultRoot/raw
  draftsRoot,   // server/drafts（本目录下）
  schemeRoot,   // vaultRoot/scheme
  maxAgentIterations, maxTokens,
}
```

---

## 4. 知识库读写层 — `knowledge/`

### 4.1 frontmatter.js

- `parseFrontmatter(content) → { meta, body }` — 解析 YAML frontmatter

### 4.2 reader.js

#### 只读函数

| 函数 | 说明 |
|------|------|
| `loadSchemeIndexes()` | 启动时预加载 scheme/*.json 到内存 |
| `readSchemeIndex(name)` | 读取 scheme 索引（缓存优先） |
| `readWikiFile(relativePath)` | 读取 wiki/ 下的 Markdown，返回 `{ meta, body, path, raw }` |
| `listWikiFiles(category)` | 递归列出 wiki/{category}/ 下所有 .md |
| `listWikiCategories()` | 列出 wiki/ 下所有子目录名 |
| `reloadSchemeCache()` | 清空并重新加载 scheme 缓存 |
| `listRawFiles(category)` | 列出 raw/{category}/ 下的文件 |
| `readRawFile(relativePath)` | 读取 raw/ 下的文本文件；二进制文件只返回元信息 |

#### 草稿函数

| 函数 | 说明 |
|------|------|
| `writeWikiFile(relativePath, content)` | 写入 `server/drafts/{relativePath}`，自动创建目录 |
| `listDrafts()` | 递归列出 server/drafts/ 下所有文件，返回 `{ path, size, mtime }` |

**安全约束：**
- `writeWikiFile` 通过 `path.resolve(draftsRoot, relativePath)` 校验路径，防止 `..` 逃逸
- `readRawFile` 同样校验路径在 rawRoot 内

### 4.3 search.js

| 函数 | 说明 |
|------|------|
| `searchWikiFiles(keyword, category?)` | 逐行扫描 wiki/ 全文搜索，返回 `{ path, title, snippets, matchCount }` |
| `searchUSIndex(filters)` | 从 scheme/us-index.json 按 id/module/status/keyword 筛选 |
| `searchAPIIndex(filters)` | 从 scheme/api-index.json 按 id/module/method/keyword 筛选 |

---

## 5. 并发控制 — `rate-limit.js`

零外部依赖，纯内存实现。

### 三层防护

| 层 | 机制 | 默认值 |
|----|------|--------|
| 限流器 | 滑动窗口，每 IP 每分钟 | 10 次 |
| 并发锁 | 全局信号量 + 排队 | 5 个 |
| 超时控制 | Promise.race | 120 秒 |

### Express 中间件

```javascript
router.post('/', rateLimitMiddleware, concurrencyControl, handler);
```

- `rateLimitMiddleware` — 检查限流，返回 `X-RateLimit-Limit` / `X-RateLimit-Remaining` 头
- `concurrencyControl` — 获取并发锁，请求结束自动释放（防双重触发）

---

## 6. Agent 引擎 — `agent/`

### 6.1 tools.js — 8 个工具

| # | 工具名 | 类型 | 用途 |
|---|--------|------|------|
| 1 | `search_wiki` | 只读 | 全文搜索 wiki 文章 |
| 2 | `read_file` | 只读 | 读取文件完整内容 |
| 3 | `list_modules` | 只读 | 列出模块和文件数 |
| 4 | `query_us_index` | 只读 | 查询 US 索引 |
| 5 | `query_api_index` | 只读 | 查询 API 索引 |
| 6 | `list_raw_files` | 只读 | 列出 raw/ 原始数据 |
| 7 | `write_wiki_file` | **写入** | 写草稿到 `server/drafts/` |
| 8 | `list_drafts` | 只读 | 查看待处理草稿 |

#### write_wiki_file 详情

```
参数: { path: "US/用户中心/US-003.md", content: "---\nid: US-003\n..." }
写入: server/drafts/US/用户中心/US-003.md
返回: { path, action: "created"|"updated", draftsPath }
```

路径校验：`path.resolve(draftsRoot, path)` 必须在 `draftsRoot` 内。

### 6.2 loop.js — Agentic 循环

```
Promise.race([ 循环主体, 超时定时器 ])

循环主体:
  messages = [system_prompt, ...history, user_message]
  while (iterations < maxAgentIterations):
    response = client.chat.completions.create({ messages, tools })
    if 无 tool_calls → return 最终文本
    否则:
      逐个执行 tool_calls → 结果加入 messages → 继续循环
```

- 超时：`AGENT_TIMEOUT_SEC`（默认 120 秒）
- 错误：不崩溃，错误信息追加到回答中

### 6.3 prompts.js — System Prompt 要点

1. 角色：知识库助手 + 主动补全
2. 工具列表：8 个工具
3. 工作原则：先搜再答、多步探索、交叉验证、精确引用、诚实告知
4. **主动补全**：发现缺失文档 → 读取模板 → 填充 → `write_wiki_file` 写入暂存区
5. 回答格式：Markdown，引用文件路径

---

## 7. HTTP 路由 — `routes/`

### 7.1 POST /api/chat — SSE 对话

请求：`{ message, history? }`
响应：`text/event-stream`

```
event: thinking     → { tool, args }
event: tool_result  → { tool, result }
event: message      → { text }
event: done         → { iterations, inputTokens, outputTokens }
```

中间件链：`rateLimitMiddleware → concurrencyControl → handler`

### 7.2 GET /api/us — US 查询

参数：`id`, `module`, `status`, `keyword`（均可选）
返回：`{ data: [...], total }`

### 7.3 GET /api/modules — 模块列表

返回：`{ data: [{ name, fileCount, files }], total }`

### 7.4 GET /api/stats — 知识库统计

返回：`{ wikiFiles, categories, usCount, apiCount, schemeIndexes }`

### 7.5 GET /api/search — 全文搜索

参数：`keyword`（必填）, `category`（可选）
返回：`{ data: [{ path, title, snippets, matchCount }], total, keyword }`

### 7.6 GET /api/system — 系统状态

返回：`{ uptime, memoryMB, activeTasks, queueLength, ... }`

---

## 8. 前端 — `public/`

纯静态单页应用，marked.js CDN 渲染 Markdown。

### 布局

```
┌──────────────┬─────────────────────────────────┐
│   Sidebar    │  Topbar                          │
│  [+ 新对话]  ├─────────────────────────────────┤
│  快捷入口    │  Chat Container                  │
│  - 模块列表  │    Welcome / Messages            │
│  - 搜索 US  │                                  │
│  - 搜索 API ├─────────────────────────────────┤
│  - 统计     │  Input (textarea + send)          │
│  对话历史    │                                  │
└──────────────┴─────────────────────────────────┘
```

### 交互

1. 用户输入 → POST `/api/chat` → 读 SSE 流
2. `thinking` 更新指示器 → `tool_result` 插入折叠卡片 → `message` 累积文本 → `done` 渲染 Markdown
3. 支持深色/浅色主题（CSS 变量 + prefers-color-scheme）

---

## 9. 数据流

```
浏览器                    Express Server                    存储
  │                           │                              │
  │  POST /api/chat           │                              │
  │ ─────────────────────────>│                              │
  │                           │  限流 → 并发锁                │
  │                           │  agentLoop()                 │
  │                           │    ├─ chat.completions.create │
  │ SSE: thinking             │    │   (大模型 API)            │
  │ <─────────────────────────│    │                          │
  │                           │    ├─ executeTool()           │
  │ SSE: tool_result          │    │   searchWikiFiles() ─────│──> wiki/**/*.md
  │ <─────────────────────────│    │   readWikiFile() ─────────│──> wiki/*.md
  │                           │    │   searchUSIndex() ────────│──> scheme/*.json
  │                           │    │   writeWikiFile() ────────│──> server/drafts/
  │                           │    │                          │
  │ SSE: message              │    ├─ 综合回答                 │
  │ <─────────────────────────│    │                          │
  │ SSE: done                 │  释放并发锁                    │
  │ <─────────────────────────│                              │
```

---

## 10. 关键设计决策

### 10.1 为什么用 OpenAI SDK？

一个 `BASE_URL` + `MODEL` 切换任意大厂。所有主流国产模型都支持 OpenAI 兼容接口。

### 10.2 为什么用 SSE？

单向推送，完美匹配「服务端思考 → 推送结果」。实现简单，HTTP 原生支持。

### 10.3 为什么 write_wiki_file 写暂存区而不是 wiki/？

避免与 Obsidian 同步、Git、其他编辑器产生冲突。用户在 Obsidian + CC 中手动审核后合并。

### 10.4 为什么 read_file 限制 8000 字符？

防止单次读取大文件导致 token 爆炸。模型可在后续轮次用更精确的搜索缩小范围。

### 10.5 为什么 search 是逐行扫描？

wiki 文件数量级在百篇以内，逐行扫描足够快。不需要额外维护索引。

### 10.6 为什么用内存限流？

5-10 人小团队，单实例足够。零外部依赖，`npm start` 即可运行。

---

## 11. 依赖清单

```json
{
  "express": "^4.21.2",
  "openai": "^4.77.0",
  "gray-matter": "^4.0.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7"
}
```

前端：`marked.js`（CDN）。

---

## 12. 启动流程

```
1. dotenv.config()             ← 加载 .env
2. require('./config')          ← 解析配置
3. require 路由模块             ← 挂载路由
4. 挂载中间件（cors, json, static）
5. loadSchemeIndexes()          ← 预加载 scheme/
6. app.listen(port)             ← 启动服务
7. 输出启动信息
```

---

## 13. 文件清单

| # | 文件 | 职责 | 行数 |
|---|------|------|------|
| 1 | `package.json` | 依赖 | ~20 |
| 2 | `.env.example` | 环境变量模板 | ~65 |
| 3 | `config.js` | 配置 | ~15 |
| 4 | `rate-limit.js` | 并发控制 | ~120 |
| 5 | `app.js` | Express 入口 | ~55 |
| 6 | `knowledge/frontmatter.js` | YAML 解析 | ~30 |
| 7 | `knowledge/reader.js` | 文件读写 + 缓存 + 草稿 | ~200 |
| 8 | `knowledge/search.js` | 搜索 | ~130 |
| 9 | `agent/tools.js` | 8 个工具 | ~160 |
| 10 | `agent/loop.js` | Agentic 循环 | ~150 |
| 11 | `agent/prompts.js` | System Prompt | ~45 |
| 12 | `routes/chat.js` | SSE 对话 | ~55 |
| 13 | `routes/knowledge.js` | 知识 API | ~80 |
| 14 | `routes/search.js` | 搜索 API | ~20 |
| 15 | `public/index.html` | 页面 | ~90 |
| 16 | `public/style.css` | 样式 | ~320 |
| 17 | `public/app.js` | 前端逻辑 | ~210 |
| **合计** | **17 个文件** | | **~1765** |

---

## 14. 验证方法

| 测试问题 | 预期工具调用 |
|----------|-------------|
| "知识库有哪些模块？" | `list_modules` |
| "US-001 的需求是什么？" | `query_us_index` → `read_file` |
| "用户登录相关的 API 有哪些？" | `search_wiki` → `query_api_index` |
| "US-003 的验收标准？"（不存在） | `query_us_index` → 建议创建草稿 |
| "帮我创建 US-003" | `read_file`(模板) → `write_wiki_file` → `list_drafts` |
