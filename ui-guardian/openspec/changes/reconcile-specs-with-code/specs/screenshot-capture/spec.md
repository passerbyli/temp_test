## CLARIFIED Requirements

### Requirement: 滚动分段截图模式
系统 SHALL 支持滚动分段截图模式（scroll），按 scrollStep（默认 800px）逐段滚动页面并截图，返回多张图片 Buffer。每个滚动位置等待 300ms 让渲染稳定（注：比页面级滚动的 200ms 更长，因为需要确保滚动容器内的内容完全渲染）。

#### Scenario: 滚动分段截图成功
- **WHEN** captureMode 为 "scroll"，页面总高度为 2400px，scrollStep 为 800
- **THEN** 系统截取 3 张分段截图，返回 images 数组长度为 3，meta.segments 为 3
