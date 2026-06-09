# Design: reconcile-specs-with-code

## 1. 当前事实源判断

**事实源：当前代码实现**

代码实现是当前行为的事实来源：
- `src/core/processPage.ts:184-198`: 页面 status 由文本差异决定，像素差异仅作视觉参考
- `src/core/capture.ts:175`: captureByScrolling 函数等待 300ms

代码注释已明确说明这是有意的设计决策。

## 2. 代码与规格差异处理策略

**策略：同步文档到代码**

由于代码行为是期望的（有意设计决策），选择更新 spec 文档以匹配代码实现，而非修改代码。

## 3. 是否修改代码

**否**

代码行为正确，无需修改。

## 4. 是否修改主规格

**是**

需要修改以下主规格文件：
- `openspec/specs/pixel-diff/spec.md`
- `openspec/specs/text-diff/spec.md`
- `openspec/specs/screenshot-capture/spec.md`

## 5. 是否保留历史归档

**是**

不修改历史归档 Change，创建新的 reconcile Change 记录本次文档同步。

## 6. 风险与兼容性说明

### 风险
- 无功能风险（代码不变）
- 无兼容性风险
- 文档更新后更准确反映实际行为

### 兼容性
- 配置格式无变化
- CLI 命令无变化
- 输出格式无变化
