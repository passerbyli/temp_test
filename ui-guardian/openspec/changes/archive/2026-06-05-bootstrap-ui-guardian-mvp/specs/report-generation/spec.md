## ADDED Requirements

### Requirement: 版本化输出目录
系统 SHALL 每次运行生成独立的版本化输出目录 `output/reports/YYYY-MM-DD-HHmmss/`，不覆盖旧报告。

#### Scenario: 多次运行不覆盖
- **WHEN** 用户连续运行两次 run 命令
- **THEN** 生成两个不同时间戳的报告目录，旧报告保留

### Requirement: JSON 数据输出
系统 SHALL 生成 `data.json`，包含 runId、timestamp、duration、config（脱敏）、summary、viewportSummary、pages（PageResult 数组）、anomalySummary。

#### Scenario: JSON 包含完整运行数据
- **WHEN** 对比流程完成
- **THEN** data.json 包含所有页面的对比结果、统计信息、异常汇总，密码字段已脱敏

### Requirement: HTML 汇总页
系统 SHALL 生成 `index.html` 汇总页，展示运行元信息、统计总览（总数/通过/失败/异常/通过率）、视口维度统计、异常概览、页面列表（可点击跳转详情）。

#### Scenario: 汇总页展示统计信息
- **WHEN** 运行完成，30 个页面中 25 通过、3 失败、2 异常
- **THEN** index.html 展示通过率 83.3%，页面列表每行显示状态、差异%、异常数、耗时

### Requirement: HTML 逐页详情页
系统 SHALL 为每个页面×视口生成 `pages/<pageId>_<viewportLabel>.html`，展示截图对比（baseline/candidate/diff 三栏）、差异详情、配置快照、异常日志。

#### Scenario: 详情页展示截图对比
- **WHEN** 某页面 desktop 视口对比完成
- **THEN** 生成 pages/home_desktop.html，包含 baseline 截图、candidate 截图、diff 热力图、差异百分比、异常日志

### Requirement: 截图文件归档
系统 SHALL 将截图按 screenshots/baseline/、screenshots/candidate/、screenshots/diff/ 分目录存放。

#### Scenario: 截图文件路径
- **WHEN** 页面 "home" 在 "desktop" 视口下对比完成
- **THEN** baseline 截图在 screenshots/baseline/home_desktop.png，candidate 在 screenshots/candidate/home_desktop.png，diff 在 screenshots/diff/home_desktop.png
