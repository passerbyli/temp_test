# Implementation Review

请检查当前实现是否符合 OpenSpec Change。

## 分析范围

请读取：

1. 当前 Change 的 proposal.md

2. 当前 Change 的 design.md

3. 当前 Change 的 specs

4. 当前 Change 的 tasks.md

5. 相关源码

6. 相关测试

7. 相关配置文件

---

## 检查目标

判断当前实现是否符合规格，而不是做一般代码审查。

重点检查：

1. proposal 中承诺的目标是否实现

2. design 中的技术方案是否落地

3. specs 中的能力是否实现

4. tasks 中的任务是否真实完成

5. 是否存在超出规格的额外实现

6. 是否存在影响兼容性的行为变化

7. 是否存在用户未要求的业务逻辑变化

---

## 输出格式

# Implementation Review Report

## 1. Summary

- Change:

- Result: PASS / WARNING / FAIL

## 2. Proposal Alignment

| Proposal Item | 实现情况 | 证据 | 结论 |

|--------------|----------|------|------|

## 3. Design Alignment

| Design Decision | 实现情况 | 证据 | 结论 |

|----------------|----------|------|------|

## 4. Spec Coverage

| Requirement | 实现情况 | 证据 | 结论 |

|-------------|----------|------|------|

## 5. Task Verification

| Task | 标记状态 | 实际状态 | 结论 |

|------|----------|----------|------|

## 6. Extra Implementation

列出代码中存在但规格未要求的能力。

## 7. Missing Implementation

列出规格要求但代码未实现的能力。

## 8. Behavior Changes

列出可能影响用户的行为变化。

## 9. Recommended Actions

明确：

- 需要补代码的项

- 需要补文档的项

- 需要补测试的项

- 可以忽略的项

## 10. Final Decision

PASS / WARNING / FAIL