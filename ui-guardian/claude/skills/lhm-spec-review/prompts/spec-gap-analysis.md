# Spec Gap Analysis

请分析当前 OpenSpec 规格缺口。

## 背景

当前代码、用户期望或已归档 Change 可能已经包含一些规格没有完整描述的行为。需要识别 specs 中缺少的功能需求、非功能需求、验收标准、约束和边界场景。

---

## 分析范围

请读取并分析：

1. 当前代码实现
2. `openspec/specs/`
3. 当前 active Change
4. 相关 archived Change
5. `proposal.md`
6. `design.md`
7. `tasks.md`
8. 相关测试或验证结果

如果部分文件不存在，请说明缺失情况，不要臆测。

---

## 检查目标

识别以下规格缺口：

1. 缺失的功能需求
2. 缺失的非功能需求
3. 缺失的验收标准
4. 缺失的设计约束
5. 缺失的边界场景
6. 当前实现中已经存在但未沉淀为 specs 的能力

---

## 输出格式

# Spec Gap Analysis Report

## 1. Summary

- Project:
- Change:
- Overall Status: PASS / WARNING / FAIL

## 2. Missing Functional Requirements

| ID | 能力 | 当前证据 | 应补充位置 | 建议 Requirement |
|----|------|----------|------------|------------------|

## 3. Missing Non-Functional Requirements

| ID | 类型 | 缺口 | 风险 | 建议 |
|----|------|------|------|------|

类型包括：

- 性能
- 安全
- 并发
- 可维护性
- 可观测性
- 兼容性

## 4. Missing Acceptance Criteria

| Requirement | 当前描述 | 缺失场景 | 建议验收标准 |
|-------------|----------|----------|--------------|

## 5. Missing Constraints

| Constraint Area | 当前缺口 | 影响 | 建议 |
|-----------------|----------|------|------|

## 6. Missing Edge Cases

| Edge Case | 当前行为 | Spec 状态 | 建议 |
|-----------|----------|-----------|------|

## 7. Recommended Updates

明确：

- 需要补充哪些 specs
- 是否需要补充 design
- 是否需要补充 tasks
- 是否需要创建新 Change 或 reconcile Change

## 8. Final Decision

只能输出：

- PASS：规格缺口很小，不影响当前流程
- WARNING：存在需要补充的规格，但不阻塞当前主流程
- FAIL：规格缺口会影响 verify、archive 或后续维护
