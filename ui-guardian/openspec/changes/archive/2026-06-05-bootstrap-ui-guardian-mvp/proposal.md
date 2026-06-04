## Why

前端应用在多套环境（staging / production）、多版本（v1 / v2）、多框架（Vue / React）之间部署时，缺乏一个轻量、框架无关、本地可运行的页面一致性验证工具。现有工具（Percy、BackstopJS）要么依赖 CI 平台，要么只做像素对比缺乏诊断能力。开发无法快速定位差异根因，测试无法批量验证并生成可追溯的报告。

## What Changes

- 新建 `ui-guardian` CLI 工具，支持 `init`（生成配置模板）和 `run`（执行对比）两个命令
- 基于 Playwright 无头浏览器进行页面截图，支持整页、区域（mainRegionSelector）、滚动分段三种模式
- 截图过程中同步采集控制台错误、网络失败、JS 异常，作为辅助诊断信息
- 基于 pixelmatch 进行像素对比，生成差异热力图
- 支持多视口执行，页面级配置可覆盖全局配置
- 支持噪声元素过滤（ignoreSelectors）和差异阈值容差
- 自动生成多文件 HTML 报告 + JSON 结构化数据，版本化输出目录
- 支持共享后端认证（自动登录，凭证内存管理）

## Capabilities

### New Capabilities

- `cli-commands`: CLI 入口，init 生成配置模板，run 执行对比流程
- `config-model`: 全局配置（认证、视口、截图、对比、噪声过滤）+ 页面对配置（URL 对、选择器、视口覆盖）
- `auth-module`: 自动登录模块，支持表单提交认证，凭证存内存注入浏览器上下文
- `screenshot-capture`: 截图模块，支持整页/区域/滚动分段三种模式
- `anomaly-collector`: 异常采集模块，在页面导航前注册监听，采集 console error、网络失败、JS 异常
- `pixel-diff`: 像素对比模块，基于 pixelmatch 生成差异热力图和差异百分比
- `viewport-execution`: 多视口执行，按配置的分辨率列表逐一创建 BrowserContext 执行对比
- `report-generation`: 报告生成模块，输出多文件 HTML 报告（汇总页 + 逐页详情）+ JSON 数据
- `runner-orchestration`: 执行编排层，管理 browser/context/page 生命周期，调度各模块

### Modified Capabilities

（无，全新项目）

## Impact

- **新建项目**：从零搭建，不影响现有代码
- **依赖**：Playwright（浏览器自动化）、pixelmatch（像素对比）、pngjs（PNG 解析）、Commander.js（CLI 框架）
- **运行环境**：Node.js / TypeScript，本地 CLI 运行
- **输出**：每次运行生成独立版本化报告目录（HTML + JSON + 截图 + 日志）
