## CLARIFIED Requirements

### Requirement: 像素差异与页面状态的关系（设计决策）
系统 SHALL 将像素差异仅作为视觉参考，**不作为页面 status 的判定依据**。页面 status（passed/failed）由文本差异决定（参见 text-diff spec）。这是一个有意的设计决策，原因如下：

1. 像素差异容易受布局宽度、渲染引擎、字体渲染等非内容因素影响
2. 文本差异更能反映实际内容变化，是测试的核心关注点
3. 像素差异热力图仍保留用于视觉定位，但不影响通过/失败判定

#### Scenario: 像素有差异但文本一致
- **WHEN** baseline 和 candidate 截图像素差异为 6.8%（因布局宽度不同），但文本内容完全一致
- **THEN** DiffResult.passed 为 false（按像素阈值），但页面 status 为 passed（按文本差异）

#### Scenario: 像素和文本都有差异
- **WHEN** baseline 和 candidate 截图像素差异为 2.5%，文本内容也有变化
- **THEN** DiffResult.passed 为 false，页面 status 也为 failed
