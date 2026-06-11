---
name: lhm-spec-review
description: 审查 OpenSpec 项目的代码、Change、Design、Specs 和 Tasks 是否一致，并在归档后代码与文档不一致时创建规范追平 Change。
---

# lhm-spec-review

## 用途

`lhm-spec-review` 用于治理 OpenSpec 项目的规格一致性，重点解决以下问题：

- 代码已经修改，但 specs 没有同步。
- Change 已经归档，但后续通过问答继续修改了代码。
- 当前实现已经符合用户真实期望，但文档仍停留在旧设计。
- specs 描述了能力，但代码没有实现。
- 实现过程中新增了能力，但没有沉淀到 proposal、design、specs 或 tasks。

核心原则：

- 如果目标 Change 还没有归档，直接在现有 active Change 中补全文档。
- 如果目标 Change 已经归档，不要回改历史归档 Change，应创建新的 reconcile Change 追平文档。

## 归档后追平场景

当用户遇到以下情况时，优先使用一键补全文档命令：

```text
/lhm-spec-review-complete-docs
```

适用场景：

1. 当前 Change 尚未归档，但实现过程中代码和文档没有同步。
2. Change 已经归档，后续通过问答、试用和修正让代码满足了真实需求。
3. 当前代码、主 specs、归档 Change、design 或 tasks 已经不一致。

正确处理方式：

```text
OpenSpec Change
  ↓
问答 / 试用 / 修正代码
  ↓
当前实现符合用户真实期望
  ↓
/lhm-spec-review-complete-docs
  ↓
未归档：更新现有 active Change
已归档：创建新的 reconcile Change
  ↓
补全 proposal / design / specs / tasks 并完成归档前审查
  ↓
openspec verify / archive
```

不要直接修改历史归档 Change；只有已归档场景才创建新的 reconcile Change。

## 工作流

### complete-docs

一键补全归档后落后的 OpenSpec 文档。

它会按顺序完成：

- 检查代码与文档的漂移。
- 自动判断目标 Change 是否已归档。
- 未归档时直接补全现有 active Change。
- 已归档时创建新的 reconcile Change。
- 补全 proposal、design、specs delta 和 tasks。
- 分析规格缺口。
- 审计是否混入新需求。
- 给出 verify / archive 前结论。

如果用户没有提供 `change`，先自动识别 active Change；只有多个 active Change 且无法判断目标时才询问用户。

### drift-check

检查当前代码与 OpenSpec 文档是否发生规范漂移。

重点识别：

- 代码已实现但规格未记录。
- 规格已记录但代码未实现。
- 代码行为与规格描述不一致。
- design 与实现不一致。
- tasks 状态与真实实现不一致。

### archive-review

归档前审查当前 Change 是否可以安全 archive。

输出结论：

- `PASS`：可以归档。
- `WARNING`：可以归档，但存在轻微文档或风险项。
- `FAIL`：不建议归档，需要先修正。

### implementation-review

检查某个 Change 是否按 proposal、design、specs 和 tasks 完成实现。

重点不是一般代码质量，而是：

- 是否实现了规格要求。
- 是否存在多余实现。
- 是否存在遗漏实现。
- 是否存在行为偏差。

### reconcile-change

当历史 Change 已归档，但代码已经演进后，用于创建新的“规范追平 Change”。

目标：

- 不修改历史归档记录。
- 基于当前代码反向同步 specs。
- 生成新的 proposal、design、specs 和 tasks。
- 明确是否需要补代码，还是只需要补文档。

Change ID 规则：

- 如果用户提供 `change=<change-id>`，使用该 Change。
- 如果用户没有提供 `change`，自动生成新的规范追平 Change ID，不要停止询问。
- 默认优先使用 `reconcile-specs-with-code`。
- 如果名称已存在，依次尝试 `align-specs-with-current-implementation`、`sync-specs-after-iteration`、`document-actual-behavior`，再使用带序号的名称。
- 输出中必须明确最终使用的 `change-id`。

### change-audit

审计当前 Change 是否仍然合理。

重点识别：

- Change scope 是否清晰。
- 是否出现 scope creep。
- 是否出现 hidden requirements。
- 是否需要拆分新的 Change。
- 是否应该进入 reconcile 流程。

### spec-gap-analysis

分析规格缺口。

重点识别：

- 缺失的功能需求。
- 缺失的非功能需求。
- 缺失的验收标准。
- 缺失的约束条件。
- 缺失的边界场景。

## 执行前读取

执行审查前应尽量读取：

- 当前代码实现。
- `openspec/specs/`
- `openspec/changes/<change-id>/`
- `openspec/changes/archive/`
- `proposal.md`
- `design.md`
- `tasks.md`
- 相关 specs delta 文件。

如果项目结构不同，应自动查找类似目录。缺失文件必须说明，不要臆测。

## 输出要求

所有审查结果必须结构化输出，并包含：

1. 摘要
2. 证据
3. 差异项或缺口项
4. 风险评估
5. 建议动作
6. 最终结论

不得只给笼统结论。所有判断都应引用代码、specs、change 文档、测试结果或用户确认作为证据。

## 判定规则

### PASS

满足：

- 代码与 specs 基本一致。
- 无核心能力缺失。
- 无关键行为偏差。
- 文档可解释当前实现。
- tasks 状态可信。

### WARNING

满足：

- 主流程一致。
- 存在轻微文档缺失。
- 存在非核心能力未记录。
- 不影响当前 verify 或 archive，但建议补充。

### FAIL

出现以下任一情况：

- 规格要求未实现。
- 当前行为与验收标准冲突。
- 代码新增核心能力但 specs 完全未记录。
- design 与实现方向明显不一致。
- tasks 标记完成但实际未完成。
- 无法判断是否一致。

## 使用示例

```text
lhm-spec-review:complete-docs
```

不提供 `change` 时自动识别目标：

- 只有一个 active Change：直接补它。
- 多个 active Change 且无法判断：询问用户。
- 目标已归档或没有 active Change：新建 reconcile Change。

如果明确目标：

```text
lhm-spec-review:complete-docs change=<change-id>
```

## 约束

- 不要默认修改代码。
- 不要修改历史归档 Change。
- 不要伪造已完成状态。
- 不要只检查文件是否存在，要检查内容语义。
- 不要把历史归档文档当成当前事实源。
- 当前代码行为、测试结果和用户确认结果可以作为新的事实来源。
- 如果无法判断，必须标记为 `UNKNOWN` 或 `NEEDS REVIEW`。

## 推荐追平 Change 名称

```text
reconcile-specs-with-code
align-specs-with-current-implementation
sync-specs-after-iteration
document-actual-behavior
```

## 最终原则

Archive 不是“代码写完了”，而是：

> 代码、规格、设计、验收标准已经达成一致，并且可以作为后续维护依据。
