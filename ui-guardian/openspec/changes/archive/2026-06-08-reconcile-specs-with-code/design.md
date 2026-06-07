## Context

UI Guardian 是一个前端页面一致性验证工具，通过截图对比和文本对比检测两个环境间的差异。项目在 2026-06-05 完成 MVP 归档后，经过多轮实际使用进行了大量优化：新增了文本对比、ECharts 提取、差异标注等核心能力；配置模型从共享配置演进为 per-side 独立配置；通过/失败判定标准从像素差异改为文本差异；截图尺寸处理从报错改为裁剪。

当前 7 个主规范文件与代码存在显著偏差，另有 2 个规范文件（auth-module、viewport-execution）仅存在于归档中未同步到主规范目录。

## Goals / Non-Goals

**Goals:**
- 使主规范目录 `openspec/specs/` 完整覆盖当前代码的所有能力
- 修正规范中与代码行为不一致的描述
- 补充 3 个新增能力的规范（text-diff、echarts-extraction、per-side-config）
- 补充 2 个缺失的规范文件（auth-module、viewport-execution）
- 生成 tasks 清单，明确哪些需要补代码、哪些只需补文档

**Non-Goals:**
- 不修改任何代码实现（纯文档同步）
- 不修改已归档的历史 change 记录
- 不引入新的架构或功能

## Decisions

### D1: 规范文件采用 delta 格式 vs 全量替换

**决定**: 对修改的能力使用全量替换（MODIFIED），对新增的能力使用 ADDED。

**理由**: 由于几乎所有能力都有不同程度的变更，使用 MODIFIED + 全量内容替换比增量 delta 更清晰。每个 spec 文件将包含该能力的完整最新行为描述。

**替代方案**: 纯 delta（只写变更部分）—— 会导致规范碎片化，新读者需要同时读取归档和当前规范才能理解完整行为。

### D2: 文本对比作为核心判定标准

**决定**: 在 pixel-diff 规范中明确区分 `DiffResult.passed`（像素级）和 `PageResult.status`（文本级）两个判定维度。

**理由**: 当前代码中 pixel-diff 的 `passed` 字段仍按阈值判定，但页面最终状态由文本差异决定。规范需要同时描述这两个层面，避免混淆。

### D3: 区域截图回退策略

**决定**: 在 screenshot-capture 规范中将区域截图的"元素未找到"行为从抛出 CaptureError 改为回退到全页截图。

**理由**: 实际使用中，不同环境的 DOM 结构可能略有差异，严格的错误终止会影响测试流程。回退策略更实用。

### D4: 异常收集仅内存不落盘

**决定**: 在 anomaly-collector 规范中移除归档到文件的描述，仅保留内存收集行为。

**理由**: 当前代码未实现文件归档，异常数据通过 PageResult 和 HTML 报告展示，无需额外的 JSON 文件。

### D5: 三级配置合并模型

**决定**: 在 config-model 规范中描述 side → pagePair → global 三级合并，替代原有的 pagePair → global 两级模型。

**理由**: per-side 配置是实际使用中的刚需（baseline 和 candidate 的 DOM 结构可能不同），三级合并在保持向后兼容的同时提供了足够的灵活性。

## Risks / Trade-offs

- **[规范膨胀]** → 9 个 spec 文件 + 3 个新增 = 12 个文件。通过保持每个 spec 文件聚焦单一能力来控制复杂度。
- **[历史规范丢失]** → 归档中的规范保留不动，主规范完全反映当前代码。两套规范的差异由归档的 proposal/design 记录。
- **[后续代码变更]** → 规范与代码的偏差会再次产生。建议在每次功能变更时同步更新对应 spec 文件。
