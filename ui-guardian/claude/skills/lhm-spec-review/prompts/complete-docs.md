# Complete Docs

请执行一键补全文档流程。

## 目标

当已归档 Change 经过后续问答、试用和修正后，当前代码已经满足真实需求，但 OpenSpec 文档没有同步时，自动完成规范追平和归档前检查。

用户只需要触发一次本流程，不需要手动串联多个命令。

---

## Change 选择规则

如果用户提供 `change=<change-id>`：

1. 如果 `openspec/changes/<change-id>/` 存在，说明它是 active Change，直接在这个 Change 中补全文档。
2. 如果 `<change-id>` 只存在于 `openspec/changes/archive/`，说明它已经归档，不要修改 archive，自动创建新的规范追平 Change。
3. 如果 active 和 archive 中都找不到该 Change，先说明将创建新的 active Change：`openspec/changes/<change-id>/`。

如果用户没有提供 `change`：

1. 先检查 `openspec/changes/` 下的 active changes。
2. 如果只有一个 active Change，直接在这个 active Change 中补全文档。
3. 如果有多个 active Change，只有在无法从上下文判断目标时才询问用户；如果能根据代码变更、用户描述或最近修改判断目标，则直接选择并说明原因。
4. 如果没有 active Change，或判断目标 Change 已经归档，自动创建新的规范追平 Change。

创建新的规范追平 Change 时：

1. 优先使用 `reconcile-specs-with-code`。
2. 如果已存在，依次尝试：
   - `align-specs-with-current-implementation`
   - `sync-specs-after-iteration`
   - `document-actual-behavior`
3. 如果以上名称都已存在，使用带序号的名称，例如 `reconcile-specs-with-code-2`。
4. 输出中必须明确最终使用的 `change-id`，并说明是“更新 active Change”还是“新建 reconcile Change”。

不要因为用户没有提供 `change` 而停止执行。只有多个 active Change 且无法判断目标时才询问。

---

## 执行步骤

### 1. Drift Check

读取并遵循 `prompts/drift-check.md`。

目标：

- 找出当前代码与 specs、active changes、archived changes 的不一致。
- 判断哪些内容是代码领先、文档落后。
- 输出证据。

### 2. Reconcile Change

读取并遵循 `prompts/reconcile-change.md`。

目标：

- active Change 未归档时，直接补全该 Change。
- 目标 Change 已归档时，创建新的规范追平 Change。
- 不修改历史归档 Change。
- 基于当前代码、测试结果和用户确认结果生成 proposal、design、specs delta 和 tasks。

### 3. Spec Gap Analysis

读取并遵循 `prompts/spec-gap-analysis.md`。

目标：

- 检查追平后的 specs 是否仍缺少功能需求、非功能需求、验收标准、约束条件和边界场景。
- 如果有缺口，补充到本次规范追平 Change 中。

### 4. Change Audit

读取并遵循 `prompts/change-audit.md`。

目标：

- 检查本次规范追平 Change 是否只是在同步当前事实。
- 如果混入新的业务需求，标记为需要拆分新 Change。

### 5. Archive Review

读取并遵循 `prompts/archive-review.md`。

目标：

- 判断本次规范追平 Change 是否可以继续 verify 和 archive。
- 输出 PASS / WARNING / FAIL。

---

## 输出格式

最终输出必须包含：

1. 使用的 `change-id`
2. 漂移摘要
3. 已创建或建议创建的文件
4. specs 缺口补全结果
5. 范围审计结果
6. 归档前结论：PASS / WARNING / FAIL
7. 下一步命令建议，例如：
   - `openspec verify <change-id>`
   - `openspec archive <change-id>`

如果因为缺少上下文无法安全写入文件，仍然要输出完整的建议内容和需要用户确认的阻塞点。
