## Why

项目在 MVP 归档后经过多轮实际使用和优化，当前代码实现已与归档时的 OpenSpec 规范产生显著偏差。主要体现在：新增了文本对比、ECharts 提取、差异标注等核心能力但未记录到规范；部分规范描述的行为（如像素差异判定通过/失败、异常归档到文件）已被代码替代或废弃；配置模型从共享配置演进为 per-side 独立配置。需要全面对齐规范与代码，使文档准确反映当前实现。

## What Changes

### 代码已有但规范未记录的能力（需新增规范）

- **文本内容对比** (`processPage.ts:computeTextDiff`)：自定义的逐行文本 diff 算法，带 3 行前瞻窗口对齐，是判定页面通过/失败的核心依据
- **文本位置映射** (`textMarker.ts:matchTextPositions`)：将文本 diff 条目映射到页面上的像素坐标，用于差异标注
- **差异图像标注** (`textMarker.ts:annotateDiffImage`)：在 diff 图像上绘制蓝色圆形编号标记，指示文本变化位置
- **ECharts 图表数据提取** (`echarts.ts:extractEChartsData`)：自动发现页面中的 ECharts 实例（含 Vue 集成），提取图表数据用于文本对比
- **Per-side 独立配置** (`types.ts:SideConfig`, `defaults.ts:resolveSideConfig`)：baseline 和 candidate 支持独立的 `mainRegionSelector`、`mainRegionIndex`、`ignoreSelectors`、`captureMode`，三级合并优先级：side > pagePair > global
- **区域截图回退** (`capture.ts`)：当 `mainRegionSelector` 元素未找到时，回退到全页截图并输出警告，而非抛出 CaptureError
- **中文 ID 生成** (`defaults.ts:toKebabCase`)：支持中文字符的 kebab-case 转换，保留中文作为页面 ID

### 规范描述了但代码已修改或废弃的能力（需更新规范）

- **通过/失败判定标准**：规范 (`pixel-diff/spec.md`) 描述为 `diffPercent < threshold` 判定通过；实际代码 (`processPage.ts`) 以文本差异判定通过/失败，像素差异仅作为视觉参考
- **不同尺寸截图处理**：规范 (`pixel-diff/spec.md`) 描述为尺寸不匹配时抛出 DiffError；实际代码 (`diff.ts:cropToCommon`) 裁剪到公共区域后比较
- **异常归档**：规范 (`anomaly-collector/spec.md`) 描述异常归档到 `logs/console.json`、`logs/network.json`、`logs/errors.json`；实际代码仅收集异常到内存，未写入磁盘文件
- **认证配置校验**：规范 (`cli-commands/spec.md`) 描述缺少 auth 配置时跳过认证；实际代码 (`validation.ts`) 在 `skipAuth=false` 时要求完整认证字段
- **`diff` npm 依赖**：`package.json` 声明了 `diff` 库但实际未使用，项目实现了自定义文本 diff

### 缺失的规范文件（归档中有但主规范目录缺失）

- **`auth-module/spec.md`**：归档中存在，描述自动登录流程、成功检测、storageState 复用；主规范目录 `openspec/specs/` 中缺失
- **`viewport-execution/spec.md`**：归档中存在，描述多视口执行、视口标签生成；主规范目录 `openspec/specs/` 中缺失

## Capabilities

### New Capabilities
- `text-diff`: 文本内容对比算法、通过/失败判定逻辑、文本位置映射、差异图像标注
- `echarts-extraction`: ECharts 图表数据自动提取与文本化
- `per-side-config`: baseline/candidate 独立配置模型与三级合并规则

### Modified Capabilities
- `pixel-diff`: 通过/失败判定标准从像素差异改为文本差异；不同尺寸处理从 DiffError 改为裁剪
- `anomaly-collector`: 异常归档行为从写入文件改为仅内存收集
- `config-model`: PagePair 结构变更，baseline/candidate 支持 SideConfig 独立配置
- `screenshot-capture`: region 模式增加元素未找到时的回退行为
- `runner-orchestration`: processPage 调用签名变更，接收 per-side config
- `report-generation`: 报告模板更新，支持 per-side 配置显示、响应式图片、lightbox

## Impact

- **类型定义** (`types.ts`): `PagePair`、`ResolvedPageConfig`、`PageResult.config` 结构变更，新增 `SideConfig`、`ResolvedSideConfig`
- **配置合并** (`defaults.ts`): `mergeConfig` 返回值结构变更，新增 `resolveSideConfig` 函数
- **页面处理** (`processPage.ts`, `processSide.ts`): `processSide` 新增 `sideConfig` 参数
- **截图捕获** (`capture.ts`): 参数类型从 `ResolvedPageConfig` 改为 `ResolvedSideConfig`，新增 `scrollStep` 可选参数
- **视觉差异** (`diff.ts`): `padToSize` 替换为 `cropToCommon`
- **报告模板** (`template.ts`): 引用 `config.candidate.mainRegionSelector` 替代 `config.mainRegionSelector`
- **Runner** (`runner.ts`): 错误处理中的 config 结构更新为 per-side 格式
- **测试** (`defaults.test.ts`): 测试用例更新为新的 config 结构
- **依赖** (`package.json`): `diff` 库声明但未使用，可考虑移除
