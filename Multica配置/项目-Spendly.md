---
id: multica-project-spendly
title: 项目 — Spendly
type: project-config
created_at: 2026-08-14
updated_at: 2026-08-14
tags: [multica, project, spendly]
---

# 项目：Spendly

## 基本信息

| 配置项 | 值 |
|--------|-----|
| **名称** | `Spendly` |
| **负责人（Lead）** | `Spendly-Architect` |
| **状态** | `in_progress` |
| **优先级** | `high` |

## 项目标题

```
Spendly — macOS 个人消费趋势应用
```

## 项目描述

以下是写入 Multica 项目的完整描述。**项目描述会进入项目内所有智能体的执行上下文**，因此需要包含所有成员都需要知道的通用信息。

---

```text
# Spendly

## 产品概述

Spendly 是一款 macOS 原生应用，帮助用户整理银行 Excel 账单，自动解析消费流水，并通过 Dashboard 和桌面 Widget 持续展示消费趋势。

核心目标：让用户不需要每天主动记账，也能持续看到自己的消费趋势。

## 技术栈

- 平台：macOS（第一版），预留 iOS/iPadOS 扩展
- UI 框架：SwiftUI
- 数据持久化：SwiftData + CloudKit-compatible 模型
- 并发模型：Swift Concurrency（async/await, actor）
- Widget：WidgetKit
- 构建工具：Xcode 26.6+，Swift 5.0
- 测试框架：Swift Testing
- Excel 解析：第三方 Swift 库（通过 SPM 引入）
- 代码仓库：lgithub.com/ads_05/spendly.git

## 代码组织

Spendly/
├── Spendly/
│   ├── Core/
│   │   ├── Models/              ← SwiftData @Model 类
│   │   ├── Persistence/         ← Repository 和 ModelContainer
│   │   ├── Services/            ← 业务逻辑
│   │   ├── Analytics/           ← 统计分析引擎
│   │   └── Import/              ← Excel 导入管道
│   ├── Features/
│   │   ├── Dashboard/           ← 首页概览
│   │   ├── Transactions/        ← 流水管理
│   │   ├── Reports/             ← 统计报表
│   │   ├── Import/              ← 账单导入 UI
│   │   └── Settings/            ← 设置
│   └── WidgetExtension/         ← Widget 扩展
├── SpendlyTests/
├── SpendlyUITests/
└── openspec/                    ← OpenSpec 规格管理

## OpenSpec 规格

所有功能行为由 openspec/specs/ 中的规格定义。specs/ 是系统行为的唯一真相，代码必须符合 spec。

当前 specs 结构：
- core-models/     — 数据模型（Transaction, Account, Category, ImportRecord）
- excel-import/    — Excel 导入管道
- transaction-management/ — 流水管理
- dashboard/       — Dashboard 首页
- reports/         — 统计报表
- widget/          — Widget 扩展
- settings/        — 设置功能
- icloud-sync/     — CloudKit 同步（架构预留）

开发流程：每个功能变更通过 OpenSpec change 管理，先有 spec 再有代码。

## MVP 范围

### 第一版包含：
- 银行 Excel 账单导入
- 流水查看、搜索、筛选、编辑、删除
- 自动分类（默认 9 个分类）
- 日/周/月消费统计
- 消费趋势图（堆积柱状图）
- 环比比较（当前周期 vs 上一等长周期）
- 分类统计
- macOS Widget（Small/Medium/Large）
- Widget 配置
- 本地持久化
- iCloud 同步架构预留

### 第一版不包含：
- 支付宝/微信/多银行支持
- AI 自动分类
- 预算管理
- 投资资产
- 多人共享

## MVP 验收标准

完整链路必须跑通：
1. 银行导出 Excel → 拖入 App
2. 自动识别 500 条流水 → 发现重复 → 预览新增
3. 确认导入 → Dashboard 自动更新
4. 统计和趋势图更新 → Widget 自动刷新
5. 点击某一天 → 打开对应日期流水
6. 修改一笔分类 → 统计立即更新 → Widget 更新
7. 数据同步到 iCloud

## 工作规范

- 所有功能开发必须先有 OpenSpec change
- 代码提交前必须通过测试
- SwiftData 模型必须兼容 CloudKit
- 每次 commit 保持可编译可测试状态
- 不引入 MVP 范围之外的功能
```

---

## 创建步骤

在 Multica 中创建此项目：

1. 进入 **项目** → **新建项目**
2. 填写名称：`Spendly`
3. 填写描述（上面的描述代码块内容）
4. 设置负责人：`Spendly-Architect`
5. 设置状态：`in_progress`
6. 设置优先级：`high`
7. 添加资源（见下方）

## 项目资源

### Git 仓库

```
类型：Git 仓库
URL：lgithub.com/ads_05/spendly.git
默认分支：main
```

### 本地目录（可选，推荐）

如果使用 Multica Desktop，可以添加本地目录资源：

```
类型：本地目录
路径：/temp/projects/nas/Spendly
执行模式：worktree（推荐，并行执行）
```

> 使用 `worktree` 模式时，每个任务会在独立的 git worktree 中工作，多个任务可以并发执行而不互相干扰。

## 相关文档

- [[技术设计文档mac版(第一版)]] — 完整的产品/技术设计文档
- OpenSpec specs — 位于 Spendly 项目的 `openspec/specs/` 目录
- [[智能体/Spendly-Architect]] — 项目负责人
- [[小队-Spendly-Squad]] — 开发小队
