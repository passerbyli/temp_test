## ADDED Requirements

### Requirement: 多视口执行
系统 SHALL 按配置的 viewports 列表逐一创建 BrowserContext，每个视口独立执行完整的截图+对比流程。

#### Scenario: 全局视口列表执行
- **WHEN** global.config.viewports 配置了 [1920x1080, 1366x768, 375x812]
- **THEN** 每个 pagePair 在 3 个视口下各执行一次截图+对比，共生成 3 组结果

### Requirement: 页面级视口覆盖
系统 SHALL 支持页面级 viewports 配置覆盖全局 viewports。

#### Scenario: 页面级视口覆盖全局
- **WHEN** 全局 viewports 为 [1920x1080, 1366x768]，某 pagePair.viewports 为 [375x812]
- **THEN** 该页面对只在 375x812 视口下执行，其他页面对仍在全局视口下执行

### Requirement: 视口标签
系统 SHALL 为每个视口生成标签，优先使用 viewports[].label，未配置时自动生成 "WxH" 格式。

#### Scenario: 视口标签用于报告和文件命名
- **WHEN** viewports 配置为 [{ width: 1920, height: 1080, label: "desktop" }]
- **THEN** 报告中该视口显示为 "desktop"，截图文件名包含 "desktop"
