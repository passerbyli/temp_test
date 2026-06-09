# Proposal: reconcile-specs-with-code

## Why

在执行 spec-review drift-check 时发现，当前代码实现与主规格文档存在两处行为漂移：

1. **像素/文本判定逻辑不一致**（HIGH）：pixel-diff spec 描述 `DiffResult.passed 按 diffPercent < threshold 判定`，但代码实际按**文本差异**判定页面 status。这是一个有意的设计决策（processPage.ts:184-185 注释说明），但 spec 未同步更新。

2. **滚动等待时间不一致**（LOW）：screenshot-capture spec 描述滚动分段截图"每个滚动位置等待 200ms"，但 `captureByScrolling` 函数实际等待 300ms。

这些漂移不影响功能正确性，但会影响文档可信度和新人理解。

## What Changes

### 修改能力
- **pixel-diff spec**: 新增 "像素差异与页面状态的关系（设计决策）" Requirement，明确说明像素差异仅作视觉参考，页面 status 由文本差异决定
- **text-diff spec**: 更新 "通过/失败由文本差异判定" Requirement，补充设计决策说明和新增 Scenario
- **screenshot-capture spec**: 更新滚动等待时间从 200ms 到 300ms，补充说明原因

### 无新增能力
### 无废弃能力
### 无行为变化（代码不变）

## Capabilities

本次 Change 涉及以下能力的文档同步：

1. 像素对比 - DiffResult.passed 与页面 status 的关系
2. 文本对比 - 页面 status 的判定依据
3. 滚动分段截图 - 等待时间参数

## Impact

- **specs**: 修改 3 个 spec 文件
- **design**: 无变更
- **tasks**: 文档同步任务
- **code**: 无代码变更
- **tests**: 无变更
- **config**: 无变更
- **CLI**: 无变更
- **docs**: 无变更
