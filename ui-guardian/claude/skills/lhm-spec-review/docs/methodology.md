# 推荐流程

## 核心原则

只使用一个入口：

```text
lhm-spec-review:complete-docs
```

配置了 command 时使用：

```text
/lhm-spec-review-complete-docs
```

该流程会自动判断目标 Change 的状态：

- **未归档**：直接补全现有 active Change。
- **已归档**：不修改历史归档 Change，创建新的 reconcile Change。

---

## 日常开发

推荐流程：

```text
New Change
  ↓
Proposal / Design / Specs / Tasks
  ↓
Apply / 实现
  ↓
lhm-spec-review:complete-docs
  ↓
openspec verify
  ↓
openspec archive
```

在 Change 未归档时，`complete-docs` 会直接补全当前 active Change。

---

## 归档后发现效果不满意

如果使用 OpenSpec 完成并归档了 Change，但最终效果不是用户想要的，后续又通过一步一步问答把代码改到满意，此时不要修改已经归档的历史 Change。

正确流程：

```text
Archived Change
  ↓
问答 / 试用 / 修正代码
  ↓
当前实现符合用户真实期望
  ↓
lhm-spec-review:complete-docs
  ↓
创建新的 reconcile Change
  ↓
openspec verify
  ↓
openspec archive
```

原则：

- 历史归档 Change 是历史记录，不作为当前真实实现的唯一事实源。
- 当前代码行为、测试结果和用户确认结果可以作为新的事实来源。
- 归档后只通过新的 reconcile Change 追平 specs，不回改 archive。
- 如果追平过程中发现新需求，应拆分新的 Change，不要混进文档追平 Change。

---

## 目标 Change 选择

执行 `complete-docs` 时：

- 如果用户指定 `change=<change-id>`，先判断该 Change 是 active 还是 archived。
- 如果用户没有指定 Change，优先自动识别 active Change。
- 只有多个 active Change 且无法判断目标时，才询问用户。
- 没有 active Change 或目标已归档时，新建 reconcile Change。

避免：

代码越来越正确，文档越来越错误。
