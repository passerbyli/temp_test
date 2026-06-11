# Archive Review

请执行归档前审查。

## 背景

当前准备归档一个 OpenSpec Change。

归档前需要确认：

- 当前代码已经实现规格要求
- 当前规格可以准确描述代码行为
- tasks 状态可信
- design 没有明显过期
- 不存在会影响后续维护的规范漂移

---

## 分析范围

请分析：

1. 当前 Change 的 proposal
2. 当前 Change 的 design
3. 当前 Change 的 specs
4. 当前 Change 的 tasks
5. 当前代码实现
6. 主规格 `openspec/specs/`
7. 相关测试或验证结果

---

## 审查问题

请回答：

1. 这个 Change 是否已经完成？
2. 是否还有未实现的规格要求？
3. 是否有代码实现超出了规格但未记录？
4. 是否存在行为与验收标准不一致？
5. 是否存在 design 与实现不一致？
6. tasks 是否可以全部标记完成？
7. 是否建议 archive？
8. 如果不建议 archive，需要先做什么？

---

## 输出格式

# Archive Review

## 1. Summary

- Change:
- Overall Decision: PASS / WARNING / FAIL
- Archive Recommendation: YES / NO / YES_WITH_NOTES

## 2. Completion Check

| Item | 状态 | 说明 |
|------|------|------|

## 3. Blocking Issues

| ID | 问题 | 严重级别 | 需要处理方式 |
|----|------|----------|--------------|

## 4. Non-blocking Issues

| ID | 问题 | 建议 |
|----|------|------|

## 5. Required Actions Before Archive

列出归档前必须完成的动作。

如果没有，写：

```text
None
```

## 6. Suggested Actions After Archive

列出归档后可选优化项。

## 7. Final Decision

只能输出：

* PASS：可以归档
* WARNING：可以归档，但有注意事项
* FAIL：不建议归档