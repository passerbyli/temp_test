可以，而且很建议内置成 workflow preset，让 Codex 不要每次重新理解流程。

推荐在 skill 里加：

skills/lhm-code-remediation/
├── workflows/
│   ├── basic.md
│   ├── strong.md
│   ├── extreme.md
│   └── README.md

1. 基础模式：basic

目标：只做低风险、确定性修复。

node skills/lhm-code-remediation/pipelines/run.js \
  --workflow basic \
  --target src \
  --output .lhm-code-remediation

执行：

scan
→ prettier --write
→ eslint --fix
→ verify
→ rescan
→ 输出剩余问题和建议

适合：

* 第一次接入项目
* 不想改业务逻辑
* 先消灭格式类、lint 自动修复类问题

不会处理：

* 超大函数
* 深层嵌套
* 重复代码
* 参数过多
* 函数签名变更

⸻

2. 上强度模式：strong

目标：在基础模式上，加 codemod 修复低/中风险问题。

node skills/lhm-code-remediation/pipelines/run.js \
  --workflow strong \
  --target src \
  --output .lhm-code-remediation

执行：

basic
→ codemod 分类
→ 执行低风险 codemod
→ verify
→ rescan
→ 输出剩余问题和建议

适合处理：

* console 删除或替换
* var → let/const
* 简单 import 清理
* 简单 API 替换
* 可机械转换的问题

不建议默认处理：

* 函数参数顺序变更
* 函数签名变更
* 大函数拆分
* 复杂业务逻辑抽取

这些应进入 ai 或 manual。

⸻

3. 极致模式：extreme

目标：高度自动化闭环处理，尽量不人工介入。

node skills/lhm-code-remediation/pipelines/run.js \
  --workflow extreme \
  --target src \
  --output .lhm-code-remediation \
  --batch-size 3 \
  --max-rounds 50

执行：

strong
→ 读取 pending.json
→ 按文件聚合 ai_fix 问题
→ 每批处理 1~3 个文件
→ verify
→ rescan
→ 若问题减少则继续
→ 若失败则回滚本批并写入 failed.json
→ 直到 pending 清零或只剩 manual/failed

适合处理：

* 超大函数
* 嵌套过深
* 重复代码
* 参数过多
* 复杂可读性整改

必须内置保护：

每批最多修改 N 个文件
每批后必须 verify
每批后必须 rescan
问题数不下降则停止当前文件
verify 失败则回滚本批
同一文件失败 2 次进入 failed/manual
不允许全项目大重构

⸻

建议 workflow 配置文件

skills/lhm-code-remediation/workflows/
├── basic.yaml
├── strong.yaml
└── extreme.yaml

basic.yaml

name: basic
description: 无风险基础整改
steps:
  - scan
  - prettier_fix
  - eslint_fix
  - verify
  - rescan
  - report
allowed_strategies:
  - formatting
  - eslint
forbidden_strategies:
  - codemod
  - ai
  - manual

strong.yaml

name: strong
description: 基础整改 + 低风险 codemod
extends: basic
steps:
  - scan
  - prettier_fix
  - eslint_fix
  - codemod_fix
  - verify
  - rescan
  - report
allowed_strategies:
  - formatting
  - eslint
  - codemod
codemod_risk_level:
  - low
  - medium
forbidden_strategies:
  - ai
  - manual

extreme.yaml

name: extreme
description: 高度自动化整改闭环
extends: strong
steps:
  - scan
  - prettier_fix
  - eslint_fix
  - codemod_fix
  - verify
  - rescan
  - ai_batch_fix
  - verify
  - rescan
  - repeat_until_done
  - report
allowed_strategies:
  - formatting
  - eslint
  - codemod
  - ai
batch:
  group_by: file
  max_files: 3
  max_tasks: 20
  max_rounds: 50
guards:
  require_verify: true
  require_rescan: true
  rollback_on_verify_failure: true
  stop_if_pending_not_decreased: true
  max_failed_attempts_per_file: 2
  max_changed_files_per_batch: 5
  max_diff_lines_per_batch: 500
forbidden:
  - whole_project_rewrite
  - stale_line_number_fix
  - business_logic_guessing

⸻

给 Codex 的追加 Prompt

请为 `skills/lhm-code-remediation` 增加三种内置整改工作流：
1. `basic`：基础模式，只执行 scan、prettier、eslint --fix、verify、rescan、report。不得执行 codemod 或 AI 修复。
2. `strong`：上强度模式，在 basic 基础上执行低/中风险 codemod。不得执行 AI 语义重构。
3. `extreme`：极致模式，在 strong 基础上执行 AI 批量整改闭环。AI 必须按文件分组处理，每批最多 3 个文件，每批后必须 verify 和 rescan。verify 失败必须回滚本批，问题数不下降必须停止当前批次并记录 failed/manual。
请新增：
```txt
skills/lhm-code-remediation/workflows/
  basic.yaml
  strong.yaml
  extreme.yaml
  README.md

并新增或改造：

skills/lhm-code-remediation/pipelines/run.js

使其支持：

node skills/lhm-code-remediation/pipelines/run.js --workflow basic --target src --output .lhm-code-remediation
node skills/lhm-code-remediation/pipelines/run.js --workflow strong --target src --output .lhm-code-remediation
node skills/lhm-code-remediation/pipelines/run.js --workflow extreme --target src --output .lhm-code-remediation --batch-size 3 --max-rounds 50

要求：

* 所有运行产物写入 --output 指定目录
* 不允许把项目扫描产物写入 skills/lhm-code-remediation
* workflow yaml 只定义策略和限制
* pipeline 负责执行
* basic/strong/extreme 执行结束后都必须生成 JSON + Excel 报告
* extreme 不允许按旧行号逐条修复，必须按文件聚合
* extreme 不允许全项目大重构
* extreme 必须有 verify/rescan/rollback guard

结论：**可以内置这三档，而且这会让 skill 更好用、更可控。**