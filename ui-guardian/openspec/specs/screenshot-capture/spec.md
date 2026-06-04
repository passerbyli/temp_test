## ADDED Requirements

### Requirement: 整页截图模式
系统 SHALL 支持整页截图模式（fullPage），调用 `page.screenshot({ fullPage: true })` 截取完整页面。

#### Scenario: 整页截图成功
- **WHEN** captureMode 为 "fullPage"，页面加载完成
- **THEN** 系统截取完整页面截图，返回一张图片 Buffer

### Requirement: 区域截图模式
系统 SHALL 支持区域截图模式（region），基于 mainRegionSelector + mainRegionIndex 定位主体区域，调用 `locator.screenshot()` 只截取该元素。

#### Scenario: 区域截图成功
- **WHEN** mainRegionSelector 为 ".main-content"，mainRegionIndex 为 0，页面加载完成
- **THEN** 系统只截取第一个匹配 ".main-content" 的元素区域

#### Scenario: 主体区域元素未找到
- **WHEN** mainRegionSelector 匹配的元素数量 <= mainRegionIndex
- **THEN** 系统抛出 CaptureError，该页面标记为 status: "error"

### Requirement: 滚动分段截图模式
系统 SHALL 支持滚动分段截图模式（scroll），按 scrollStep（默认 800px）逐段滚动页面并截图，返回多张图片 Buffer。

#### Scenario: 滚动分段截图成功
- **WHEN** captureMode 为 "scroll"，页面总高度为 2400px，scrollStep 为 800
- **THEN** 系统截取 3 张分段截图，返回 images 数组长度为 3，meta.segments 为 3

### Requirement: 噪声元素注入
系统 SHALL 在截图前通过 `page.addStyleTag` 注入 ignoreSelectors，将匹配元素设为 `display: none !important`，然后再执行截图。

#### Scenario: ignoreSelectors 生效
- **WHEN** ignoreSelectors 包含 [".cookie-banner", ".timestamp"]
- **THEN** 截图中这两个元素不可见，注入发生在截图执行前

### Requirement: 截图模式自动判定
系统 SHALL 按以下优先级判定截图模式：mainRegionSelector 存在 → region；scrollCapture: true → scroll；默认 → fullPage。页面级 captureMode 可覆盖全局。

#### Scenario: mainRegionSelector 优先于全局配置
- **WHEN** 全局 capture.mode 为 "fullPage"，页面配置了 mainRegionSelector
- **THEN** 该页面使用 region 模式截图
