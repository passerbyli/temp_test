# ui-guardian Design Document

**版本**: 0.1.0
**日期**: 2026-06-05
**状态**: 待审批

---

## 1. 背景

前端应用通常部署在多套环境（staging / production）、多版本（v1 / v2）、甚至多框架（Vue / React）之间。当环境间出现 UI 不一致时，开发需要快速定位根因，测试需要批量验证并生成可追溯的报告。

当前缺乏一个轻量、框架无关、本地可运行的页面一致性验证工具。现有工具（Percy、BackstopJS）要么过于依赖 CI 平台，要么只做像素对比缺乏诊断能力。

## 2. 目标

- 提供本地 CLI 工具，支持两套前端环境之间的页面一致性验证
- 帮助**开发**快速定位差异根因（不仅知道"哪里不同"，还能看到运行时异常）
- 帮助**测试**批量执行对比并生成结构化测试报告，可直接用于提 bug
- 首版聚焦视觉差异检测，保留异常采集作为辅助诊断信息
- 框架无关，不绑定 Vue / React / Angular

## 3. 非目标（首版不做）

- 基线管理模式（截图存储为基线，后续回归对比）— 后续迭代
- DOM 结构对比 — 后续迭代
- 功能/交互验证 — 后续迭代
- CI/CD 集成 — 后续迭代
- 报告本地服务（`--serve`）— 后续迭代
- 异常自动判定（只采集，不判定是否为问题）

---

## 4. 整体架构

```
ui-guardian/
│
├── cli/                          # CLI 入口
│   ├── init.ts                   # 生成配置模板
│   └── run.ts                    # 执行对比流程
│
├── config/                       # 配置层
│   ├── global.config.json        # 全局配置（认证、默认分辨率、阈值等）
│   ├── pages.config.json         # 页面对配置（URL 对、选择器、视口等）
│   └── types.ts                  # 配置类型定义
│
├── core/                         # 核心引擎
│   ├── runner.ts                 # 执行编排层（调度认证→截图→对比→输出）
│   ├── auth.ts                   # 认证模块（自动登录，凭证内存管理）
│   ├── capture.ts                # 截图模块（整页/区域/滚动分段）
│   ├── collector.ts              # 异常采集（console error、网络失败、JS 异常）
│   ├── diff.ts                   # 对比模块（pixelmatch 像素对比 + 差异热力图）
│   ├── viewport.ts               # 多视口执行（按配置的分辨率列表逐一执行）
│   ├── processSide.ts            # 单侧处理（baseline 或 candidate）
│   └── processPage.ts            # 单页处理（baseline + candidate + diff）
│
├── report/                       # 报告生成
│   ├── generator.ts              # HTML 多文件报告生成
│   ├── template.ts               # HTML 模板引擎
│   └── json.ts                   # JSON 结构化数据输出
│
└── output/                       # 输出目录（每次运行生成独立版本）
    └── reports/YYYY-MM-DD-HHmmss/
        ├── index.html            # 报告入口（汇总页）
        ├── pages/                # 逐页详情 HTML
        ├── data.json             # 结构化数据
        ├── screenshots/
        │   ├── baseline/         # 环境 A（基准侧）截图
        │   ├── candidate/        # 环境 B（对比侧）截图
        │   └── diff/             # 差异热力图
        └── logs/
            ├── console.json      # 控制台日志
            ├── network.json      # 网络请求失败
            └── errors.json       # JS 异常
```

### 4.1 各层职责

**CLI 层**

- `init`：交互式生成 `global.config.json` 和 `pages.config.json` 模板
- `run`：读取配置，启动 runner，执行全流程，输出结果

**配置层**

| 配置文件 | 职责 |
|---------|------|
| `global.config.json` | 认证地址/账号密码、默认视口列表、差异阈值、输出目录 |
| `pages.config.json` | URL 对（baseline/candidate）、mainRegionSelector、mainRegionIndex、ignoreSelectors、视口覆盖 |

关键选择器说明：

- `mainRegionSelector`：指定主体内容区域选择器，截图和对比只在该区域内进行
- `mainRegionIndex`：当选择器匹配多个元素时，指定取第几个（0-based）
- `ignoreSelectors`：噪声元素选择器列表，截图前隐藏这些元素

**核心引擎层**

| 模块 | 职责 |
|------|------|
| `runner.ts` | 执行编排：管理 browser/context/page 生命周期，调度认证 → 遍历页面对 → 遍历视口 → 调用 processPage → 汇总结果 → 调用报告生成。不直接实现截图/对比/采集逻辑 |
| `auth.ts` | 自动登录流程，凭证存内存，注入到 Playwright 上下文 |
| `capture.ts` | 截图执行：整页截图、区域截图（基于 mainRegionSelector）、滚动分段截图 |
| `collector.ts` | 在页面导航前注册监听器（attach），截图完成后收集异常结果（collect），按页面归档 |
| `diff.ts` | 像素对比（pixelmatch），生成差异热力图，计算差异百分比 |
| `viewport.ts` | 按视口列表调度，创建指定视口的 BrowserContext |
| `processSide.ts` | 单侧处理：注册 collector（goto 前）→ 打开页面 → 注入 ignoreSelectors → 截图 → 收集异常 |
| `processPage.ts` | 单页处理：baseline + candidate + diff + 组装 PageResult |

**报告层**

- `generator.ts`：消费 RunResult，生成多文件 HTML 报告
- `json.ts`：将 RunResult 序列化为 data.json

---

## 5. 核心执行流程

### 5.1 Runner 完整执行流程

```
run 命令触发
│
├── 1. 加载配置
│   ├── 读取 global.config.json
│   ├── 读取 pages.config.json
│   └── 校验配置合法性（必填字段、URL 格式等）
│
├── 2. 初始化输出目录
│   └── output/reports/YYYY-MM-DD-HHmmss/
│       ├── screenshots/baseline/
│       ├── screenshots/candidate/
│       ├── screenshots/diff/
│       └── logs/
│
├── 3. 启动 Playwright 浏览器
│   └── 创建浏览器实例（headless）
│
├── 4. 认证阶段
│   ├── 创建认证上下文（独立 context）
│   ├── 导航到登录页
│   ├── 填写账号密码并提交
│   ├── 等待登录成功（URL 跳转或接口返回）
│   ├── 提取凭证（cookies / token）
│   └── 凭证存入内存，后续所有页面共享
│
├── 5. 主循环：遍历页面对 × 视口
│   │
│   ├── FOR EACH pagePair IN pages.config.pagePairs:
│   │   │
│   │   ├── 5.0 合并视口列表
│   │   │   └── finalViewports = pagePair.viewports ?? global.config.viewports
│   │   │
│   │   ├── FOR EACH viewport IN finalViewports:
│   │   │   │
│   │   │   ├── 5.1 创建视口上下文
│   │   │   │   └── browser.newContext({ viewport, storageState: 凭证 })
│   │   │   │
│   │   │   ├── 5.2 处理 baseline 侧（processSide）
│   │   │   │   ├── 注册 collector 监听器（goto 前）
│   │   │   │   ├── 打开 baseline URL
│   │   │   │   ├── 等待页面加载完成（networkidle）
│   │   │   │   ├── 注入 ignoreSelectors（CSS display:none）
│   │   │   │   ├── 判定截图模式
│   │   │   │   ├── 执行截图
│   │   │   │   └── 收集异常结果
│   │   │   │
│   │   │   ├── 5.3 处理 candidate 侧（同 5.2 流程）
│   │   │   │
│   │   │   ├── 5.4 像素对比（diff）
│   │   │   │   ├── 输入：baseline 截图 + candidate 截图
│   │   │   │   ├── 执行 pixelmatch 对比
│   │   │   │   └── 输出：diff 截图 + 差异百分比
│   │   │   │
│   │   │   ├── 5.5 落盘截图
│   │   │   │
│   │   │   └── 5.6 组装页面结果（PageResult）
│   │   │
│   │   │   ├── 关闭视口上下文
│   │   │
│   │   └── END FOR (viewports)
│   │
│   └── END FOR (pagePairs)
│
├── 6. 汇总运行结果（RunResult）
│
├── 7. 生成报告（HTML + JSON）
│
├── 8. 归档日志
│
├── 9. 关闭浏览器
│
└── 10. 终端输出摘要
```

### 5.2 关键选择器生效时机

| 选择器 | 生效时机 | 作用方式 |
|--------|---------|---------|
| `ignoreSelectors` | 截图前，页面加载完成后 | `page.addStyleTag` 注入 `display:none !important` |
| `mainRegionSelector` + `mainRegionIndex` | 截图时 | `locator.screenshot()` 只截取该元素区域 |

执行顺序：先注入 `ignoreSelectors` → 再按 `mainRegionSelector` 截图。两者叠加生效。

### 5.3 截图模式判定

- `mainRegionSelector` 存在 → 区域截图（mode = region）
- `scrollCapture: true` → 滚动分段截图（mode = scroll）
- 默认 → 整页截图（mode = fullPage）

页面级 `captureMode` 可覆盖全局配置，`mainRegionSelector` 存在时强制为 region。

---

## 6. 配置模型

### 6.1 global.config.json

```jsonc
{
  // ===== 认证配置 =====
  "auth": {
    "loginUrl": "https://example.com/login",   // 必填，登录页地址
    "username": "admin",                        // 必填，账号
    "password": "******",                       // 必填，密码
    "usernameSelector": "#username",            // 必填，用户名输入框选择器
    "passwordSelector": "#password",            // 必填，密码输入框选择器
    "submitSelector": "#login-btn",             // 必填，登录按钮选择器
    "successWait": {                            // 可选，登录成功判定，默认等待 networkidle
      "type": "url",                            // "url" | "selector"
      "value": "/dashboard"
    },
    "timeout": 30000                            // 可选，登录超时（ms），默认 30000
  },

  // ===== 视口配置 =====
  "viewports": [                                // 必填，至少一项
    { "width": 1920, "height": 1080, "label": "desktop" },
    { "width": 1366, "height": 768, "label": "laptop" },
    { "width": 375, "height": 812, "label": "mobile" }
  ],

  // ===== 截图配置 =====
  "capture": {
    "mode": "fullPage",                         // 可选，默认 "fullPage"。"fullPage" | "region" | "scroll"
    "scrollStep": 800,                          // 可选，滚动分段步长（px），默认 800
    "waitForNetworkIdle": true,                 // 可选，等待网络空闲，默认 true
    "pageLoadTimeout": 60000,                   // 可选，页面加载超时（ms），默认 60000
    "screenshotDelay": 0                        // 可选，加载后延迟截图（ms），默认 0
  },

  // ===== 对比配置 =====
  "diff": {
    "threshold": 0.01,                          // 可选，差异阈值（0-1），默认 0.01（1%）
    "includeAA": false                          // 可选，是否包含 anti-aliasing，默认 false
  },

  // ===== 全局噪声过滤 =====
  "ignoreSelectors": [                          // 可选，全局噪声元素选择器，默认 []
    ".cookie-banner",
    ".timestamp",
    ".ad-container"
  ],

  // ===== 输出配置 =====
  "outputDir": "output/reports"                 // 可选，输出根目录，默认 "output/reports"
}
```

### 6.2 pages.config.json

```jsonc
{
  "pagePairs": [
    {
      // ===== 基本信息 =====
      "name": "首页",                            // 必填，页面名称（用于报告展示和文件命名）
      "id": "home",                              // 可选，唯一标识，默认自动生成（name 的 kebab-case）

      // ===== URL 对 =====
      "baseline": {
        "url": "https://staging.example.com/"    // 必填
      },
      "candidate": {
        "url": "https://prod.example.com/"       // 必填
      },

      // ===== 主体区域（可选）=====
      "mainRegionSelector": ".main-content",     // 可选，指定主体区域选择器
      "mainRegionIndex": 0,                      // 可选，匹配多个时取第几个，默认 0

      // ===== 噪声过滤（可选，追加到全局 ignoreSelectors）=====
      "ignoreSelectors": [".page-specific-ad"],

      // ===== 视口覆盖（可选，覆盖全局 viewports）=====
      "viewports": [
        { "width": 1920, "height": 1080, "label": "desktop" }
      ],

      // ===== 截图模式覆盖（可选，覆盖全局 capture.mode）=====
      "captureMode": "region",                   // "fullPage" | "region" | "scroll"
      "scrollCapture": false,                    // 可选，是否启用滚动分段，默认 false

      // ===== 阈值覆盖（可选，覆盖全局 diff.threshold）=====
      "threshold": 0.02
    }
  ]
}
```

### 6.3 字段必填/可选汇总

**global.config.json**

| 字段路径 | 必填 | 默认值 |
|---------|------|--------|
| `auth.loginUrl` | 是 | — |
| `auth.username` | 是 | — |
| `auth.password` | 是 | — |
| `auth.usernameSelector` | 是 | — |
| `auth.passwordSelector` | 是 | — |
| `auth.submitSelector` | 是 | — |
| `auth.successWait` | 否 | `null` |
| `auth.successWait.type` | 条件 | — |
| `auth.successWait.value` | 条件 | — |
| `auth.timeout` | 否 | `30000` |
| `viewports` | 是 | — |
| `viewports[].width` | 是 | — |
| `viewports[].height` | 是 | — |
| `viewports[].label` | 否 | `"WxH"` |
| `capture.mode` | 否 | `"fullPage"` |
| `capture.scrollStep` | 否 | `800` |
| `capture.waitForNetworkIdle` | 否 | `true` |
| `capture.pageLoadTimeout` | 否 | `60000` |
| `capture.screenshotDelay` | 否 | `0` |
| `diff.threshold` | 否 | `0.01` |
| `diff.includeAA` | 否 | `false` |
| `ignoreSelectors` | 否 | `[]` |
| `outputDir` | 否 | `"output/reports"` |

**pages.config.json**

| 字段路径 | 必填 | 默认值 |
|---------|------|--------|
| `pagePairs[].name` | 是 | — |
| `pagePairs[].id` | 否 | `name` 的 kebab-case |
| `pagePairs[].baseline.url` | 是 | — |
| `pagePairs[].candidate.url` | 是 | — |
| `pagePairs[].mainRegionSelector` | 否 | `null` |
| `pagePairs[].mainRegionIndex` | 否 | `0` |
| `pagePairs[].ignoreSelectors` | 否 | `[]` |
| `pagePairs[].viewports` | 否 | 使用全局 viewports |
| `pagePairs[].captureMode` | 否 | 使用全局 `capture.mode` |
| `pagePairs[].scrollCapture` | 否 | `false` |
| `pagePairs[].threshold` | 否 | 使用全局 `diff.threshold` |

### 6.4 配置合并规则

```
最终生效配置 = global.config 合并 pagePair 配置

- ignoreSelectors：全局 + 页面级（追加，不覆盖）
- viewports：页面级有则覆盖全局
- captureMode：页面级有则覆盖全局
- threshold：页面级有则覆盖全局
- mainRegionSelector 存在时，captureMode 强制为 "region"
```

### 6.5 配置校验规则

| 校验项 | 规则 | 错误级别 |
|--------|------|---------|
| `auth` 所有必填字段存在 | 缺一不可 | fatal |
| `auth.loginUrl` 格式 | 合法 URL | fatal |
| `viewports` 非空 | 至少一项 | fatal |
| `viewports[].width/height` | 正整数 | fatal |
| `pagePairs` 非空 | 至少一项 | fatal |
| `pagePairs[].name` 唯一 | 不能重复 | fatal |
| `pagePairs[].baseline/candidate.url` 格式 | 合法 URL | fatal |
| `diff.threshold` 范围 | 0-1 | fatal |
| `pagePairs[].mainRegionIndex` | 非负整数 | fatal |
| `capture.mode` 枚举 | fullPage / region / scroll | fatal |
| `pagePairs[].id` 唯一 | 不能重复（如手动指定） | fatal |

校验时机：`run` 命令启动后、浏览器启动前。校验失败不创建输出目录。

---

## 7. 报告模型

### 7.1 data.json 结构

```typescript
interface DataJson {
  // 运行元信息
  runId: string                        // 输出目录名
  timestamp: string                    // ISO 8601
  duration: number                     // 总耗时 ms
  uiGuardianVersion: string            // 工具版本号

  // 配置快照
  config: {
    global: GlobalConfig               // 脱敏后的全局配置（密码隐藏）
    pages: PagesConfig
  }

  // 汇总统计
  summary: {
    totalPages: number                 // 页面对数 × 视口数
    totalPagePairs: number             // 页面对数
    totalViewports: number             // 视口数
    passed: number
    failed: number
    errors: number
    passRate: number                   // 0-1
    totalDuration: number              // ms
  }

  // 视口维度统计
  viewportSummary: ViewportSummaryItem[]

  // 页面结果
  pages: PageResult[]

  // 异常汇总
  anomalySummary: {
    totalConsoleErrors: number
    totalNetworkFailures: number
    totalJsErrors: number
    pagesWithAnomalies: number
  }
}
```

### 7.2 index.html 汇总页

展示内容：

- 运行元信息（时间、耗时、版本）
- 统计总览（总数、通过、失败、异常、通过率）
- 视口维度统计
- 异常概览（console errors / network failures / JS errors）
- 页面列表（页面名、视口、状态、差异%、异常数、耗时），点击跳转详情

状态枚举：

- `passed`：差异百分比 < 阈值
- `failed`：差异百分比 >= 阈值
- `error`：页面加载/截图过程中发生异常

### 7.3 pages/ 逐页详情页

每个文件命名：`<pageId>_<viewportLabel>.html`，如 `home_desktop.html`

展示内容：

- 页面标题 + 状态 + 差异百分比 + 阈值 + 耗时
- 截图对比（baseline / candidate / diff 三栏，并排/叠加/仅diff 切换）
- 差异详情（差异像素数、总像素数、阈值、判定）
- 配置快照（mainRegionSelector、ignoreSelectors）
- 异常日志（按 baseline / candidate 分栏展示 console / network / errors）

### 7.4 异常日志呈现规则

| 位置 | 呈现方式 |
|------|---------|
| index.html 汇总页 | 统计数字，不展开详情 |
| index.html 页面列表 | 异常数列，有异常的页面高亮 |
| pages/*.html 详情页 | 按 baseline / candidate 分栏完整展示 |
| data.json | 结构化原始数据，按页面归档 |

---

## 8. 数据模型

### 8.1 核心配置类型

```typescript
interface AuthConfig {
  loginUrl: string
  username: string
  password: string
  usernameSelector: string
  passwordSelector: string
  submitSelector: string
  successWait?: {
    type: 'url' | 'selector'
    value: string
  }
  timeout?: number
}

interface ViewportConfig {
  width: number
  height: number
  label?: string
}

interface CaptureConfig {
  mode?: 'fullPage' | 'region' | 'scroll'
  scrollStep?: number
  waitForNetworkIdle?: boolean
  pageLoadTimeout?: number
  screenshotDelay?: number
}

interface DiffConfig {
  threshold?: number
  includeAA?: boolean
}

interface GlobalConfig {
  auth: AuthConfig
  viewports: ViewportConfig[]
  capture?: CaptureConfig
  diff?: DiffConfig
  ignoreSelectors?: string[]
  outputDir?: string
}

interface PagePair {
  name: string
  id?: string
  baseline: { url: string }
  candidate: { url: string }
  mainRegionSelector?: string
  mainRegionIndex?: number
  ignoreSelectors?: string[]
  viewports?: ViewportConfig[]
  captureMode?: 'fullPage' | 'region' | 'scroll'
  scrollCapture?: boolean
  threshold?: number
}

interface PagesConfig {
  pagePairs: PagePair[]
}
```

### 8.2 运行时结果类型

```typescript
interface ConsoleEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug'
  text: string
  timestamp: number
}

interface NetworkEntry {
  url: string
  method: string
  status: number
  statusText: string
  timestamp: number
}

interface ErrorEntry {
  message: string
  stack?: string
  timestamp: number
}

interface AnomalyResult {
  console: ConsoleEntry[]
  network: NetworkEntry[]
  errors: ErrorEntry[]
}

interface ScreenshotMeta {
  mode: 'fullPage' | 'region' | 'scroll'
  width: number
  height: number
  segments?: number
}

interface ScreenshotResult {
  images: Buffer[]
  meta: ScreenshotMeta
}

interface DiffResult {
  diffImage: Buffer
  diffPercent: number
  diffPixels: number
  totalPixels: number
  passed: boolean
  threshold: number
}
```

### 8.3 PageResult — 页面级结果

```typescript
interface PageResult {
  pageId: string
  pageName: string
  viewport: { width: number; height: number; label: string }

  baseline: {
    url: string
    screenshotPath: string | null
    screenshotMeta: ScreenshotMeta | null
    anomalies: AnomalyResult
  }

  candidate: {
    url: string
    screenshotPath: string | null
    screenshotMeta: ScreenshotMeta | null
    anomalies: AnomalyResult
  }

  diff: {
    diffImagePath: string
    diffPercent: number
    diffPixels: number
    totalPixels: number
    passed: boolean
    threshold: number
  } | null

  config: {
    mainRegionSelector?: string
    mainRegionIndex?: number
    ignoreSelectors: string[]
  }

  status: 'passed' | 'failed' | 'error'
  error?: string
  duration: number
  reportPath: string
}
```

### 8.4 RunResult — 运行级结果

```typescript
interface RunResult {
  runId: string
  timestamp: string
  duration: number
  uiGuardianVersion: string

  config: {
    global: GlobalConfig
    pages: PagesConfig
  }

  summary: {
    totalPages: number
    totalPagePairs: number
    totalViewports: number
    passed: number
    failed: number
    errors: number
    passRate: number
    totalDuration: number
  }

  viewportSummary: ViewportSummaryItem[]

  pages: PageResult[]

  anomalySummary: {
    totalConsoleErrors: number
    totalNetworkFailures: number
    totalJsErrors: number
    pagesWithAnomalies: number
  }

  reportDir: string
}

interface ViewportSummaryItem {
  label: string
  width: number
  height: number
  passed: number
  failed: number
  errors: number
}
```

---

## 9. 模块接口与边界

### 9.1 函数接口

| 模块 | 函数签名 | 输入 | 输出 |
|------|---------|------|------|
| cli/init | `init(options?)` | 输出目录 | `{ globalConfigPath, pagesConfigPath }` |
| cli/run | `run(options?)` | 配置目录 | `RunResult` |
| core/runner | `runAll(browser, globalConfig, pagesConfig, outputDir)` | 浏览器 + 配置 + 输出目录 | `RunResult` |
| core/auth | `authenticate(browser, authConfig)` | 浏览器 + 认证配置 | `AuthResult` |
| core/viewport | `createViewportContext(browser, viewport, storageState)` | 浏览器 + 视口 + 凭证 | `BrowserContext` |
| core/capture | `captureScreenshot(page, captureConfig)` | 页面 + 截图配置 | `ScreenshotResult` |
| core/collector | `createCollector()` | — | `Collector` |
| core/diff | `diffScreenshots(baseline, candidate, config)` | Buffer x2 + 配置 | `DiffResult` |
| core/diff | `diffScrollSegments(baseline[], candidate[], config)` | Buffer 数组 + 配置 | `DiffResult` |
| core/processSide | `processSide(page, url, config)` | 页面 + URL + 配置 | `SideProcessResult` |
| core/processPage | `processPage(browser, authResult, globalConfig, pagePair, viewport, outputDir)` | 全部上下文 | `PageResult` |
| report/generator | `generateHtmlReport(runResult)` | RunResult | 文件写入 |
| report/json | `generateJsonReport(runResult)` | RunResult | 文件写入 |

### 9.2 Collector 接口

```typescript
interface Collector {
  attach(page: Page, pageUrl: string): void   // 注册监听器，在 goto 前调用
  collect(): AnomalyResult                     // 收集结果，在截图后调用
  reset(): void                                // 重置状态
}
```

### 9.3 模块间数据传递

| 传递路径 | 方式 |
|---------|------|
| cli/run → runner | 内存对象 |
| runner → auth | 内存对象 |
| runner → processPage | 内存对象 |
| processPage → processSide | 内存对象 |
| processSide → capture | 内存对象（Buffer） |
| processSide → collector | 内存对象（Page 事件监听） |
| processPage → diff | 内存对象（Buffer） |
| processPage → 落盘 | **写文件**（截图） |
| runner → report | 内存对象（RunResult，含文件路径） |
| report → 落盘 | **写文件**（HTML + JSON） |

核心引擎内部全部通过内存对象传递，不写文件。截图落盘统一由 processPage 负责。

### 9.4 职责边界约束

| 模块 | 必须做 | 不能做 |
|------|--------|--------|
| cli/init | 生成模板文件 | 校验配置 |
| cli/run | 加载配置、启动/关闭浏览器、调度 runner、输出摘要 | 包含业务逻辑 |
| runner | 管理 browser/context/page 生命周期、遍历页面对×视口、调度 processPage、组装 RunResult、调用报告生成 | 直接实现截图/对比/采集逻辑 |
| auth | 自动登录、返回凭证 | 访问业务页面 |
| capture | 按配置截图、返回 Buffer | 处理 ignoreSelectors 注入 |
| collector | 监听并收集异常 | 判定异常是否为问题 |
| diff | 像素对比、生成热力图 | 读写文件 |
| viewport | 创建视口 Context | 遍历页面 |
| processPage | 编排单页流程、落盘截图、组装 PageResult | — |
| report/* | 消费 RunResult 生成报告 | 修改数据 |

---

## 10. 错误处理

### 10.1 错误分级

| 级别 | 场景 | 处理方式 |
|------|------|---------|
| **fatal** | 认证失败、配置缺失/格式错误 | 立即终止，输出错误信息 |
| **recoverable** | 单页面加载超时、截图失败、对比失败 | 跳过该页面，标记 `status: "error"`，继续后续 |

### 10.2 单页面错误处理

```
页面处理过程中发生异常
├── 捕获异常
├── 记录错误信息到 PageResult.error
├── 设置 PageResult.status = "error"
├── 截图标记为缺失（screenshotPath: null）
├── 异常日志写入 logs/errors.json
└── continue 到下一个页面
```

### 10.3 日志归档

所有日志按页面归档到 `logs/` 目录：

```json
// logs/console.json / network.json / errors.json
{
  "pageId_1": {
    "baseline": [ { "type": "error", "text": "...", "timestamp": 1234 } ],
    "candidate": [ { "type": "error", "text": "...", "timestamp": 1234 } ]
  }
}
```

Run-level fatal 错误记录在 `errors.json` 的 `_run` 键下。

---

## 11. 实现顺序

### 11.1 阶段划分与里程碑

| 阶段 | 任务 | 里程碑 | 验证方式 |
|------|------|--------|---------|
| Phase 1: 基础层 | T01-T05 | M1: `init` 可用 | 运行 init，检查生成的配置文件 |
| Phase 2: 主链路 | T06-T10 | M2: 单页面截图跑通 | 配置一个页面对，运行后检查截图 |
| Phase 3: 对比+异常 | T11-T13 | M3: 有 diff 图和异常 | 制造环境差异，检查 diff 和异常 |
| Phase 4: 完整功能 | T14-T18 | M4: 全配置生效 | 多页面×多视口×多模式全量运行 |
| Phase 5: 报告 | T19-T22 | M5: MVP 完成 | 浏览器打开报告，检查完整度 |

### 11.2 任务清单

**Phase 1: 基础层**

- T01 项目初始化（package.json, tsconfig.json, 安装依赖）
- T02 核心类型定义（config/types.ts）
- T03 配置校验（config/validation.ts）
- T04 默认值合并（config/defaults.ts）
- T05 CLI init 命令（cli/init.ts）

**Phase 2: 主链路**

- T06 认证模块（core/auth.ts）
- T07 视口模块（core/viewport.ts）
- T08 截图模块 — 整页模式（core/capture.ts）
- T09 Runner 主流程（core/runner.ts）
- T10 CLI run 命令（cli/run.ts）

**Phase 3: 对比+异常**

- T11 异常采集模块（core/collector.ts）
- T12 像素对比模块（core/diff.ts）
- T13 Runner 集成 collector + diff

**Phase 4: 完整功能**

- T14 区域截图（capture.ts 更新，mainRegionSelector）
- T15 滚动分段截图（capture.ts 更新）
- T16 多视口支持（runner.ts 更新）
- T17 页面级配置合并（runner.ts 更新）
- T18 抽取 processSide / processPage

**Phase 5: 报告**

- T19 JSON 报告（report/json.ts）
- T20 HTML 模板（report/template.ts）
- T21 HTML 报告生成（report/generator.ts）
- T22 Runner 集成报告

### 11.3 任务依赖关系

```
T01 → T02 → T03 ──────────→ T09
           → T04 ──────────→ T09
           → T05 (M1)         ↓
           → T06 ──────────→ T09 → T10 (M2)
           → T07 ──────────→ T09
           → T08 ──────────→ T09
                    └──────→ T14
                    └──────→ T15
           → T11 ─────┐
           → T12 ─────┴──→ T13 (M3)
                              ↓
           T14, T15 ─────→ T16 → T17 → T18 (M4)
           → T19 ─────┐
           → T20 ─────┴──→ T21 → T22 (M5)
```

### 11.4 可独立验证的任务

| 任务 | 验证方式 |
|------|---------|
| T03 | 传入合法/非法配置对象，断言返回结果 |
| T04 | 传入 global + pagePair 配置，断言合并结果 |
| T05 | 运行 init，检查生成的文件 |
| T08 | Mock Playwright Page，断言调用了正确的截图方法 |
| T11 | Mock Playwright Page 事件，触发后断言收集结果 |
| T12 | 传入两张已知图片 Buffer，断言 diffPercent |
| T19 | 传入 RunResult，断言文件内容 |

### 11.5 建议开发节奏

- 第 1 天：T01-T05（基础层），达到 M1
- 第 2-3 天：T06-T10（主链路），达到 M2
- 第 4 天：T11-T13（对比+异常），达到 M3
- 第 5-6 天：T14-T18（完整功能），达到 M4
- 第 7 天：T19-T22（报告），达到 M5

M2 是最高优先级里程碑，打通后后续所有开发都可端到端验证。
