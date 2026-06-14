# LLM Wiki Web — Agentic RAG 知识库问答服务

## 目标

在现有知识库（wiki/ + scheme/）之上，搭建一套 Express + Claude API 的 Agentic RAG 问答网站，团队成员通过局域网访问，获得与 Claude/OpenCode 接近的多步推理问答体验。

## 架构总览

```
浏览器（团队成员）
    ↓ HTTP / SSE（流式输出）
Express Server (:3000)
    ├── POST /api/chat          ← Agentic 对话（核心）
    ├── GET  /api/search        ← 直接搜索
    ├── GET  /api/us            ← US 列表/详情
    ├── GET  /api/modules       ← 模块列表
    ├── GET  /api/stats         ← 知识库统计
    └── 静态文件（Chat UI）
         │
    Agent Engine（核心）
    ├── Claude API (tool use)   ← 多轮工具调用循环
    ├── 5 个工具
    │   ├── search_wiki         ← 全文搜索 wiki 文件
    │   ├── read_file           ← 读取指定 wiki/scheme 文件
    │   ├── list_modules        ← 列出所有模块及 US/API 数量
    │   ├── query_us_index      ← 查询/筛选 US 索引
    │   └── query_api_index     ← 查询/筛选 API 索引
    └── Knowledge Reader
        ├── scheme/*.json       ← 结构化索引（精确查询）
        ├── wiki/**/*.md        ← Markdown 知识文章（全文搜索）
        └── Frontmatter Parser  ← YAML 元数据解析
```

## 为什么这样设计

### 核心理念：让 Claude 自己决定怎么查

传统 RAG：`用户问题 → 一次检索 → 一次生成` → 质量差

Agentic RAG：`用户问题 → Claude 分析 → 搜索 → 读文件 → 发现不够 → 再搜 → 综合回答` → 质量好

```
┌──────────────────────────────────────────────────┐
│  用户: "US-003 的验收标准是什么？关联的 API 怎么调用？"  │
│                                                    │
│  第1轮: Claude 调用 query_us_index("US-003")        │
│         → 获得 US-003 基本信息和 related_apis        │
│  第2轮: Claude 调用 read_file("wiki/US/.../US-003.md") │
│         → 获得完整验收标准                             │
│  第3轮: Claude 调用 read_file("wiki/API/.../API-005.md") │
│         → 获得关联 API 详情                            │
│  第4轮: Claude 综合所有信息，生成完整答案               │
└──────────────────────────────────────────────────┘
```

## 文件结构

```
llm_wiki/
├── server/                         ← 新增：Web 服务
│   ├── package.json
│   ├── app.js                      ← Express 入口，启动服务器
│   ├── config.js                   ← 配置（端口、API Key、模型等）
│   │
│   ├── routes/
│   │   ├── chat.js                 ← POST /api/chat（SSE 流式 + Agentic）
│   │   ├── knowledge.js            ← GET /api/us, /api/modules, /api/stats
│   │   └── search.js               ← GET /api/search（直接搜索，不经过 Agent）
│   │
│   ├── agent/
│   │   ├── loop.js                 ← Agentic 循环（核心！）
│   │   ├── tools.js                ← 5 个工具的定义（Claude tool schema）
│   │   └── prompts.js              ← System prompt + 工具使用指引
│   │
│   ├── knowledge/
│   │   ├── reader.js               ← 读取 scheme/ JSON + wiki/ Markdown
│   │   ├── frontmatter.js          ← 解析 YAML frontmatter
│   │   └── search.js               ← 关键词搜索（倒排索引或扫描）
│   │
│   ├── public/                     ← 前端（纯静态，无框架）
│   │   ├── index.html              ← 单页 Chat UI
│   │   ├── style.css               ← 样式
│   │   └── app.js                  ← 前端交互逻辑
│   │
│   └── .env                        ← API Key（不入库）
│
├── wiki/                           ← 已有
├── scheme/                         ← 已有
└── ...
```

## 实现步骤

### Step 1: 项目初始化

**操作**：创建 `server/package.json` + 安装依赖

**依赖清单**：
| 包名 | 用途 |
|------|------|
| `express` | Web 框架 |
| `@anthropic-ai/sdk` | Claude API SDK（原生支持 tool use） |
| `gray-matter` | YAML frontmatter 解析 |
| `dotenv` | 环境变量管理 |
| `cors` | 跨域支持 |

前端不使用任何框架，纯 HTML + CSS + Vanilla JS。

### Step 2: 知识库读取层 — `knowledge/`

#### `knowledge/frontmatter.js`
- 封装 `gray-matter`，解析 Markdown 的 YAML frontmatter
- 返回 `{ meta: {...}, body: "..." }`

#### `knowledge/reader.js`
- `readSchemeIndex(name)` → 读取 `scheme/{name}.json`
- `readWikiFile(relativePath)` → 读取 `wiki/` 下的 Markdown 文件并解析 frontmatter
- `listWikiFiles(category)` → 列出 `wiki/{category}/` 下所有文件
- 启动时缓存 scheme/ 索引到内存（监听文件变化可选）

#### `knowledge/search.js`
- `searchWikiFiles(keyword)` → 全文搜索 `wiki/` 下所有 Markdown
  - 遍历所有 .md 文件，匹配关键词（不区分大小写）
  - 返回匹配的文件列表 + 匹配行的上下文片段（snippet）
  - 按匹配度排序（匹配次数）
- `searchUSIndex(filters)` → 从 `us-index.json` 按 id/title/module/status 筛选
- `searchAPIIndex(filters)` → 从 `api-index.json` 按 id/title/module/method 筛选

### Step 3: Agent 引擎 — `agent/`

#### `agent/tools.js` — 5 个工具定义

```javascript
// Claude API tool use schema
const tools = [
  {
    name: "search_wiki",
    description: "在 wiki 知识库中搜索关键词。返回匹配的文件列表和内容片段。适合用于发现相关知识文章。",
    input_schema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "搜索关键词" },
        category: { type: "string", enum: ["US", "API", "技术知识", "功能地图", "产品演进", "架构决策"], description: "限定搜索范围（可选）" }
      },
      required: ["keyword"]
    }
  },
  {
    name: "read_file",
    description: "读取指定文件的完整内容。传入文件的相对路径（如 wiki/US/用户中心/US-001-登录.md）。",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件相对路径" }
      },
      required: ["path"]
    }
  },
  {
    name: "list_modules",
    description: "列出所有模块及其 US 和 API 数量。适合了解知识库的整体结构。",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "query_us_index",
    description: "查询 US（用户故事）索引。支持按 id、标题、模块、状态等筛选。",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "US 编号，如 US-001" },
        module: { type: "string", description: "模块名" },
        status: { type: "string", description: "状态" },
        keyword: { type: "string", description: "标题关键词" }
      }
    }
  },
  {
    name: "query_api_index",
    description: "查询 API 索引。支持按 id、标题、模块、HTTP 方法等筛选。",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "API 编号，如 API-001" },
        module: { type: "string", description: "模块名" },
        method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], description: "HTTP 方法" },
        keyword: { type: "string", description: "路径或标题关键词" }
      }
    }
  }
];
```

#### `agent/loop.js` — Agentic 循环（核心）

工作流程：
```
1. 收到用户消息
2. 构建 messages = [system_prompt, ...历史消息, user_message]
3. while (未达到最大轮次 10):
     调用 claude.messages.create({ messages, tools })
     如果 stop_reason === "end_turn" → 提取最终文本，返回
     如果 stop_reason === "tool_use" →
       执行所有工具调用 →
       将结果作为 tool_result 加入 messages →
       继续循环
4. 返回最终文本（可能被截断）
```

关键设计：
- **最大 10 轮工具调用**，防止无限循环
- **完整对话历史**保持上下文连贯
- **SSE 流式输出**：每轮工具调用和中间推理都推送给前端展示
- **错误容忍**：工具执行失败时返回错误描述而非崩溃

#### `agent/prompts.js` — System Prompt

```
你是 LLM Wiki 知识库助手。你的职责是帮助团队成员查询和理解项目知识。

## 你可以使用以下工具访问知识库

- search_wiki: 搜索知识文章
- read_file: 读取文件完整内容
- list_modules: 查看模块结构
- query_us_index: 查询用户故事索引
- query_api_index: 查询 API 索引

## 工作原则

1. **先搜再答**：不要凭空回答，先用工具查找相关信息
2. **多步探索**：一个问题可能需要多次搜索和阅读
3. **交叉验证**：US 和 API 往往关联，记得查看关联项
4. **精确引用**：回答时引用具体的 US 编号、API 路径等
5. **诚实告知**：如果知识库中没有相关信息，直接说明

## 回答格式

- 使用 Markdown 格式
- 引用具体文件时用链接格式
- 涉及 US 时包含验收标准
- 涉及 API 时包含路径和参数
```

### Step 4: API 路由 — `routes/`

#### `routes/chat.js` — 核心对话接口

```
POST /api/chat
Body: { message: string, history?: Array<{role, content}> }
Response: SSE stream (text/event-stream)
```

SSE 事件格式：
```
event: thinking
data: {"tool": "query_us_index", "args": {"id": "US-003"}}

event: tool_result
data: {"tool": "query_us_index", "result": {...}}

event: message
data: {"text": "根据知识库查询..."}

event: done
data: {"iterations": 3, "total_tokens": 2450}
```

前端可实时展示："🤔 正在搜索 US-003..." → "📖 正在读取关联 API..." → 最终答案

#### `routes/knowledge.js` — 知识库浏览

```
GET /api/us?id=US-001          → 单个 US 详情
GET /api/us?module=用户中心     → 模块下所有 US
GET /api/modules               → 模块列表 + 统计
GET /api/stats                 → 知识库整体统计
```

#### `routes/search.js` — 直接搜索

```
GET /api/search?keyword=登录    → 全文搜索结果
```

### Step 5: 前端 Chat UI — `public/`

单页应用，纯 Vanilla JS，无任何框架。

功能：
- **对话界面**：左侧历史列表 + 右侧对话区
- **流式输出**：实时显示 Claude 的思考过程（工具调用动画）
- **Markdown 渲染**：使用 marked.js 渲染回答中的 Markdown
- **工具调用可视化**：折叠展示每步工具调用和结果
- **快捷入口**：模块列表、US 搜索、API 搜索

设计风格：
- 简洁清爽，参考 ChatGPT/Claude 的对话界面
- 响应式布局，支持手机和桌面
- 深色/浅色主题（CSS 变量切换）

### Step 6: 启动与配置 — `app.js` + `config.js`

#### `config.js`
```javascript
module.exports = {
  port: process.env.PORT || 3000,
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.MODEL || 'claude-sonnet-4-20250514',
  vaultRoot: path.resolve(__dirname, '..'),
  maxAgentIterations: 10,
  maxTokens: 4096,
};
```

#### `.env`
```
ANTHROPIC_API_KEY=sk-ant-xxx
PORT=3000
MODEL=claude-sonnet-4-20250514
```

#### `app.js`
- 挂载 Express 中间件
- 挂载路由
- 提供 `public/` 静态文件
- 知识库索引启动时预加载

## 启动方式

```bash
cd server
cp .env.example .env   # 填入 API Key
npm install
npm start              # http://localhost:3000
```

团队成员浏览器打开 `http://192.168.x.x:3000` 即可使用。

## 关键技术点

### 为什么效果好？

| 你的旧方案 | 新方案（Agentic RAG） |
|------------|----------------------|
| 1次检索 + 1次生成 | 最多10轮检索 + 1次综合生成 |
| 固定检索策略 | Claude 动态决定搜什么、读什么 |
| 信息不全就瞎答 | 信息不够会继续搜索 |
| 无法跨文件关联 | 可以读 US → 追踪关联 API → 读 API |
| 不知道知识库有什么 | 可以先 list_modules 了解全貌 |

### 与 build-context.sh 的关系

`build-context.sh` 是"静态预构建上下文"，适合给 Claude Code 等工具一次性喂入。

本方案是"动态按需构建上下文"，让 Claude API 自己决定需要什么信息——更灵活、更智能、token 消耗更可控。

### 成本估算

- Claude Sonnet: 输入 $3/M tokens, 输出 $15/M tokens
- 一次典型问答（3-5轮工具调用）：约 5000-15000 input tokens + 1000-2000 output tokens
- 约 $0.01-0.05/次问答
- 10人团队每天10次问答 = ~$0.5-5/天

### 安全注意

- `.env` 文件不入库（加 .gitignore）
- 局域网访问，无需 HTTPS
- API Key 只在服务端使用，不暴露给前端

## 实现文件清单

| # | 文件 | 说明 | 行数估算 |
|---|------|------|---------|
| 1 | `server/package.json` | 项目配置和依赖 | ~20 |
| 2 | `server/.env.example` | 环境变量模板 | ~5 |
| 3 | `server/config.js` | 配置管理 | ~20 |
| 4 | `server/app.js` | Express 入口 | ~40 |
| 5 | `server/knowledge/frontmatter.js` | Frontmatter 解析 | ~25 |
| 6 | `server/knowledge/reader.js` | 文件读取 + 缓存 | ~80 |
| 7 | `server/knowledge/search.js` | 搜索引擎 | ~100 |
| 8 | `server/agent/tools.js` | 工具定义 | ~120 |
| 9 | `server/agent/loop.js` | Agentic 循环 | ~120 |
| 10 | `server/agent/prompts.js` | System Prompt | ~40 |
| 11 | `server/routes/chat.js` | 对话路由（SSE） | ~80 |
| 12 | `server/routes/knowledge.js` | 知识库浏览路由 | ~60 |
| 13 | `server/routes/search.js` | 搜索路由 | ~30 |
| 14 | `server/public/index.html` | Chat UI 页面 | ~150 |
| 15 | `server/public/style.css` | 样式 | ~200 |
| 16 | `server/public/app.js` | 前端交互逻辑 | ~200 |
| **合计** | **16 个文件** | | **~1290** |

## 验证方式

1. `cd server && npm install && npm start`
2. 浏览器打开 `http://localhost:3000`
3. 发送测试问题：
   - "知识库有哪些模块？" → 验证 list_modules 工具
   - "US-001 的需求是什么？" → 验证 query_us + read_file
   - "用户登录相关的 API 有哪些？" → 验证 search_wiki + query_api
4. 观察工具调用过程是否正确显示在界面上
