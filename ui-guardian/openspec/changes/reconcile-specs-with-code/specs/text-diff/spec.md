## CLARIFIED Requirements

### Requirement: 通过/失败由文本差异判定
系统 SHALL 以文本差异作为页面 status 的**唯一判定依据**：textDiff 中存在任何非 unchanged 条目时，页面 status 为 failed；无文本差异时为 passed。像素差异仅作为视觉参考，不参与 status 判定。

这是一个有意的设计决策，原因如下：
1. 像素差异容易受布局宽度、渲染引擎、字体渲染等非内容因素影响，导致误报
2. 文本差异更能反映实际内容变化，是 UI 回归测试的核心关注点
3. 像素差异热力图仍保留用于视觉定位，但不影响通过/失败判定

#### Scenario: 像素有差异但文本一致
- **WHEN** baseline 和 candidate 截图像素差异为 6.8%（因布局宽度不同），但文本内容完全一致
- **THEN** 页面 status 为 passed，diffResult.passed 为 true

#### Scenario: 文本有差异
- **WHEN** baseline 和 candidate 文本存在内容差异
- **THEN** 页面 status 为 failed

#### Scenario: 文本无差异但像素差异高于阈值
- **WHEN** baseline 和 candidate 文本内容完全一致，但 diffPercent 为 3.2%（高于默认 threshold 1%）
- **THEN** 页面 status 为 passed（文本决定），diffResult.passed 为 false（像素阈值决定），两者独立
