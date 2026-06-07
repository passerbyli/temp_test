## MODIFIED Requirements

### Requirement: 执行编排流程
系统 SHALL 按以下顺序执行：加载配置 → 校验 → 初始化输出目录 → 启动浏览器 → 认证 → 遍历 pagePair × viewports（processPage）→ 汇总结果 → 生成报告 → 关闭浏览器 → 终端输出摘要。

#### Scenario: 完整执行流程
- **WHEN** 用户执行 run 命令，配置合法
- **THEN** 系统按顺序完成所有步骤，终端输出统计摘要和报告路径

### Requirement: 页面对遍历顺序
系统 SHALL 外层遍历 pagePair，内层遍历 viewports（基于合并后的 finalViewports = pagePair.viewports ?? global.viewports）。每个 pagePair × viewport 组合使用独立的 BrowserContext（含认证 storageState）。

#### Scenario: 遍历顺序
- **WHEN** 配置了 3 个 pagePairs 和 2 个全局 viewports
- **THEN** 系统按 pagePair1×viewport1、pagePair1×viewport2、pagePair2×viewport1... 顺序执行

### Requirement: Per-side 配置传递
系统 SHALL 在 processPage 中为 baseline 和 candidate 分别传递对应的 ResolvedSideConfig（baselineConfig 和 candidateConfig）到 processSide，确保两侧使用独立的截图模式、选择器和噪声过滤配置。

#### Scenario: 两侧独立配置
- **WHEN** baseline.config.mainRegionSelector 为 ".legacy-view"，candidate.config.mainRegionSelector 为 ".new-view"
- **THEN** processSide 分别使用各自的选择器进行截图和文本提取

### Requirement: 可恢复错误处理
系统 SHALL 对单页面的加载超时、截图失败、对比失败等 recoverable 错误进行捕获，标记该页面 status: "error"，记录 error 信息，继续处理后续页面。

#### Scenario: 单页面截图失败不影响后续
- **WHEN** pagePair2 在 viewport1 下截图超时
- **THEN** 该页面标记为 status: "error"，pagePair3 正常继续执行

### Requirement: Fatal 错误终止
系统 SHALL 对认证失败、配置缺失/格式错误等 fatal 错误立即终止整个流程，输出错误信息。

#### Scenario: 认证失败终止
- **WHEN** 自动登录流程失败
- **THEN** 系统输出 AuthError 信息，终止运行，不生成报告

### Requirement: 终端输出摘要
系统 SHALL 在运行结束后终端输出总页面数、通过数、失败数、异常数、报告路径、总耗时。

#### Scenario: 终端摘要格式
- **WHEN** 运行完成
- **THEN** 终端输出类似 "30 pages, 25 passed, 3 failed, 2 errors | Report: output/reports/2026-06-05-143000 | Duration: 45s"
