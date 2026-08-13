---
id: multica-issue-management
title: Issue 管理方案 — 从设计文档到交付的完整链路
type: project-config
created_at: 2026-08-14
updated_at: 2026-08-14
tags: [multica, issue, openspec, workflow]
---

# Issue 管理方案

## 核心原则

**你只做两件事，剩下全部由 Architect 智能体自动完成：**

```
你（人类）
  ① 创建 Master Issue（粘贴设计文档）
  ② 确认 Architect 提出的拆分方案
  ─────────────────────────────────
  之后全部自动 ↓

Architect（智能体）
  · 分析设计文档
  · 提出 change 拆分方案
  · 创建 feature 分支 + OpenSpec artifacts
  · 用 Multica CLI 创建子 issue
  · 派发任务给 Builder
  · 协调 QA 测试
  · 归档 change
  · 循环直到所有 change 完成
```

## 完整流程

```
你创建 Master Issue (in_progress)
  │
  │  Multica 触发 Architect（leader）
  ▼
Architect: 读取设计文档 → brainstorming 分析
  │
  │  在 Master Issue 评论中提出拆分方案
  ▼
你: 回复确认或调整
  │
  ▼
Architect: ┌──────────────────────────────────────────────────┐
           │  循环开始（对每个 change）                         │
           │                                                  │
           │  1. git checkout -b feature/<name>               │
           │  2. /opsx:propose <name>（创建 OpenSpec artifacts）│
           │  3. git commit artifacts                         │
           │  4. multica issue create（创建子 issue）          │
           │  5. multica issue assign（分配给小队）            │
           │  6. multica issue status in_progress             │
           │  7. 评论 @Builder 派发任务                       │
           │                                                  │
           │  子 issue 内部自动流转：                          │
           │  Builder → QA → bug-fix 循环 → 归档              │
           │                                                  │
           │  子 issue done 后 → 开始下一个 change             │
           └──────────────────────────────────────────────────┘
  │
  │  所有子 issue 完成
  ▼
Architect: Master Issue → done
           评论你："MVP 所有 change 已完成交付"
```

## 你（人类）的操作

### 操作 1：创建 Master Issue

在 Multica 中创建 issue：

```markdown
## 标题
Spendly macOS MVP — 从设计文档到完整交付

## 描述

以下是 Spendly 产品的完整技术设计文档。请分析并拆分为可独立交付的 change，按优先级逐步实现。

---

（粘贴"技术设计文档mac版(第一版)"的完整内容）

---

## 要求

1. 先分析这份设计文档，识别出合理的 change 拆分方案
2. 在评论中提出拆分方案，等待我确认
3. 确认后，逐个创建 change 和子 issue
4. 按 P0 → P1 优先级顺序执行
5. 每个 change 完成后再开始下一个
```

- **负责人**: Spendly Dev Squad
- **状态**: todo → 改为 in_progress
- **标签**: master, P0

### 操作 2：确认拆分方案

Architect 会在评论中提出类似这样的方案：

```
@你 已完成设计文档分析，建议拆分为以下 8 个 change：

1. setup-data-models（P0）— 数据模型
2. implement-excel-import（P0）— Excel 导入
3. implement-transactions（P0）— 流水管理
4. implement-dashboard（P0）— Dashboard
5. implement-reports（P1）— 报表
6. implement-widget（P1）— Widget
7. implement-settings（P1）— 设置
8. setup-icloud-sync（P1）— iCloud 同步

是否同意？如需调整请回复。
```

你回复"同意"或调整意见即可。

### 之后

**你不需要做任何事。** Architect 会自动：
- 创建 feature 分支和 OpenSpec artifacts
- 用 `multica issue create` 创建子 issue
- 派发任务给 Builder
- 协调 QA 测试
- 归档每个 change
- 循环直到全部完成

如果 Architect 需要你的决策（如技术方案选择），会在评论中 @你。

## Architect 智能体的自动化操作

### 创建子 Issue（使用 Multica CLI）

Architect 在每个 change 准备好后，使用 CLI 创建子 issue：

```bash
# 创建子 issue
multica issue create \
  --title "[Change] setup-data-models — 数据模型实现" \
  --description-stdin < /tmp/issue-desc.md \
  --parent <master-issue-id>

# 分配给小队
multica issue assign <子issue-id> --to "Spendly Dev Squad"

# 设置状态
multica issue status <子issue-id> in_progress
```

子 issue 的描述由 Architect 自动生成，包含：
- 变更概述（从 proposal.md 提取）
- OpenSpec change 路径和 feature 分支
- Artifacts 链接
- 验收标准

### 创建 OpenSpec Change（使用 /opsx:propose）

Architect 在 OpenCode 中执行：

```
/opsx:propose setup-data-models
```

或手动创建 `openspec/changes/<name>/` 下的 artifacts。

### 派发任务（使用评论 @mention）

```
@Spendly-Builder 请实现以下任务：

分支: feature/01-setup-data-models
变更: openspec/changes/01-setup-data-models/
任务: tasks.md 中的 1.1 - 1.3

请先阅读 proposal.md 和 design.md，然后按 tasks.md 逐项实现。
```

## 子 Issue 内部的自动流转

子 issue 创建后，内部的流转完全由 Multica 触发规则自动驱动：

```
Architect 评论 @Builder
  │
  │  Multica 触发 Builder
  ▼
Builder 实现 → 评论汇报
  │
  │  Multica 自动唤醒 Architect（leader）
  ▼
Architect 评估 → 评论 @QA
  │
  │  Multica 触发 QA
  ▼
QA 测试 → 评论
  ├── 通过 → Architect 归档子 issue
  └── bug → @Builder → 修复 → @QA → 循环（最多 3 轮）
```

## Issue 层级结构

```
Master Issue (in_progress → done)
  │
  ├── 子 issue #1: setup-data-models (done) ✅
  ├── 子 issue #2: implement-excel-import (in_progress) ← 当前
  ├── 子 issue #3: implement-transactions (backlog)
  ├── 子 issue #4: implement-dashboard (backlog)
  ├── 子 issue #5: implement-reports (backlog)
  ├── 子 issue #6: implement-widget (backlog)
  ├── 子 issue #7: implement-settings (backlog)
  └── 子 issue #8: setup-icloud-sync (backlog)
```

子 issue 的状态由 Architect 管理。只有当前子 issue 完成后，Architect 才创建下一个。

## 状态管理

| Issue | 谁管理 | 状态流转 |
|-------|--------|---------|
| Master Issue | Architect | in_progress → done（所有子 issue 完成后） |
| 子 issue | Architect | todo → in_progress → in_review → done |

Builder 和 QA 不修改任何 issue 状态。

## 完整时间线

```
你    创建 Master Issue，负责人 Spendly Dev Squad，状态 in_progress
      │
Architect 被触发（leader task）
  → 读取设计文档
  → brainstorming 分析
  → 评论拆分方案
      │
你    评论"同意"
      │
Architect 被触发
  → git checkout -b feature/01-setup-data-models
  → /opsx:propose setup-data-models
  → git commit
  → multica issue create（子 issue #1）
  → multica issue assign（分配给小队）
  → 评论 @Builder
      │
Builder 被触发 → 实现 → 评论
      │
Architect（自动唤醒）→ 评论 @QA
      │
QA 被触发 → 测试 → 评论"通过"
      │
Architect（自动唤醒）
  → /opsx:verify
  → /opsx:archive
  → 子 issue #1 done
      │
Architect
  → git checkout -b feature/02-implement-excel-import
  → /opsx:propose implement-excel-import
  → multica issue create（子 issue #2）
  → 评论 @Builder
      │
Builder → QA → bug-fix 循环 → 归档
      │
      ... 重复 ...
      │
Architect
  → 子 issue #8 done
  → Master Issue done
  → 评论你"MVP 所有 change 已完成"
```

## FAQ

### Q: Architect 能用 Multica CLI 创建 issue 吗？

A: 能。Architect 的运行时是 OpenCode，运行在你的 Mac 上。Multica CLI 已安装在本机，Architect 可以直接调用 `multica issue create` 等命令。

### Q: 子 issue 创建后需要我手动操作吗？

A: 不需要。Architect 创建子 issue 时会自动设置负责人（小队）和状态（in_progress），这会触发 leader（Architect 自己），然后 Architect 通过评论 @Builder 启动工作。

### Q: 我能在中途调整后续 change 的计划吗？

A: 可以。在 Master Issue 评论中告诉 Architect 你的调整意见，它会在下一次创建 change 时采纳。

### Q: 如果某个 change 完成后我想暂停怎么办？

A: 在 Master Issue 评论中告诉 Architect "暂停，等我通知再继续下一个"。
