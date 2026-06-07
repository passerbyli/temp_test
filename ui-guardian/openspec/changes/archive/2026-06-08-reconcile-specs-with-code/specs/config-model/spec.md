## MODIFIED Requirements

### Requirement: 全局配置结构
系统 SHALL 支持 `global.config.json` 配置文件，包含 auth（认证）、viewports（视口列表）、capture（截图配置）、diff（对比配置）、ignoreSelectors（全局噪声过滤）、outputDir（输出目录）六个配置组。

#### Scenario: 全局配置包含所有必填字段
- **WHEN** 用户提供包含 auth.loginUrl、auth.username、auth.password、auth.usernameSelector、auth.passwordSelector、auth.submitSelector、viewports 的 global.config.json
- **THEN** 系统接受该配置为合法

#### Scenario: 全局配置缺少必填字段
- **WHEN** 用户提供的 global.config.json 缺少 auth.username 字段
- **THEN** 系统在配置校验阶段报错，列出缺失字段

### Requirement: 页面对配置结构
系统 SHALL 支持 `pages.config.json` 配置文件，包含 pagePairs 数组，每项包含 name、baseline.url、candidate.url 必填字段。baseline 和 candidate 各自可选配置 mainRegionSelector、mainRegionIndex、ignoreSelectors、captureMode（side 级配置）。pagePair 顶层可选配置 mainRegionSelector、mainRegionIndex、ignoreSelectors、viewports、captureMode、scrollCapture、threshold（pagePair 级配置）。

#### Scenario: 页面对配置包含所有必填字段
- **WHEN** 用户提供包含 name、baseline.url、candidate.url 的 pagePairs 项
- **THEN** 系统接受该页面对为合法

#### Scenario: side 级配置
- **WHEN** baseline 配置了 mainRegionSelector: ".legacy-content"，candidate 配置了 mainRegionSelector: ".new-content"
- **THEN** 两侧使用各自的选择器进行截图

### Requirement: 三级配置合并规则
系统 SHALL 按 side 级 → pagePair 级 → global 级优先级合并配置。ignoreSelectors 在每一级追加（不覆盖）；viewports/pagePair 级有则覆盖全局；mainRegionSelector 存在时该 side 的 captureMode 强制为 region。

#### Scenario: 页面级 viewports 覆盖全局
- **WHEN** 全局 viewports 为 [1920x1080, 1366x768]，某 pagePair.viewports 为 [375x812]
- **THEN** 该页面对只在 375x812 视口下执行

#### Scenario: 三级 ignoreSelectors 追加
- **WHEN** 全局 ignoreSelectors 为 [".cookie-banner"]，pagePair.ignoreSelectors 为 [".page-ad"]，baseline.ignoreSelectors 为 [".banner"]
- **THEN** baseline 的 ignoreSelectors 为 [".cookie-banner", ".page-ad", ".banner"]，candidate 的为 [".cookie-banner", ".page-ad"]

#### Scenario: mainRegionSelector 强制 region 模式
- **WHEN** 全局 capture.mode 为 "fullPage"，baseline.mainRegionSelector 为 ".main-content"
- **THEN** baseline 的截图模式强制为 "region"，candidate 的模式由全局配置决定
