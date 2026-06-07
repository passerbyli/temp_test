## ADDED Requirements

### Requirement: ECharts 图表数据提取
系统 SHALL 自动发现页面中的 Apache ECharts 图表实例，提取图表配置数据（标题、图例、X 轴、系列数据、颜色），将数据文本化后追加到页面文本内容中用于对比。

#### Scenario: 页面包含 ECharts 图表
- **WHEN** 页面 DOM 中存在带有 `_echarts_instance_` 属性的元素
- **THEN** 系统提取该图表的 title、legend、xAxis、series 数据，格式化为文本追加到 textContent

#### Scenario: 页面无 ECharts 图表
- **WHEN** 页面 DOM 中不存在 ECharts 相关元素
- **THEN** textContent 保持不变，不追加额外数据

### Requirement: ECharts 实例发现策略
系统 SHALL 支持两种 ECharts 实例发现策略：（1）查找带 `_echarts_instance_` 属性的 DOM 元素，调用 `echarts.getInstanceByDom()` 获取实例；（2）查找 `<canvas>` 元素，向上遍历最多 6 层祖先元素尝试获取 ECharts 实例。两种策略均支持 Vue 组件集成（`__vue__.$data`）的降级查找。

#### Scenario: 通过 _echarts_instance_ 属性发现
- **WHEN** DOM 元素具有 `_echarts_instance_` 属性
- **THEN** 系统通过 `echarts.getInstanceByDom()` 获取图表实例

#### Scenario: 通过 canvas 元素发现
- **WHEN** 页面包含 `<canvas>` 元素但无 `_echarts_instance_` 属性
- **THEN** 系统向上遍历 canvas 的祖先元素，尝试获取 ECharts 实例

#### Scenario: Vue 集成降级查找
- **WHEN** `echarts.getInstanceByDom()` 返回 null，但元素的 `__vue__.$data` 包含 ECharts 实例
- **THEN** 系统通过 Vue 组件数据获取图表实例

### Requirement: 图表数据格式化
系统 SHALL 将提取的图表数据格式化为文本，包含 title（标题）、legend（图例数据）、xAxis（X 轴数据）、series（系列名称、类型、数据值）、color（调色板）。

#### Scenario: 格式化包含完整图表信息
- **WHEN** 图表包含标题 "销售趋势"、2 个系列、X 轴 5 个数据点
- **THEN** 输出文本包含 "title: 销售趋势"、系列名称和数据值、X 轴标签

### Requirement: 图表实例去重
系统 SHALL 对发现的 ECharts 实例进行去重，避免同一图表被重复提取。

#### Scenario: 同一图表通过两种策略被发现
- **WHEN** 同一 canvas 元素同时被 `_echarts_instance_` 策略和 canvas 策略发现
- **THEN** 该图表数据只被提取一次
