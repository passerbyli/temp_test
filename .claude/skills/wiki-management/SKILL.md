---
name: wiki-management
description: Karpathy llm-wiki 知识库管理。raw→wiki→scheme 数据管线，US/API/SDD 上下文构建。
---

# LLM Wiki 管理技能

## 架构（Karpathy llm-wiki）

```
raw/      原始数据（Excel、代码仓文档）
wiki/     LLM 生成的 Markdown 知识文章
scheme/   结构化索引（JSON）
```

## 数据流

```
raw/Excel → raw-to-wiki.sh → wiki/Markdown + scheme/JSON
wiki/Markdown → gen-scheme.sh → scheme/索引更新
wiki/Markdown → gen-knowledge.sh → wiki/功能地图/
```

## 目录

- `wiki/US/` — 用户故事（按模块分目录）
- `wiki/API/` — 接口文档（按模块分目录）
- `wiki/功能地图/` — 按模块聚合 US+API
- `wiki/技术知识/` — 技术概念
- `wiki/产品演进/` — 版本时间线
- `wiki/架构决策/` — ADR
- `raw/代码仓/` — 代码架构信息

## 命令

| 命令 | 用途 |
|------|------|
| `/import` | raw → wiki |
| `/gen-knowledge` | 生成知识关联 |
| `/build-context` | AI 上下文 |
| `/test-coverage` | 覆盖检查 |

## 规范

- US frontmatter: id, title, module, status, priority, version, related_apis, test_status
- API frontmatter: id, title, module, method, path, status, related_us
- scheme JSON: us-index.json, api-index.json, module-map.json, tags.json
