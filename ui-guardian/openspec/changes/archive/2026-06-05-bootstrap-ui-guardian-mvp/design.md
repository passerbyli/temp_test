## Context

从零搭建 ui-guardian 项目。完整设计文档见 `docs/superpowers/specs/2026-06-05-ui-guardian-design.md`。

目标用户：开发（定位问题）和测试（批量验证 + 生成报告）。运行环境：本地 CLI。技术栈：Node.js / TypeScript + Playwright + pixelmatch。

## Goals / Non-Goals

**Goals:**
- 本地 CLI 工具，支持两套前端环境之间的页面一致性验证
- 视觉差异检测为核心，异常采集（console/network/JS error）为辅助诊断
- 支持整页/区域/滚动分段截图，多视口执行，噪声元素过滤
- 生成版本化 HTML + JSON 报告

**Non-Goals:**
- 基线管理模式、DOM 结构对比、功能/交互验证、CI/CD 集成、报告本地服务、异常自动判定

## Decisions

### D1: 项目结构 — 分层模块化

```
cli/        → CLI 入口（init / run）
config/     → 配置层（types / validation / defaults）
core/       → 核心引擎（runner / auth / capture / collector / diff / viewport / processSide / processPage）
report/     → 报告生成（generator / template / json）
```

**理由**：职责清晰，每模块单一职责，可独立测试。runner 管理 browser/context/page 生命周期，不直接实现截图/对比/采集。

### D2: 配置模型 — 全局 + 页面对二级配置

- `global.config.json`：认证、视口、截图、对比、噪声过滤、输出目录
- `pages.config.json`：URL 对、mainRegionSelector、ignoreSelectors、视口/阈值覆盖
- 合并规则：ignoreSelectors 追加，viewports/captureMode/threshold 页面级覆盖全局

**理由**：全局默认 + 页面级覆盖，减少重复配置。两个文件分离关注点。

### D3: 截图方案 — Playwright 无头浏览器

- 三种模式：fullPage（整页）、region（mainRegionSelector 元素截图）、scroll（滚动分段）
- 模式判定：mainRegionSelector 存在 → region；scrollCapture: true → scroll；默认 fullPage
- ignoreSelectors 在截图前注入（page.addStyleTag），mainRegionSelector 在截图时生效（locator.screenshot）

**理由**：Playwright 框架无关，真实渲染，支持任意前端框架。

### D4: 对比方案 — pixelmatch 像素对比

- 基于 pixelmatch 进行像素级对比，生成差异热力图
- 支持差异阈值（0-1）和 anti-aliasing 过滤
- 滚动分段场景：逐段 diff，取最大 diffPercent 作为页面最终结果

**理由**：pixelmatch 成熟轻量，几行代码即可集成。

### D5: 异常采集 — 旁路采集，只收集不判定

- Collector 工厂模式：attach(page) 在 goto 前注册监听，collect() 在截图后收集结果
- 采集内容：console error/warn、request failed、page error
- 按页面 + baseline/candidate 分侧归档

**理由**：采集成本极低（Playwright 原生事件），为开发提供诊断上下文。首版不判定，避免噪音。

### D6: 执行编排 — runner 管理生命周期

- 外层循环 pagePair，内层循环 viewports（页面级覆盖优先）
- 认证只执行一次，凭证通过 storageState 注入到每个视口上下文
- 单页面 recoverable 错误 → status: "error"，继续后续页面；认证失败 → fatal 终止

**理由**：pagePair 外层循环确保每个页面对的视口配置正确合并。凭证复用避免重复登录。

### D7: 报告输出 — 多文件 HTML + JSON，版本化目录

- 每次运行生成 `output/reports/YYYY-MM-DD-HHmmss/` 独立目录
- HTML 拆分为 index.html（汇总）+ pages/*.html（逐页详情），避免单文件过大
- JSON 脱敏输出（密码隐藏），Buffer 字段只保留文件路径

**理由**：大量页面下单文件不可行，版本化确保历史报告不丢失。

### D8: 认证流程 — 共享后端自动登录

- 配置文件写登录地址 + 账号密码 + 表单选择器
- 工具自动走登录接口，提取凭证到内存
- 凭证通过 storageState 注入到后续所有 BrowserContext，不落盘

**理由**：两套环境共享后端，登录一次即可访问两个环境。

## Risks / Trade-offs

- **[Risk] 动态内容导致误报** → 通过 ignoreSelectors 过噪 + diff.threshold 容差缓解
- **[Risk] 大量页面截图耗时长** → 首版接受，后续可加并发截图优化
- **[Risk] 登录流程多样（SSO/MFA/滑块）** → 首版只支持简单表单登录，复杂认证后续扩展
- **[Risk] 滚动分段截图拼接精度** → 逐段独立 diff，不拼接，取最差段作为结果
- **[Trade-off] 异常只采集不判定** → 避免误判噪音，但需要人工判断，后续迭代加规则
