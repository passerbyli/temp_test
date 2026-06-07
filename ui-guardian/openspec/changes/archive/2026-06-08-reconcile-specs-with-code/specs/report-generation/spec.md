## MODIFIED Requirements

### Requirement: 版本化输出目录
系统 SHALL 每次运行生成独立的版本化输出目录 `output/reports/YYYY-MM-DD-HHmmss/`，不覆盖旧报告。

#### Scenario: 多次运行不覆盖
- **WHEN** 用户连续运行两次 run 命令
- **THEN** 生成两个不同时间戳的报告目录，旧报告保留

### Requirement: JSON 数据输出
系统 SHALL 生成 `data.json`，包含 runId、timestamp、duration、config（脱敏）、summary、viewportSummary、pages（PageResult 数组）、anomalySummary。密码字段 SHALL 以 `******` 替代，Buffer 字段 SHALL 被剥离。

#### Scenario: JSON 包含完整运行数据
- **WHEN** 对比流程完成
- **THEN** data.json 包含所有页面的对比结果、统计信息、异常汇总，密码字段已脱敏

### Requirement: HTML 汇总页
系统 SHALL 生成 `index.html` 汇总页，采用 SPA 架构（侧边栏导航 + iframe 内容区），展示运行元信息、KPI 卡片（总数/通过/失败/异常/通过率）、视口维度统计、异常概览、页面列表（可点击跳转详情）。

#### Scenario: 汇总页展示统计信息
- **WHEN** 运行完成，30 个页面中 25 通过、3 失败、2 异常
- **THEN** index.html 展示通过率 83.3%，页面列表每行显示状态、差异%、异常数、耗时

#### Scenario: 侧边栏导航
- **WHEN** 用户打开 index.html
- **THEN** 左侧显示页面列表侧边栏，每项显示页面名称、状态徽章、差异百分比，点击后右侧 iframe 加载对应详情页

### Requirement: HTML 逐页详情页
系统 SHALL 为每个页面×视口生成 `pages/<pageId>_<viewportLabel>.html`，展示：页面名称、视口、状态徽章、差异百分比、截图模式、耗时；baseline/candidate/diff 三栏截图对比（响应式网格，支持点击放大 lightbox）；文本差异表格（红色标记 removed、绿色标记 added）；异常日志（控制台、网络、JS 错误）。

#### Scenario: 详情页展示截图对比
- **WHEN** 某页面 desktop 视口对比完成
- **THEN** 生成 pages/home_desktop.html，包含 baseline 截图、candidate 截图、diff 热力图

#### Scenario: 图片点击放大
- **WHEN** 用户点击详情页中的任意截图
- **THEN** 弹出 lightbox 模态框显示全尺寸图片，按 Escape 或点击遮罩关闭

#### Scenario: 文本差异展示
- **WHEN** textDiff 包含 removed 和 added 条目
- **THEN** 详情页显示文本差异表格，removed 行红色背景，added 行绿色背景

### Requirement: 截图文件归档
系统 SHALL 将截图按 screenshots/baseline/、screenshots/candidate/、screenshots/diff/ 分目录存放。滚动分段截图使用 `_seg0`、`_seg1` 后缀。

#### Scenario: 单张截图文件路径
- **WHEN** 页面 "home" 在 "desktop" 视口下对比完成
- **THEN** baseline 截图在 screenshots/baseline/home_desktop.png，candidate 在 screenshots/candidate/home_desktop.png，diff 在 screenshots/diff/home_desktop.png

#### Scenario: 滚动分段截图文件路径
- **WHEN** 页面 "list" 在 "desktop" 视口下使用 scroll 模式，截取 3 段
- **THEN** 截图文件为 screenshots/baseline/list_desktop_seg0.png、seg1.png、seg2.png
