# Proposal: Reconcile Specs With Current Implementation

## Why

当前代码实现已经经过多轮试用、问答和调整，实际行为与历史 OpenSpec 文档存在差异。

本次 Change 的目标是基于当前真实实现同步规格文档，避免后续维护、验证和二次开发时继续依赖过期文档。

本次 Change 不修改历史归档记录。

## What Changes

### Added

- 

### Modified

- 

### Clarified

- 

### Removed / Deprecated

- 

## Capabilities

本次需要同步以下能力：

| Capability | 类型 | 当前代码状态 | 当前规格状态 | 处理方式 |
|-----------|------|--------------|--------------|----------|
|  |  |  |  |  |

## Impact

### Specs

- 

### Design

- 

### Tasks

- 

### Code

- No code changes required.

### Tests

- 

### Config

- 

## Out of Scope

- 不回改历史归档 Change
- 不引入新的业务功能
- 不重构当前实现
- 不改变当前用户已确认的行为

## Success Criteria

- 当前 specs 能准确描述当前实现
- design 能解释当前关键技术决策
- tasks 能反映真实同步工作
- verify 通过
- 可以安全 archive