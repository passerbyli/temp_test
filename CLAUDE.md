# LLM Wiki — 项目知识库

基于 Karpathy llm-wiki 理念构建。

## 架构

```
raw/      原始数据（Excel、代码仓文档）
wiki/     Markdown 知识文章（纯 MD，任何工具可读）
scheme/   结构化索引（JSON，供 AI 工具查询）
```

### 设计原则

- **wiki/ 文件必须是纯 Markdown** — 不使用 Dataview 等 Obsidian 专用语法
- **scheme/ 提供机器可读索引** — AI 工具通过 JSON 查询，而非解析 Markdown
- **00-系统/视图可以使用 Dataview** — 这些是 Obsidian 专用导航页

### 工具兼容

| 读取方式 | 数据源 |
|----------|--------|
| Obsidian | wiki/ (Markdown) + 00-系统/ (Dataview) |
| Claude/OpenCode | scheme/ (JSON) + wiki/ (Markdown) |
| 其他 MD 阅读器 | wiki/ (纯 Markdown) |

## 数据流

```
raw/Excel → raw-to-wiki.sh → wiki/Markdown + scheme/JSON
wiki/Markdown → gen-scheme.sh → scheme/索引更新
wiki/Markdown → gen-knowledge.sh → wiki/功能地图/
wiki/ + raw/ → build-context.sh → AI 上下文文件
```

## SDD 工作流

为某个 US 生成代码时：
1. `scheme/us-index.json` 查找 US
2. `wiki/US/` 读取需求和验收标准
3. `wiki/API/` 读取接口规范
4. `wiki/功能地图/` 读取模块上下文
5. `wiki/技术知识/` 读取技术参考
6. `raw/代码仓/` 读取代码架构
7. 以上喂给 AI → 生成代码

## 脚本

| 脚本 | 用途 |
|------|------|
| `00-系统/脚本/raw-to-wiki.sh` | Excel → wiki Markdown + scheme JSON |
| `00-系统/脚本/gen-scheme.sh` | wiki → scheme JSON 索引 |
| `00-系统/脚本/gen-knowledge.sh` | 生成知识关联页 |
| `00-系统/脚本/build-context.sh` | 构建 AI 上下文 |

## 命令

| 命令 | 用途 |
|------|------|
| `/import` | 导入 Excel → wiki |
| `/gen-knowledge` | 生成知识关联页 |
| `/build-context` | 构建 AI 上下文 |
| `/test-coverage` | 检查测试覆盖 |
