## ADDED Requirements

### Requirement: 像素对比
系统 SHALL 基于 pixelmatch 对两张截图进行像素级对比，生成差异热力图（差异区域标红）、差异百分比、差异像素数。

#### Scenario: 对比结果包含差异信息
- **WHEN** baseline 截图和 candidate 截图存在视觉差异
- **THEN** 返回 DiffResult 包含 diffImage（热力图 Buffer）、diffPercent、diffPixels、totalPixels

### Requirement: 差异阈值判定
系统 SHALL 按 diff.threshold（默认 0.01，即 1%）判定通过/失败：diffPercent < threshold 为 passed。

#### Scenario: 差异低于阈值判定为通过
- **WHEN** diffPercent 为 0.5%，threshold 为 1%
- **THEN** DiffResult.passed 为 true

#### Scenario: 差异高于阈值判定为失败
- **WHEN** diffPercent 为 3.2%，threshold 为 1%
- **THEN** DiffResult.passed 为 false

### Requirement: Anti-aliasing 过滤
系统 SHALL 支持通过 diff.includeAA 配置是否包含 anti-aliasing 差异，默认 false。

#### Scenario: 排除 anti-aliasing 差异
- **WHEN** includeAA 为 false，两截图仅有字体 anti-aliasing 差异
- **THEN** diffPercent 接近 0，判定为通过

### Requirement: 截图尺寸校验
系统 SHALL 在对比前校验两张截图的宽高一致，不一致时抛出 DiffError。

#### Scenario: 截图尺寸不匹配
- **WHEN** baseline 截图尺寸为 1920x1080，candidate 截图尺寸为 1920x900
- **THEN** 系统抛出 DiffError，该页面标记为 status: "error"

### Requirement: 滚动分段对比
系统 SHALL 对滚动分段截图逐段 diff，取 diffPercent 最高的段作为该页面最终结果，diffImage 取该段的热力图。

#### Scenario: 滚动分段取最差结果
- **WHEN** 3 段截图的 diffPercent 分别为 0.1%、2.5%、0.3%，threshold 为 1%
- **THEN** 页面 diffPercent 为 2.5%，passed 为 false，diffImage 为第 2 段的热力图
