# Reconcile Change

请创建一个新的规范追平 Change。

## 场景

当前项目已经完成并归档，但后续经过多轮试用、问答、修正，当前代码已经与历史 OpenSpec 文档不一致。

目标不是修改历史归档记录，而是创建新的 Change，用于让当前 specs 与当前代码实现重新保持一致。

---

## 分析范围

请读取：

1. 当前代码实现
2. `openspec/specs/`
3. `openspec/changes/archive/`
4. 最近相关 Change
5. 当前测试或运行结果
6. package.json / 配置文件 / CLI 入口等辅助文件

---

## 工作要求

请按以下步骤执行：

1. 先输出差异分析报告
2. 判断是“代码落后”还是“文档落后”
3. 如果代码已经符合当前用户期望，则只同步文档
4. 如果代码仍有偏差，则生成补代码任务
5. 确定或创建规范追平 Change
6. 输出 proposal/design/specs/tasks
7. 不修改历史归档 Change

---

## Change ID 规则

如果用户提供 `change=<change-id>`：

1. 使用该 Change 作为规范追平 Change。
2. 如果目录不存在，先说明将创建 `openspec/changes/<change-id>/`。
3. 如果目录已存在，先读取现有内容并在其基础上补全，不要覆盖用户已有内容。

如果用户没有提供 `change`：

1. 自动生成新的规范追平 Change ID。
2. 优先使用 `reconcile-specs-with-code`。
3. 如果已存在，依次尝试：
   - `align-specs-with-current-implementation`
   - `sync-specs-after-iteration`
   - `document-actual-behavior`
4. 如果以上名称都已存在，使用带序号的名称，例如：
   - `reconcile-specs-with-code-2`
   - `reconcile-specs-with-code-3`
5. 创建或建议创建目录 `openspec/changes/<generated-change-id>/`。
6. 输出结论中必须明确写出最终使用的 `change-id`。

不要因为用户没有提供 `change` 就停止执行；应自动生成并继续。

---

## 新 Change 建议名称

优先使用：

```text
reconcile-specs-with-code
```

如果已存在，可使用：
```
align-specs-with-current-implementation
```

## proposal 要求

proposal.md 必须包含：

### Why

说明为什么需要本次规范追平。

### What Changes

列出：

* 新增能力
* 修改能力
* 补录能力
* 废弃能力
* 行为变化

### Capabilities

列出需要同步到 specs 的能力。

### Impact

说明影响范围：

* specs
* design
* tasks
* code
* tests
* config
* CLI
* docs

⸻

## design 要求

design.md 必须包含：

1. 当前事实源判断
2. 代码与规格差异处理策略
3. 是否修改代码
4. 是否修改主规格
5. 是否保留历史归档
6. 风险与兼容性说明

⸻

## specs 要求

specs delta 必须清晰区分：

* ADDED
* MODIFIED
* REMOVED
* CLARIFIED

每个 requirement 必须有验收场景。

⸻

## tasks 要求

tasks.md 必须区分：

* 文档同步任务
* 代码修正任务
* 测试补充任务
* 可选清理任务

如果无需修改代码，必须明确写：
```
No code changes required.
```

## 输出结论

最后必须说明：

1. 是否需要修改代码
2. 是否只需要同步文档
3. 是否可以继续 verify
4. 是否可以 archive
