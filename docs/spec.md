>如果我使用openspec的方式最终作出来的效果不满意或不是我想要的，但change已经归档。一步一步的通过问答使其满足了我的要求，但是代码与文档已经不一致了怎么办

这种情况不要直接改归档的 change，而是做一次“现实回写”，把现在已经通过问答改出来的真实代码，重新沉淀成新的 OpenSpec 变更。

推荐流程：

1. 先承认状态：代码是新的事实源

归档后的文档已经过期，当前应以：

当前代码行为 + 你最新确认的要求

作为新的事实来源。

不要强行说“原归档 change 仍然准确”。

2. 新建一个补偿型 change

命名可以类似：

openspec change add align-actual-implementation

或：

openspec change add reconcile-vue3-comparison-behavior

目的不是重新做功能，而是：

对齐已实现代码与规范，补齐最终行为说明，修正文档偏差。

3. 让 AI 先做“代码反向总结”

可以这样提需求：

请阅读当前实现代码、已归档的 OpenSpec change、以及最近问答中确认的需求。
不要修改代码，先输出一份“实现与规范差异报告”。
报告包括：
1. 原归档规范中已不符合当前实现的内容
2. 当前代码已经实现但规范没有记录的内容
3. 当前代码与用户最终期望仍不一致的内容
4. 建议补充或修正的 spec/design/tasks

4. 再用新的 change 修正文档

让 AI 基于差异报告补：

请基于差异报告创建一个新的 OpenSpec change。
目标是让 OpenSpec 文档准确描述当前最终实现效果。
原则：
- 不回改历史归档 change
- 新 change 只描述本次对齐与补充
- 若代码已符合最终要求，只更新规范文档
- 若代码仍有偏差，再生成对应 tasks

5. 最后再归档这个新 change

当文档和代码重新一致后，再归档新的 change。

⸻

我的建议是把这类流程固定下来：

实现不满意 → 问答修正代码 → 新建 reconcile change → 反向同步 spec/design/tasks → 验证一致 → 再归档

核心原则：

已归档 change 是历史记录，不是永远正确的当前文档。当前规范要通过新的 change 追平现实。

> 没有openspec change add 这个命令

你说得对，标准的 OpenSpec 流程里并没有 openspec change add 这个命令。

通常是通过类似下面的方式创建变更：

/openspec-propose

或者

/openspec-specify

具体取决于你使用的是哪个实现（OpenSpec、Spec-Kit、Superpowers 等衍生版本命令名称可能不同）。

⸻

你遇到的问题本质上是：

Change A
  ↓
实现出来
  ↓
发现效果不满意
  ↓
大量问答调整
  ↓
代码已经变成了 B
  ↓
Change A 已归档
  ↓
文档与代码不一致

这种情况实际上很常见。

不要修改已归档 Change

归档后的 Change 应该视为：

历史决策记录

类似 Git 的历史 Commit。

不要因为代码后来变了就回去修改归档内容。

⸻

正确做法：创建新的变更

例如：

/openspec-specify

输入：

根据实际使用反馈，需要调整页面对比测试框架。
当前实现已经与原归档规范存在差异，
请分析当前代码实现与现有规范的差异，
生成一个新的变更提案。
目标：
1. 使规范与当前实际实现保持一致
2. 记录新增能力
3. 记录废弃能力
4. 更新验收标准

AI会生成：

changes/
└── align-comparison-framework/
spec.md
design.md
tasks.md

这实际上就是：

Change A（已归档）
      ↓
Change B（修正）
      ↓
Change C（优化）
      ↓
...

形成变更链。

⸻

更推荐的做法

对于你现在做的这些项目：

* Vue2→Vue3对比测试平台
* 数据资产平台
* 血缘分析平台
* AI整改平台

不要等到归档后才发现偏差。

开发过程中可以频繁执行：

/openspec-analyze

或者让 AI 做：

分析当前代码与规范的一致性。
输出：
- 缺失实现
- 多余实现
- 行为差异
- 风险项

相当于：

Spec Drift Check

（规范漂移检查）

很多团队每周都会做一次。

⸻

对于 AI 辅助开发，我更建议把 OpenSpec 当成：

需求管理系统
+
设计管理系统
+
决策记录系统

而不是认为：

Spec == 真理

真正的事实源通常是：

代码
+
测试
+
运行结果

当你经过多轮问答把效果调到满意时，实际上已经产生了一个新的需求版本。这时应该再跑一次 /openspec-specify（或你当前工具里的等价命令），生成一个新的变更来追平规范，而不是修改已经归档的历史记录。

从你截图看，你用的不是传统 OpenSpec CLI，而是集成在 AI 工具里的 OpenSpec Workflow，命令已经换成了：

创建变更

/openspec-new-change

或者

/opsx:new

⸻

继续已有变更

/opsx:continue

⸻

实现

/openspec-apply-change

⸻

验证

/openspec-verify-change

⸻

归档

/openspec-archive-change

⸻

所以回到你最开始的问题：

change已经archive了，后来通过大量对话把代码改到了满意状态，文档和代码不一致怎么办？

对于你这个版本的 OpenSpec，我建议直接这样干：

方案1：创建一个新的 Change（推荐）

/openspec-new-change

输入：

当前系统已经在原归档变更基础上经过多轮迭代调整。
请分析：
1. 当前代码实现
2. 已归档 Change
3. 当前实际行为
输出：
- 行为差异
- 规范漂移项
- 需要补充的规格说明
- 需要废弃的规格说明
生成新的 Change 用于同步规范与实现。

这本质上就是：

Change A（已归档）
        ↓
实际开发调整
        ↓
Change B（规范追平）

⸻

方案2：如果刚归档不久

有些团队会直接：

git revert archive commit

然后：

/opsx:continue

继续完善原 Change。

但我不建议这么做。

因为以后你会失去：

为什么第一次设计失败
为什么后来改成现在这样

这些决策历史。

⸻

你的场景更大的问题

你之前做的：

* Vue2 → Vue3 对比测试平台
* 数据资产平台
* 血缘分析平台
* AI整改平台

都属于探索性项目。

实际上经常会出现：

Spec
 ↓
实现
 ↓
发现不好用
 ↓
重新设计
 ↓
实现

如果每次都等 Archive 后才发现问题，会不断产生规范漂移。

更适合你的流程其实是：

/openspec-new-change
Spec
 ↓
Design
 ↓
Apply
(此时不要急着 Archive)
先试用
先验证
先调优
满意后
/openspec-verify-change
/openspec-archive-change

也就是说：

Archive 不应该代表“代码写完了”，而应该代表“已经试用并确认方案正确了”。

对于你这种企业内部平台开发，我甚至建议：

开发完成
    ↓
内部试用1周
    ↓
收集反馈
    ↓
修正
    ↓
Verify
    ↓
Archive

这样归档后的 Change 基本不会和最终代码产生太大偏差。


> 输入/openspec-new-change敲回车后
> ☐ Change
> 
> What change do you want to work on? Describe what you want to build or fix.
> 
>   1. I'll describe it
>      Let me explain what I want to build
>   2. Continue previous work
>      Continue the per-side config work we just finished
> ❯ 3. Type something.
> ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
>   4. Chat about this

这个界面其实说明了一件事：

你当前使用的是 交互式 Change 创建模式，并不是先输入 Change ID，而是直接描述需求。

所以这里不要输入：

reconcile-spec
align-current-implementation

这种 Change 名称。

而是直接输入完整需求。

例如针对你说的「代码和归档文档不一致」场景，可以直接填：

当前项目已经完成并归档，但在后续试用过程中经过多轮调整和优化。
当前代码实现已经与归档的 OpenSpec 文档存在差异。
希望创建一个新的 Change，用于：
1. 分析当前代码与已归档规范之间的差异
2. 识别新增功能、修改功能和废弃功能
3. 更新规格说明以匹配当前实际实现
4. 输出需要补充或修改的设计文档
5. 生成必要的任务清单
目标是让规范重新与当前代码保持一致，而不是修改历史归档记录。

然后回车。

⸻

对于你做的 Vue2→Vue3 对比测试平台，更建议写得具体一点：

页面对比测试框架在实现过程中经过多轮调整。
当前实现已经增加和修改了以下能力：
- 登录态复用
- API捕获与对比
- 文本差异检测
- 动态区域忽略
- 批量页面执行
- 失败重试机制
请分析当前代码与已归档 OpenSpec 文档之间的差异。
生成一个新的 Change：
- 保留历史归档记录
- 更新规格说明
- 更新验收标准
- 标记废弃设计
- 补充新增能力

⸻

实际上，你这个问题暴露出一个很实用的流程：

当发现实现效果不满意时，不要急着：

Verify
Archive

而是先：

Apply
↓
试用
↓
继续修改
↓
opsx:continue
↓
Apply
↓
试用

等真正满意了再：

/openspec-verify-change
/openspec-archive-change

这样就不会产生大量「归档后又推翻」的情况。

对于探索性很强的项目（你现在的数据资产平台、血缘平台、AI整改平台都属于这类），通常会让一个 Change 存活几天到几周，而不是当天创建当天归档。



>  /openspec-new-change

⏺ User answered Claude's questions:
  ⎿  · What change do you want to work on? Describe what you want to build or fix. → 当前项目已经完成并归档，但在后续试用过程中经过多轮调整和优化。

     当前代码实现已经与归档的 OpenSpec 文档存在差异。

     希望创建一个新的 Change，用于：

     1. 分析当前代码与已归档规范之间的差异
     2. 识别新增功能、修改功能和废弃功能
     3. 更新规格说明以匹配当前实际实现
     4. 输出需要补充或修改的设计文档
     5. 生成必要的任务清单

     目标是让规范重新与当前代码保持一致，而不是修改历史归档记录。

⏺ Bash(openspec new change "reconcile-specs-with-code" 2>&1)
  ⎿  - Creating change 'reconcile-specs-with-code'...
     ✔ Created change 'reconcile-specs-with-code' at openspec/changes/reconcile-specs-with-code/ (schema: spec-driven)

⏺ Bash(openspec status --change "reconcile-specs-with-code" 2>&1)
  ⎿  - Loading change status...
     Change: reconcile-specs-with-code
     Schema: spec-driven
     … +6 lines (ctrl+o to expand)

⏺ Bash(openspec instructions proposal --change "reconcile-specs-with-code" 2>&1)
  ⎿  - Generating instructions...
     <artifact id="proposal" change="reconcile-specs-with-code" schema="spec-driven">
     … +49 lines (ctrl+o to expand)

⏺ Change: reconcile-specs-with-code
  Location: openspec/changes/reconcile-specs-with-code/
  Schema: spec-driven (4 artifacts: proposal → design → specs → tasks)
  Progress: 0/4 artifacts complete

  Artifact 序列:
  1. proposal ← 当前可创建
  2. design (依赖 proposal)
  3. specs (依赖 proposal)
  4. tasks (依赖 design + specs)

  第一个 artifact proposal 模板:

  需要包含以下部分:
  - Why: 为什么需要这个变更
  - What Changes: 具体变更内容列表
  - Capabilities: 新增/修改的能力规格
  - Impact: 影响的代码、API、依赖

  ---
  准备好创建 proposal 了吗？描述一下这个变更的背景，我会根据当前代码与已归档规范的差异来起草 proposal。或者你也可以让我直接开始分析代码差异。
  
  ---

  你这里应该选：

让它直接开始分析代码差异

可以直接回复 Claude：

请直接开始分析代码差异。
分析范围包括：
1. 当前代码实现
2. openspec/specs 下的主规格
3. openspec/changes/archive 下已归档的相关 change
4. 当前 change：openspec/changes/reconcile-specs-with-code
请先不要修改代码，只输出差异分析报告，并基于报告起草 proposal。
重点识别：
- 当前代码已经实现但规格未记录的能力
- 规格中描述了但当前代码没有实现或已经废弃的能力
- 当前实现行为与规格描述不一致的地方
- 需要同步到主规格的内容
- 是否需要新增 tasks 来补代码，还是只需要补文档

等它输出 proposal 后，你再看一遍。确认没问题后继续让它生成：

继续生成 design、specs、tasks。

这一步的目标是先对齐文档，不要急着改代码。


> 已创建的文件:

  ┌──────────┬────────────────────┬────────────────────────────────────────────────────────────────────┐
  │ Artifact │        文件        │                                内容                                │
  ├──────────┼────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ proposal │ proposal.md        │ 差异分析：7 项新增能力、4 项行为不一致、2 项缺失规范               │
  ├──────────┼────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ design   │ design.md          │ 5 个技术决策（delta 格式、文本判定、区域回退、异常内存、三级配置） │
  ├──────────┼────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ specs    │ specs/ (11 个文件) │ 3 个新能力 + 6 个修改能力 + 2 个补录能力                           │
  ├──────────┼────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ tasks    │ tasks.md           │ 12 个任务：2 补录 + 3 新增 + 6 更新 + 1 可选清理                   │
  └──────────┴────────────────────┴────────────────────────────────────────────────────────────────────┘

  Specs 文件清单:
  - 新增: text-diff, echarts-extraction, per-side-config
  - 修改: pixel-diff, anomaly-collector, config-model, screenshot-capture, runner-orchestration, report-generation
  - 补录: auth-module, viewport-execution

  结论: 所有功能代码已实现，仅需文档同步，无需补代码。可选清理 package.json 中未使用的 diff 依赖。

  下一步可以执行 tasks 中的规范同步操作。需要继续吗？
  --- 

  这次结果其实非常理想。

从输出看，OpenSpec 已经完成了你最担心的事情：

代码 ←→ 文档
重新建立一致性

而且分析结果很有价值：

类型	数量	含义
新增能力	3	开发过程中长出来的新功能
修改能力	6	原设计存在偏差，最终实现调整了
补录能力	2	代码里有，但历史规范没记录
行为不一致	4	原规范和实际行为不同
缺失规范	2	规范遗漏
补代码任务	0	非常关键

最后这一条：

所有功能代码已实现，仅需文档同步，无需补代码

说明这次 Change 实际上属于：

Documentation Reconciliation
（规范追平）

而不是：

Feature Development
（功能开发）

⸻

我会怎么做

直接继续。

让 Claude 执行：

继续执行 tasks。
目标：
1. 完成所有文档同步任务
2. 更新主规格
3. 同步新增能力
4. 同步修改能力
5. 同步补录能力
6. 保留历史归档记录
7. 不修改业务代码

因为：

代码已经是正确的
文档才是落后的

此时再去改代码反而有风险。

⸻

完成后建议执行

/openspec-verify-change

验证的是：

当前代码
=
当前 specs
=
当前 design

如果 Verify 通过，再：

/openspec-archive-change

归档这个 reconcile-specs-with-code。

⸻

以后推荐增加一个固定流程

对于你正在做的这些项目：

* Vue2 → Vue3 对比测试平台
* 数据资产平台
* 血缘平台
* AI整改平台

每次准备 Archive 前，增加一步：

请执行 Spec Drift Analysis
分析：
- 当前代码
- 当前 Change
- 当前 Specs
输出：
1. 未记录功能
2. 已废弃功能
3. 行为差异
4. 文档缺失

相当于：

Apply
↓
Self Test
↓
Spec Drift Check
↓
Verify
↓
Archive

这样以后几乎不会再出现：

代码很好用
文档已经过时

这种情况。

实际上你这次无意中创建的 reconcile-specs-with-code，以后完全可以作为一个长期保留的工作流模板，用于所有探索性项目的“规范追平”。


> 这要怎么做

如果你问的是我上面提到的：

Spec Drift Analysis
（规范漂移检查）

实际上 OpenSpec 没有内置这个命令。

你需要在每次 Archive 前，让 Claude 执行一个固定 Prompt。

方案一：直接复制 Prompt（最简单）

在准备执行：

/openspec-verify-change

之前，先输入：

请执行 Spec Drift Analysis。
分析范围：
- 当前代码实现
- 当前 Change 的 proposal/design/specs/tasks
- 主规格 openspec/specs
输出：
1. 当前代码已经实现但规格未记录的功能
2. 规格中存在但代码未实现的功能
3. 当前行为与规格描述不一致的地方
4. 需要补充的规格说明
5. 需要废弃的规格说明
6. 是否存在设计与实现偏差
7. 是否建议继续 Archive
请输出：
- Drift Summary
- Risk Assessment
- Recommended Actions

⸻

方案二：做成项目 Skill（推荐）

你本来就在搞：

* OpenCode
* OpenSpec
* AI整改 Skill

完全可以加一个：

skills/
└── spec-review/
    ├── SKILL.md
    └── prompts/
        ├── drift-check.md
        ├── archive-review.md
        └── implementation-review.md

drift-check.md

# Spec Drift Check
目标：
检查当前实现与 OpenSpec 规范的一致性。
分析：
- 当前代码
- 当前 Change
- 主规格
输出：
## 未记录功能
## 已废弃功能
## 行为差异
## 文档缺失
## 风险评估
## 是否允许 Archive
结论：
PASS / WARNING / FAIL

以后直接：

使用 spec-review skill 执行 drift-check

⸻

方案三：把它嵌入 Verify 流程（最适合你）

因为你经常：

Spec
↓
实现
↓
试用
↓
继续修改
↓
继续修改
↓
继续修改

所以可以规定：

/openspec-verify-change

之前必须先执行：

Drift Check

流程变成：

Apply
↓
测试
↓
Drift Check
↓
修正文档
↓
Verify
↓
Archive

⸻

对于你现在这个 Vue2→Vue3 对比测试框架项目，我建议马上继续：

继续执行 tasks
同步 specs
同步 design
同步 proposal
不要修改代码

等全部同步完后再：

/openspec-verify-change

如果 Verify 通过：

/openspec-archive-change

这样这次 reconcile-specs-with-code 就正式成为一次“规范追平变更”，以后主规格和代码就重新一致了。