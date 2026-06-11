# Change Audit

请审计当前 OpenSpec Change 是否仍然合理。

## 背景

当前 Change 可能已经经历多轮实现、试用、问答和修正。需要判断它是否仍然保持原始范围，是否出现隐藏需求或范围蔓延，以及是否应该拆分新的 Change。

---

## 分析范围

请读取并分析：

1. 当前 Change 的 `proposal.md`
2. 当前 Change 的 `design.md`
3. 当前 Change 的 `tasks.md`
4. 当前 Change 的 specs delta
5. 当前代码实现
6. 当前用户确认过的实际行为
7. `openspec/specs/` 中相关主规格

如果部分文件不存在，请说明缺失情况，不要臆测。

---

## 审查问题

请回答：

1. Change Scope 是否仍然清晰？
2. 是否出现原 proposal 没有覆盖的新需求？
3. 是否出现 Scope Creep？
4. 是否出现 Hidden Requirements？
5. design 是否已经偏离当前实现？
6. specs 是否足以描述当前实现？
7. 是否应该继续当前 Change、拆分新 Change，还是创建 reconcile Change？

---

## 输出格式

# Change Audit Report

## 1. Summary

- Change:
- Overall Status: PASS / WARNING / FAIL
- Recommendation: Continue / Split Change / Create New Change / Create Reconciliation Change / Archive

## 2. Scope Definition

| Scope Item | 文档描述 | 当前实现 | 结论 | 证据 |
|------------|----------|----------|------|------|

## 3. Scope Creep

| ID | 新增范围 | 来源 | 影响 | 建议 |
|----|----------|------|------|------|

## 4. Hidden Requirements

| ID | 隐藏需求 | 触发证据 | 是否需要规格化 | 建议 |
|----|----------|----------|----------------|------|

## 5. Design Changes

| Design Area | 原设计 | 当前实现 | 是否偏离 | 建议 |
|-------------|--------|----------|----------|------|

## 6. Spec Drift

| Requirement | Spec 状态 | Code 状态 | 风险 | 建议 |
|-------------|-----------|-----------|------|------|

## 7. Recommended Actions

明确：

- 是否继续当前 Change
- 是否拆分新的 Change
- 是否创建 reconcile Change
- 是否需要更新 specs / design / tasks
- 是否允许继续 verify 或 archive

## 8. Final Decision

只能输出：

- PASS：Change 范围仍然健康，可以继续
- WARNING：存在轻微范围或文档问题，建议补充后继续
- FAIL：当前 Change 已经不适合继续，需要拆分或创建 reconcile Change
