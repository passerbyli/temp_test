---
id: multica-git-branching
title: Spendly — Git 分支管理策略
type: project-config
created_at: 2026-08-14
updated_at: 2026-08-14
tags: [multica, git, branching, spendly]
---

# Git 分支管理策略

## 核心原则

```
main 分支 = 已归档的真相（代码 + specs 始终一致）
feature 分支 = 正在进行的 change（specs + 代码同步演进）
task 分支 = Agent 的单次执行（Multica worktree 自动生成）
```

**一条铁律：main 分支永远是可构建、可测试、可运行的。没有任何未完成的 change 直接提交到 main。**

## 三级分支模型

```
main ─────────────────────────────────────────── 稳定主分支
  │
  ├── feature/01-setup-data-models ───────────── OpenSpec change 级
  │     ├── agent/Spendly-Builder/task-101 ───── Multica task 级
  │     ├── agent/Spendly-Builder/task-102
  │     └── agent/Spendly-QA/task-201
  │
  ├── feature/02-implement-excel-import ──────── OpenSpec change 级
  │     ├── agent/Spendly-Builder/task-103
  │     └── agent/Spendly-QA/task-202
  │
  └── feature/03-implement-transactions ──────── ...
```

### 第一级：main（稳定主分支）

| 属性 | 说明 |
|------|------|
| **来源** | 项目初始化时的默认分支 |
| **内容** | 已归档的代码 + 已归档的 specs |
| **保护** | 不允许直接 commit，只允许从 feature 分支 merge |
| **状态** | 永远可构建、可测试、可运行 |

main 分支上的 `openspec/specs/` 反映的是**系统行为的完整真相**。每次 /opsx:archive 后，delta specs 合入 main 的 specs/，同时代码也合入 main。

### 第二级：feature/*（Change 级分支）

| 属性 | 说明 |
|------|------|
| **命名** | `feature/<change-name>`（与 OpenSpec change 名称一致） |
| **来源** | 从 main 创建 |
| **内容** | 该 change 的 specs delta + 实现代码 + 测试 |
| **生命周期** | change 开始时创建 → archive 时合并到 main → 删除 |

分支命名示例：
```
feature/01-setup-data-models
feature/02-implement-excel-import
feature/03-implement-transactions
feature/04-implement-dashboard
feature/05-implement-reports
feature/06-implement-widget
feature/07-implement-settings
feature/08-setup-icloud-sync
```

### 第三级：agent/*（Task 级分支）

| 属性 | 说明 |
|------|------|
| **命名** | `agent/<agent-name>/<task-id>`（Multica worktree 自动生成） |
| **来源** | 从 feature 分支创建（需配置） |
| **内容** | 单个任务的代码变更 |
| **生命周期** | task 开始时创建 → review 后合并到 feature 分支 → 删除 |

这些分支由 **Multica 的 worktree 模式**自动管理，Agent 不需要手动创建。

## 完整工作流

### 流程图

```
  main
   │
   │ git checkout -b feature/01-setup-data-models
   │
   ├─── feature/01-setup-data-models
   │      │
   │      │  Architect: 提交 OpenSpec artifacts
   │      │  git commit: "spec: 初始化数据模型规格"
   │      │
   │      │  ═══ 分配 issue 给 Builder ═══
   │      │
   │      ├─── agent/Spendly-Builder/task-101
   │      │      │ Builder: 实现 Transaction 模型
   │      │      │ git commit: "feat(models): 实现 Transaction @Model"
   │      │      └──→ 合并回 feature 分支
   │      │
   │      ├─── agent/Spendly-Builder/task-102
   │      │      │ Builder: 实现 Account 模型
   │      │      │ git commit: "feat(models): 实现 Account @Model"
   │      │      └──→ 合并回 feature 分支
   │      │
   │      │  ═══ 分配 issue 给 QA ═══
   │      │
   │      ├─── agent/Spendly-QA/task-201
   │      │      │ QA: 补充边界测试
   │      │      │ git commit: "test(models): 添加数据模型边界测试"
   │      │      └──→ 合并回 feature 分支
   │      │
   │      │  Architect: code review ✓
   │      │  Architect: /opsx:verify ✓
   │      │
   │  git merge feature/01-setup-data-models
   │  /opsx:archive
   │
   ├─── main（归档后）
   │
   │ git checkout -b feature/02-implement-excel-import
   │
   └─── ...
```

### 步骤详解

#### Phase 1：创建 Change 分支（Architect 操作）

```bash
# 1. 确保 main 是最新的
git checkout main
git pull origin main

# 2. 创建 feature 分支
git checkout -b feature/01-setup-data-models

# 3. 使用 OpenSpec 创建 change
#    在 AI chat 中执行：/opsx:propose setup-data-models
#    或手动创建 openspec/changes/01-setup-data-models/ 目录

# 4. 提交 OpenSpec artifacts
git add openspec/changes/01-setup-data-models/
git commit -m "spec: 创建 setup-data-models 变更计划

- proposal.md: 数据模型设计意图
- specs/: Transaction/Account/Category/ImportRecord 规格
- design.md: SwiftData + CloudKit-compatible 技术方案
- tasks.md: 实现任务清单"
```

#### Phase 2：分配任务（Architect 操作）

在 Multica 中：
1. 创建 Issue，关联到 `01-setup-data-models` change
2. 分配给小队 `Spendly Dev Squad`
3. Leader（Architect）接单后，派发给 Builder

**关键：在派发时告知 Builder 基于哪个分支工作**

评论示例：
```
@Spendly-Builder 请实现以下任务：

**分支**: feature/01-setup-data-models
**变更**: openspec/changes/01-setup-data-models/
**任务**: tasks.md 中的 1.1 - 1.3

请先切换到 feature/01-setup-data-models 分支再开始工作。
```

#### Phase 3：Builder 执行（Multica worktree 自动管理）

Multica 的 worktree 模式会自动：
1. 基于 feature 分支创建 worktree：`agent/Spendly-Builder/<task-id>`
2. Builder 在隔离的 worktree 中工作
3. 工作完成后，自动提交到 worktree 分支

**如果 Multica 未配置 worktree 模式**，Builder 需要手动：
```bash
# 确保基于正确的 feature 分支
git checkout feature/01-setup-data-models
git pull origin feature/01-setup-data-models

# 创建 task 分支
git checkout -b agent/Spendly-Builder/task-101

# ... 实现代码 ...

git add .
git commit -m "feat(models): 实现 Transaction @Model"
```

#### Phase 4：Architect Review + 合并

```bash
# 1. 查看 Builder 的变更
git log feature/01-setup-data-models..agent/Spendly-Builder/task-101
git diff feature/01-setup-data-models..agent/Spendly-Builder/task-101

# 2. Review 通过后，合并到 feature 分支
git checkout feature/01-setup-data-models
git merge agent/Spendly-Builder/task-101 --no-ff
# --no-ff 保留合并记录，方便追溯

# 3. 删除已合并的 task 分支
git branch -d agent/Spendly-Builder/task-101
```

#### Phase 5：QA 验证

```bash
# QA 基于 feature 分支工作
git checkout feature/01-setup-data-models
git checkout -b agent/Spendly-QA/task-201

# ... 补充测试 ...

git commit -m "test(models): 添加数据模型边界测试"

# Architect review 后合并
git checkout feature/01-setup-data-models
git merge agent/Spendly-QA/task-201 --no-ff
git branch -d agent/Spendly-QA/task-201
```

#### Phase 6：归档（Architect 操作）

```bash
# 1. 在 feature 分支上运行 /opsx:verify
# 确认所有 specs 要求都已实现

# 2. 合并到 main
git checkout main
git merge feature/01-setup-data-models --no-ff
git push origin main

# 3. 在 OpenSpec 中归档
# /opsx:archive
# delta specs 合入 openspec/specs/

# 4. 删除 feature 分支
git branch -d feature/01-setup-data-models
git push origin --delete feature/01-setup-data-models  # 如果已推送
```

## Multica 项目资源配置

为了支持上述分支策略，Multica 项目的资源配置建议：

### 方案 A：本地目录 + worktree 模式（推荐）

```
资源类型：本地目录
路径：/temp/projects/nas/Spendly
执行模式：worktree
```

**优点：**
- Multica 自动管理 worktree 分支
- 多个 Agent 可以并行工作在不同 task 分支上
- 不会互相干扰

**需要注意：**
- Agent 拿到 worktree 后，需要先 checkout 到正确的 feature 分支
- 在 Agent Instructions 中需要明确说明这一点

### 方案 B：本地目录 + in_place 模式（简单）

```
资源类型：本地目录
路径：/temp/projects/nas/Spendly
执行模式：in_place
```

**优点：**
- 更简单，Agent 直接在目录中工作
- 不需要管理 worktree

**缺点：**
- 同时只能有一个 Agent 工作
- 需要手动管理分支切换

## 分支保护规则

| 规则 | main | feature/* | agent/* |
|------|------|-----------|---------|
| 直接 commit | ❌ 禁止 | ✅ Architect 可以 | ✅ Agent 可以 |
| force push | ❌ 禁止 | ❌ 禁止 | ⚠️ 仅限回滚 |
| 删除 | ❌ 永不 | ✅ 归档后 | ✅ 合并后 |
| 合并方向 | ← feature | ← agent | （源头） |

## 紧急修复（Hotfix）

如果 main 分支上发现紧急 bug：

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/fix-import-crash

# 2. 修复
# ... 编码 ...
git commit -m "fix(import): 修复空文件导入导致的崩溃"

# 3. 合并回 main
git checkout main
git merge hotfix/fix-import-crash --no-ff
git branch -d hotfix/fix-import-crash

# 4. 同步到正在进行的 feature 分支（如果有）
git checkout feature/02-implement-excel-import
git merge main
```

## 并行开发时的分支管理

当多个 change 同时进行时：

```
main ───────────────────────────────────
  │           │           │
  ├── feature/01 ── (已完成，等待归档)
  │
  ├── feature/02 ── (Builder 正在实现)
  │     ├── agent/Builder/task-103
  │     └── agent/Builder/task-104
  │
  └── feature/03 ── (Architect 正在写 specs)
```

**规则：**
- 每个 feature 分支独立，不互相依赖
- 如果两个 feature 修改了相同文件，合并到 main 时需要解决冲突
- Architect 负责在归档前检查冲突
- 建议同时进行的 change 不超过 2-3 个

## Commit Message 规范

```
<type>(<scope>): <描述>

[可选正文]

[可选 footer]
```

### Type

| Type | 用途 | 示例 |
|------|------|------|
| `spec` | OpenSpec 规格变更 | `spec: 添加 Transaction 模型规格` |
| `feat` | 新功能 | `feat(models): 实现 Transaction @Model` |
| `fix` | 修复 | `fix(import): 修复金额解析精度丢失` |
| `test` | 测试 | `test(models): 添加 Transaction 边界测试` |
| `refactor` | 重构 | `refactor(analytics): 提取公共统计逻辑` |
| `chore` | 工程任务 | `chore: 更新 .gitignore` |

### Scope

| Scope | 范围 |
|-------|------|
| `models` | SwiftData 模型 |
| `import` | Excel 导入管道 |
| `dashboard` | Dashboard 视图 |
| `transactions` | 流水管理 |
| `reports` | 统计报表 |
| `widget` | Widget 扩展 |
| `settings` | 设置 |
| `analytics` | 统计分析引擎 |
| `ui` | 通用 UI 组件 |

## .gitignore 补充

在现有 `.gitignore` 基础上，建议添加：

```gitignore
# Multica
.multica/

# OpenSpec（如不希望 specs 进入版本控制可忽略，但建议保留）
# openspec/changes/archive/  # 可选：忽略归档的 changes

# Worktree 目录（如果使用手动 worktree）
.worktrees/
```

> **建议：** `openspec/` 目录应该进入版本控制。specs 是系统行为的真相，应该和代码一起演进。
