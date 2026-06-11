# Spec Drift Check

请执行规范漂移检查。

## 分析范围

请读取并分析：

1. 当前代码实现

2. 当前 OpenSpec Change

3. `openspec/specs/`

4. `openspec/changes/archive/` 中相关历史 Change

5. `proposal.md`

6. `design.md`

7. `tasks.md`

8. specs delta 文件

如果部分文件不存在，请说明缺失情况，不要臆测。

---

## 检查目标

识别当前代码与规格文档之间是否存在漂移。

重点检查：

1. 当前代码已经实现，但 specs 没有记录的能力

2. specs 中描述了，但代码没有实现的能力

3. 当前实现行为与规格描述不一致的地方

4. design 中的技术决策是否仍然符合当前实现

5. tasks 中标记完成的任务是否真实完成

6. 是否存在历史归档 Change 与当前主规格冲突

7. 是否需要新增 reconcile Change

---

## 输出格式

请按以下结构输出：

# Spec Drift Report

## 1. Summary

- Change:

- Review Time:

- Review Scope:

- Overall Status: PASS / WARNING / FAIL

## 2. Drift Items

| ID | 类型 | 严重级别 | 描述 | 证据 | 建议 |

|----|------|----------|------|------|------|

类型包括：

- CODE_NOT_IN_SPEC

- SPEC_NOT_IN_CODE

- BEHAVIOR_MISMATCH

- DESIGN_MISMATCH

- TASK_STATUS_MISMATCH

- ARCHIVE_CONFLICT

- UNKNOWN

严重级别包括：

- LOW

- MEDIUM

- HIGH

- BLOCKER

## 3. Capability Coverage

| Capability | Spec 状态 | Code 状态 | 是否一致 | 说明 |

|-----------|-----------|-----------|----------|------|

## 4. Design Consistency

| Decision | Design 描述 | 当前实现 | 结论 |

|----------|-------------|----------|------|

## 5. Task Consistency

| Task | 文档状态 | 实际状态 | 结论 |

|------|----------|----------|------|

## 6. Risk Assessment

说明当前漂移带来的风险。

## 7. Recommended Actions

明确建议：

- 是否修改代码

- 是否修改 specs

- 是否创建新 Change

- 是否允许继续 verify

- 是否允许 archive

## 8. Final Decision

结论只能是：

- PASS

- WARNING

- FAIL

并说明原因。