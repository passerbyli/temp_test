---
description: 使用 lhm-spec-review 一键补全归档后落后的 OpenSpec 文档
---

请使用 `skills/lhm-spec-review` 技能执行 `complete-docs`。

参数：`$ARGUMENTS`

执行要求：

1. 读取 `skills/lhm-spec-review/SKILL.md`。
2. 读取 `skills/lhm-spec-review/prompts/complete-docs.md`。
3. 如果目标 Change 还没有归档，直接在 active Change 中补全文档。
4. 如果目标 Change 已经归档，不要修改 archive，自动创建新的规范追平 Change。
5. 如果没有提供 `change`，先尝试自动识别 active Change；只有多个 active Change 且无法判断目标时才询问用户。
6. 一次性完成漂移检查、文档补全、规格缺口分析、范围审计和归档前审查。
