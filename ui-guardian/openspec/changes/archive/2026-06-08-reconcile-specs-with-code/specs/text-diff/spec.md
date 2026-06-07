## ADDED Requirements

### Requirement: 文本内容对比
系统 SHALL 基于逐行文本 diff 算法对比 baseline 和 candidate 的页面文本内容，生成 TextDiffEntry 数组，每条标记为 added / removed / unchanged。

#### Scenario: 文本内容一致
- **WHEN** baseline 和 candidate 的提取文本完全相同
- **THEN** textDiff 数组所有条目类型为 unchanged，页面 status 为 passed

#### Scenario: 文本内容存在差异
- **WHEN** baseline 文本包含 "总价: 100元"，candidate 文本包含 "总价: 200元"
- **THEN** textDiff 数组包含 removed 条目 "总价: 100元" 和 added 条目 "总价: 200元"，页面 status 为 failed

### Requirement: 文本 diff 对齐算法
系统 SHALL 使用带 3 行前瞻窗口的对齐算法，在 baseline 和 candidate 文本行之间查找最佳匹配，标记未匹配行为 added 或 removed。

#### Scenario: 行插入对齐
- **WHEN** baseline 有行 A、B、C，candidate 有行 A、X、B、C
- **THEN** 算法将行 X 标记为 added，其余行标记为 unchanged

#### Scenario: 行删除对齐
- **WHEN** baseline 有行 A、B、C，candidate 有行 A、C
- **THEN** 算法将行 B 标记为 removed，其余行标记为 unchanged

### Requirement: 文本 diff 后处理
系统 SHALL 对 diff 结果进行后处理，确保 removed 和 added 条目交替出现：独立的 removed 条目后追加空 added 条目，独立的 added 条目前插入空 removed 条目。

#### Scenario: 独立 removed 条目配对
- **WHEN** diff 结果中连续出现 removed "A"、removed "B"
- **THEN** 输出为 removed "A" + added "" + removed "B" + added ""

### Requirement: 通过/失败由文本差异判定
系统 SHALL 以文本差异作为页面 status 的判定依据：textDiff 中存在任何非 unchanged 条目时，页面 status 为 failed；无文本差异时为 passed。像素差异仅作为视觉参考。

#### Scenario: 像素有差异但文本一致
- **WHEN** baseline 和 candidate 截图像素差异为 6.8%（因布局宽度不同），但文本内容完全一致
- **THEN** 页面 status 为 passed，diffResult.passed 为 true

#### Scenario: 文本有差异
- **WHEN** baseline 和 candidate 文本存在内容差异
- **THEN** 页面 status 为 failed

### Requirement: 文本位置映射
系统 SHALL 将文本 diff 中的非 unchanged 条目映射到页面上的像素坐标（x, y, width, height），通过匹配 candidate 和 baseline 的 textPositions 数据实现。

#### Scenario: 文本位置匹配
- **WHEN** textDiff 包含 added 条目 "总价: 200元"，candidate.textPositions 中存在文本 "总价: 200元" 的位置 { x: 100, y: 200, width: 120, height: 20 }
- **THEN** 该 diff 条目的 position 字段填充为候选侧的坐标

### Requirement: 差异图像标注
系统 SHALL 在 diff 热力图上为每个有位置信息的文本差异条目绘制蓝色圆形编号标记（半径 14px，白色数字），帮助用户快速定位变化位置。

#### Scenario: 标注多个差异位置
- **WHEN** textDiff 有 3 个带位置的差异条目
- **THEN** diff 图像上绘制编号 1、2、3 的蓝色圆形标记，位于对应文本的坐标位置
