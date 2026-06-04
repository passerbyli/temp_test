## 1. 基础层

- [x] 1.1 项目初始化：创建 package.json、tsconfig.json，安装 Playwright、pixelmatch、pngjs、Commander.js 依赖
- [x] 1.2 核心类型定义：创建 config/types.ts，定义 GlobalConfig、PagesConfig、AuthConfig、ViewportConfig、CaptureConfig、DiffConfig、PagePair、PageResult、RunResult 等全部 TypeScript 类型
- [x] 1.3 配置校验：创建 config/validation.ts，实现 validateConfig()，校验所有必填字段、URL 格式、枚举值、阈值范围
- [x] 1.4 默认值合并：创建 config/defaults.ts，实现 mergeConfig()，处理全局+页面级配置合并（ignoreSelectors 追加、viewports/captureMode/threshold 覆盖）
- [x] 1.5 CLI init 命令：创建 cli/init.ts，实现配置模板生成，输出 global.config.json 和 pages.config.json 模板文件

## 2. 主链路

- [x] 2.1 认证模块：创建 core/auth.ts，实现 authenticate()，自动登录流程（表单填写→提交→成功判定→凭证提取），返回 AuthResult（context + storageState）
- [x] 2.2 视口模块：创建 core/viewport.ts，实现 createViewportContext()，创建指定视口的 BrowserContext 并注入 storageState
- [x] 2.3 截图模块（整页模式）：创建 core/capture.ts，实现 captureScreenshot() 的 fullPage 分支，调用 page.screenshot({ fullPage: true })
- [x] 2.4 Runner 主流程：创建 core/runner.ts，实现 runAll()，串接 auth → viewport → capture 流程，管理 browser/context/page 生命周期
- [x] 2.5 CLI run 命令：创建 cli/run.ts，实现配置加载 → 校验 → 启动 Playwright Browser → 调用 runner → 关闭浏览器 → 终端输出摘要

## 3. 对比 + 异常

- [x] 3.1 异常采集模块：创建 core/collector.ts，实现 createCollector() 工厂，支持 attach(page) 注册监听（goto 前）、collect() 收集结果、reset() 重置
- [x] 3.2 像素对比模块：创建 core/diff.ts，实现 diffScreenshots()，基于 pixelmatch 对比两张截图，生成 diffImage + diffPercent + passed
- [x] 3.3 Runner 集成 collector + diff：更新 core/runner.ts，串接 collector（processSide 中 attach/collect）和 diff（processPage 中对比），生成差异热力图

## 4. 完整功能

- [x] 4.1 区域截图：更新 core/capture.ts，实现 region 模式，基于 mainRegionSelector + mainRegionIndex 调用 locator.screenshot()
- [x] 4.2 滚动分段截图：更新 core/capture.ts，实现 scroll 模式，按 scrollStep 逐段滚动截图，返回多张 Buffer
- [x] 4.3 多视口支持：更新 core/runner.ts，外层遍历 pagePair，内层遍历 finalViewports（pagePair.viewports ?? global.viewports）
- [x] 4.4 页面级配置合并：更新 core/runner.ts，实现页面级 viewports/threshold/captureMode 覆盖，mainRegionSelector 存在时强制 region 模式
- [x] 4.5 抽取 processSide / processPage：从 runner 中拆出 core/processSide.ts（单侧处理：attach → goto → ignoreSelectors → 截图 → collect）和 core/processPage.ts（单页处理：baseline + candidate + diff + 组装 PageResult）

## 5. 报告

- [x] 5.1 JSON 报告：创建 report/json.ts，实现 generateJsonReport()，将 RunResult 序列化为 data.json（脱敏、Buffer 替换为路径）
- [x] 5.2 HTML 模板：创建 report/template.ts，定义汇总页和逐页详情页的 HTML 模板结构
- [x] 5.3 HTML 报告生成：创建 report/generator.ts，实现 generateHtmlReport()，生成 index.html（汇总页）+ pages/*.html（逐页详情）
- [x] 5.4 Runner 集成报告：更新 core/runner.ts，在流程末尾调用 generateHtmlReport() 和 generateJsonReport()
