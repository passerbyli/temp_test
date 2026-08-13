---
id: multica-spendly-config
title: Spendly — Multica 配置方案
type: project-config
created_at: 2026-08-14
updated_at: 2026-08-14
tags: [multica, spendly, 项目配置]
---

# Spendly — Multica 配置方案

## 概述

本文档定义 Spendly 项目在 Multica 平台中的完整配置，包括智能体（Agents）、小队（Squads）和项目（Projects）的创建参数。

## 工具链关系

```
┌─────────────────────────────────────────────┐
│  Multica        — 协调层（Who + When + Status）│
│  把 Agent 当队友，分配任务，跟踪进度           │
├─────────────────────────────────────────────┤
│  OpenSpec       — 规划层（What + Why + Scope） │
│  Spec 驱动开发，先写规格再写代码               │
├─────────────────────────────────────────────┤
│  Superpowers    — 执行层（How + Quality）      │
│  Agent 的方法论，控制写代码的质量               │
└─────────────────────────────────────────────┘
```

## 配置清单

### 智能体（3 个）

| 智能体 | 角色 | 运行时 | 文件 |
|--------|------|--------|------|
| Spendly-Architect | 架构师 / 小队队长 / 项目负责人 | OpenCode | [[智能体/Spendly-Architect]] |
| Spendly-Builder | 核心开发 | OpenCode | [[智能体/Spendly-Builder]] |
| Spendly-QA | 质量守护 | OpenCode | [[智能体/Spendly-QA]] |

### 小队（1 个）

| 小队 | Leader | 成员 | 文件 |
|------|--------|------|------|
| Spendly Dev Squad | Spendly-Architect | Architect, Builder, QA | [[小队-Spendly-Squad]] |

### 项目（1 个）

| 项目 | 负责人 | 资源 | 文件 |
|------|--------|------|------|
| Spendly | Spendly-Architect | Git: lgithub.com/ads_05/spendly.git | [[项目-Spendly]] |

## 创建顺序

```
1. 创建 3 个智能体（Architect → Builder → QA）
2. 创建小队（选 Architect 为 Leader，添加 Builder 和 QA）
3. 创建项目（选 Architect 为 Lead，关联 Git 仓库）
```

> Skills（Superpowers、OpenSpec 等）已全局安装在 OpenCode 中，Multica 连接运行时后会自动识别，无需手动添加。

## 相关文档

- [[../../01-工作与项目/项目/个人消费趋势 App/技术设计文档mac版(第一版)|技术设计文档]]
- [[Issue管理方案]] — Master Issue → Architect 自动拆分 → 子 issue 逐个交付
- [[Git分支管理策略]] — 三级分支模型 + 完整工作流
- [[工作流协调机制]] — Multica × OpenSpec × Superpowers 三方协调规则
- [[自动化-进度监控]] — 每 20 分钟检查子 issue 进度，停摆时自动提醒
- [[飞书端操作手册]] — 手机飞书驱动项目的日常操作
- OpenSpec specs 结构：见 `openspec/specs/` 目录
- Superpowers 插件：已安装到 OpenCode
