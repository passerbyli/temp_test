# lhm-spec-review

本 Skill 提供 OpenSpec 项目的规范审查工作流。

## 推荐动作

- `complete-docs`：一键完成漂移检查、规范追平、规格缺口分析、范围审计和归档前审查。

## 执行要求

调用本 Skill 时：

1. 读取当前代码实现。
2. 读取 `openspec/specs/`。
3. 读取 active changes。
4. 读取 archived changes。
5. 输出结构化审查结果。

不要假设实现状态。必须基于实际代码、OpenSpec 文档、测试结果或用户确认进行判断。

如果 Change 还没有归档，使用 `lhm-spec-review:complete-docs` 直接在现有 active Change 中补全文档。

如果 Change 已经归档，使用 `lhm-spec-review:complete-docs` 创建新的 reconcile Change，不要修改历史归档 Change。
