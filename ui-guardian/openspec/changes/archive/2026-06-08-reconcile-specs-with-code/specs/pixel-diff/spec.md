## MODIFIED Requirements

### Requirement: 像素对比
系统 SHALL 基于 pixelmatch 对两张截图进行像素级对比，生成差异热力图（差异区域标红）、差异百分比、差异像素数。pixelmatch 在两张截图的公共区域（取两者较小的宽高）上执行比较。

#### Scenario: 对比结果包含差异信息
- **WHEN** baseline 截图和 candidate 截图存在视觉差异
- **THEN** 返回 DiffResult 包含 diffImage（热力图 Buffer）、diffPercent、diffPixels、totalPixels

#### Scenario: 不同尺寸截图对比
- **WHEN** baseline 截图为 1920x1080，candidate 截图为 1880x1080
- **THEN** 系统将两者裁剪到 1880x1080 的公共区域进行比较，totalPixels 使用 baseline 原始尺寸（1920x1080）

### Requirement: 差异阈值
系统 SHALL 使用 diff.threshold（默认 0.01，即 1%）作为 pixelmatch 的敏感度参数。DiffResult.passed 按 diffPercent < threshold 判定。

#### Scenario: 差异低于阈值
- **WHEN** diffPercent 为 0.5%，threshold 为 1%
- **THEN** DiffResult.passed 为 true

#### Scenario: 差异高于阈值
- **WHEN** diffPercent 为 3.2%，threshold 为 1%
- **THEN** DiffResult.passed 为 false

### Requirement: Anti-aliasing 过滤
系统 SHALL 支持通过 diff.includeAA 配置是否包含 anti-aliasing 差异，默认 false。

#### Scenario: 排除 anti-aliasing 差异
- **WHEN** includeAA 为 false，两截图仅有字体 anti-aliasing 差异
- **THEN** diffPercent 接近 0

### Requirement: 滚动分段对比
系统 SHALL 对滚动分段截图逐段 diff，取 diffPercent 最高的段作为该页面最终结果，diffImage 取该段的热力图。

#### Scenario: 滚动分段取最差结果
- **WHEN** 3 段截图的 diffPercent 分别为 0.1%、2.5%、0.3%
- **THEN** 页面 diffPercent 为 2.5%，diffImage 为第 2 段的热力图

### Requirement: 不同尺寸截图处理
系统 SHALL 对不同尺寸的截图裁剪到公共区域（取两者较小的宽高）后进行比较，不抛出 DiffError。

#### Scenario: 宽度不同
- **WHEN** baseline 为 1920x1080，candidate 为 1880x1080
- **THEN** 裁剪到 1880x1080 后比较，不抛出异常

#### Scenario: 高度不同
- **WHEN** baseline 为 1920x1080，candidate 为 1920x900
- **THEN** 裁剪到 1920x900 后比较，不抛出异常
