## ADDED Requirements

### Requirement: Per-side 独立配置
系统 SHALL 允许 baseline 和 candidate 各自独立配置 mainRegionSelector、mainRegionIndex、ignoreSelectors、captureMode，不再强制共享同一配置。

#### Scenario: baseline 和 candidate 使用不同选择器
- **WHEN** baseline.mainRegionSelector 为 ".legacy-content"，candidate.mainRegionSelector 为 ".new-content"
- **THEN** baseline 使用 ".legacy-content" 截图，candidate 使用 ".new-content" 截图

#### Scenario: baseline 有选择器 candidate 无
- **WHEN** baseline.mainRegionSelector 为 ".main-view"，candidate 未配置 mainRegionSelector
- **THEN** baseline 使用 region 模式，candidate 使用 fullPage 模式

### Requirement: 三级配置合并优先级
系统 SHALL 按 side 级 → pagePair 级 → global 级的优先级合并配置。side 级配置优先级最高，pagePair 级次之，global 级最低。

#### Scenario: side 级覆盖 pagePair 级
- **WHEN** pagePair.mainRegionSelector 为 ".main-view"，baseline.mainRegionSelector 为 ".content-area"
- **THEN** baseline 使用 ".content-area"，candidate 使用 ".main-view"（继承 pagePair 级）

#### Scenario: pagePair 级覆盖 global 级
- **WHEN** global.ignoreSelectors 为 [".cookie"]，pagePair.ignoreSelectors 为 [".ad"]
- **THEN** 两侧的 ignoreSelectors 均为 [".cookie", ".ad"]（追加合并）

#### Scenario: side 级 ignoreSelectors 追加
- **WHEN** global.ignoreSelectors 为 [".cookie"]，pagePair.ignoreSelectors 为 [".ad"]，baseline.ignoreSelectors 为 [".banner"]
- **THEN** baseline 的 ignoreSelectors 为 [".cookie", ".ad", ".banner"]，candidate 的为 [".cookie", ".ad"]

### Requirement: 截图模式按侧判定
系统 SHALL 为每个 side 独立判定截图模式：side.captureMode > pagePair.captureMode > global.capture.mode。若 side 或 pagePair 配置了 mainRegionSelector，该 side 的模式强制为 region。

#### Scenario: 两侧不同截图模式
- **WHEN** baseline.mainRegionSelector 为 ".main-view"，candidate 未配置 mainRegionSelector
- **THEN** baseline 的 mode 为 region，candidate 的 mode 由全局配置决定（默认 fullPage）

### Requirement: 向后兼容
系统 SHALL 在 baseline/candidate 未配置 side 级字段时，继承 pagePair 级配置，保持与旧版配置格式的向后兼容。

#### Scenario: 旧版配置格式兼容
- **WHEN** pagePair 中 mainRegionSelector 在顶层配置，baseline/candidate 仅有 url
- **THEN** 两侧均使用 pagePair 级的 mainRegionSelector，行为与旧版一致
