# ui-guardian

UI 一致性验证工具，用于对比两套前端环境的页面差异，帮助开发定位问题，帮助测试快速生成测试报告。

## 安装

```bash
git clone <repo-url>
cd ui-guardian
npm install
npx playwright install chromium
npm run build
```

## 使用流程

### 1. 生成配置模板

```bash
npx ui-guardian init
```

在当前目录生成两个配置文件：

- `global.config.json` — 全局配置（认证、视口、截图、对比参数）
- `pages.config.json` — 页面对配置（要对比的页面 URL 列表）

### 2. 编辑配置

**global.config.json：**

```json
{
  "auth": {
    "loginUrl": "https://your-site.com/login",
    "username": "your-username",
    "password": "your-password",
    "usernameSelector": "#username",
    "passwordSelector": "#password",
    "submitSelector": "#login-btn",
    "successWait": { "type": "url", "value": "/dashboard" }
  },
  "viewports": [
    { "width": 1920, "height": 1080, "label": "desktop" },
    { "width": 375, "height": 812, "label": "mobile" }
  ],
  "capture": { "mode": "fullPage" },
  "diff": { "threshold": 0.01 },
  "ignoreSelectors": [".cookie-banner", ".timestamp"],
  "outputDir": "output/reports"
}
```

**pages.config.json：**

```json
{
  "pagePairs": [
    {
      "name": "首页",
      "baseline": { "url": "https://staging.example.com/" },
      "candidate": { "url": "https://prod.example.com/" }
    },
    {
      "name": "商品详情",
      "baseline": { "url": "https://staging.example.com/product/1" },
      "candidate": { "url": "https://prod.example.com/product/1" },
      "mainRegionSelector": ".product-detail",
      "threshold": 0.05
    }
  ]
}
```

### 3. 执行对比

```bash
npx ui-guardian run
```

输出示例：

```
2 pages, 1 passed, 1 failed, 0 errors
Report: output/reports/2026-06-05-143022
Duration: 12.3s
```

### 4. 查看报告

```bash
open output/reports/2026-06-05-143022/index.html
```

## 配置说明

### 全局配置（global.config.json）

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `auth` | 认证配置（登录 URL、账号密码、选择器） | 必填 |
| `viewports` | 视口列表 | 必填 |
| `capture.mode` | 截图模式：`fullPage` / `region` / `scroll` | `fullPage` |
| `capture.scrollStep` | 滚动步长（px） | `800` |
| `capture.waitForNetworkIdle` | 等待网络空闲 | `true` |
| `capture.pageLoadTimeout` | 页面加载超时（ms） | `60000` |
| `capture.screenshotDelay` | 截图前延迟（ms） | `0` |
| `diff.threshold` | 差异阈值（0.01 = 1%） | `0.01` |
| `diff.includeAA` | 是否包含抗锯齿像素 | `false` |
| `ignoreSelectors` | 全局噪声元素选择器 | `[]` |
| `outputDir` | 输出目录 | `output/reports` |

### 页面级配置（pages.config.json）

页面级配置可覆盖全局配置，支持以下字段：

| 配置项 | 说明 |
|--------|------|
| `name` | 页面名称（必填） |
| `baseline.url` | 基线环境 URL（必填） |
| `candidate.url` | 候选环境 URL（必填） |
| `mainRegionSelector` | 区域截图选择器（自动切换为 region 模式） |
| `mainRegionIndex` | 匹配元素索引 | `0` |
| `viewports` | 覆盖全局视口列表 |
| `threshold` | 覆盖差异阈值 |
| `ignoreSelectors` | 追加到全局噪声列表 |
| `captureMode` | 覆盖截图模式 |

## 截图模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `fullPage` | 整页截图 | 默认，适合大多数页面 |
| `region` | 区域截图 | 只对比主体内容，忽略头部/侧栏 |
| `scroll` | 滚动分段截图 | 超长页面，逐段对比取最差结果 |

## 输出结构

```
output/reports/2026-06-05-143022/
├── index.html              # HTML 汇总页
├── data.json               # JSON 完整数据（密码已脱敏）
├── pages/
│   ├── home_desktop.html   # 单页详情
│   └── product_mobile.html
└── screenshots/
    ├── baseline/            # 基线环境截图
    ├── candidate/           # 候选环境截图
    └── diff/                # 差异热力图
```

## 开发

```bash
npm run build    # 编译 TypeScript
npm run test     # 运行测试
```
