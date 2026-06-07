## Tasks

### 同步缺失的规范文件到主规范目录

- [x] 将 `auth-module/spec.md` 从归档复制到 `openspec/specs/auth-module/spec.md`（使用当前代码的最新版本）
- [x] 将 `viewport-execution/spec.md` 从归档复制到 `openspec/specs/viewport-execution/spec.md`（使用当前代码的最新版本）

### 新增能力规范文件

- [x] 创建 `openspec/specs/text-diff/spec.md`（文本内容对比、diff 对齐算法、通过/失败判定、文本位置映射、差异图像标注）
- [x] 创建 `openspec/specs/echarts-extraction/spec.md`（ECharts 实例发现、数据提取、格式化、去重）
- [x] 创建 `openspec/specs/per-side-config/spec.md`（per-side 独立配置、三级合并、截图模式按侧判定、向后兼容）

### 更新现有规范文件

- [x] 更新 `openspec/specs/pixel-diff/spec.md`：移除"截图尺寸校验 → 抛出 DiffError"，改为"裁剪到公共区域"；明确 DiffResult.passed 与 PageResult.status 的区别
- [x] 更新 `openspec/specs/anomaly-collector/spec.md`：移除"异常归档到 logs/*.json 文件"，改为"内存收集 + 通过报告展示"
- [x] 更新 `openspec/specs/config-model/spec.md`：新增 side 级配置（baseline/candidate 独立 mainRegionSelector 等）、三级合并规则
- [x] 更新 `openspec/specs/screenshot-capture/spec.md`：区域截图"元素未找到"从抛出 CaptureError 改为回退全页截图；截图模式按侧判定
- [x] 更新 `openspec/specs/runner-orchestration/spec.md`：新增 per-side 配置传递描述
- [x] 更新 `openspec/specs/report-generation/spec.md`：新增 SPA 架构描述、响应式图片、lightbox、文本差异表格、滚动分段截图文件命名

### 可选清理

- [x] 移除 `package.json` 中未使用的 `diff` npm 依赖
