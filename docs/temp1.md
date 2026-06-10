可以直接给 Codex 下面这个 prompt：

请基于当前项目已有的 `AGENTS.md` 和 `docs/styleguide/` 下的 HTML、Vue、JavaScript、TypeScript 编码规约文档，创建一个通用代码规约整改 Skill：`skills/lhm-code-remediation/`。
## 目标
构建一个可复用的代码规约扫描与整改引擎，用于存量 Vue + JavaScript 项目的规约整改，后续也要兼容 TypeScript。
该 skill 需要支持：
1. 读取 `docs/styleguide/` 下的规约文档
2. 建立规则元数据
3. 扫描指定代码目录
4. 输出 JSON 报告，供 AI / pipeline 读取
5. 输出 Excel 明细报告，供人工查看
6. 区分不同修复策略：
   - prettier/eslint
   - codemod
   - ai
   - manual
7. 支持后续按文件聚合问题，避免行号漂移
8. 为后续自动整改闭环预留 pipeline
## 请创建以下目录结构
```txt
skills/
└── lhm-code-remediation/
    ├── skill.md
    │
    ├── scanner/
    │   ├── eslint.config.js
    │   ├── prettier.config.js
    │   ├── scan-eslint.js
    │   ├── scan-styleguide.js
    │   └── parsers/
    │
    ├── rules/
    │   ├── html.yaml
    │   ├── vue.yaml
    │   ├── javascript.yaml
    │   └── typescript.yaml
    │
    ├── reports/
    │   ├── generate-json.js
    │   ├── generate-excel.py
    │   ├── latest.json
    │   ├── latest.xlsx
    │   └── history/
    │
    ├── queue/
    │   ├── latest.json
    │   ├── pending.json
    │   ├── fixed.json
    │   └── failed.json
    │
    ├── codemods/
    │   ├── README.md
    │   ├── remove-console.js
    │   ├── default-param-last.js
    │   └── utils/
    │
    ├── ai/
    │   ├── prompts/
    │   │   ├── fix-file.md
    │   │   ├── reduce-nesting.md
    │   │   ├── split-large-function.md
    │   │   └── deduplicate-code.md
    │   └── README.md
    │
    ├── pipelines/
    │   ├── scan.js
    │   ├── auto-fix.js
    │   ├── codemod-fix.js
    │   ├── ai-fix.js
    │   ├── verify.js
    │   ├── rescan.js
    │   └── full-remediation.js
    │
    └── scripts/
        ├── group-by-file.js
        ├── merge-results.js
        └── validate-report.js

规则处理要求

请读取并分析：

docs/styleguide/

下的所有 Markdown 文件。

将规则归类为：

formatting
eslint
codemod
ai
manual

判断原则：

* 能被 prettier 处理的，标记为 formatting
* 能被 eslint –fix 处理的，标记为 eslint
* 能通过 AST 机械转换处理的，标记为 codemod
* 需要理解业务语义、函数拆分、重复逻辑抽取、嵌套逻辑重构的，标记为 ai
* 无法安全自动修复的，标记为 manual

JSON 报告格式

pipelines/scan.js 最终需要生成：

{
  "scan_id": "scan_YYYYMMDD_HHmmss",
  "project": "project-name",
  "created_at": "ISO_TIME",
  "target": "src",
  "summary": {
    "total": 0,
    "formatting": 0,
    "eslint": 0,
    "codemod": 0,
    "ai": 0,
    "manual": 0,
    "fixed": 0,
    "pending": 0,
    "failed": 0
  },
  "tasks": [
    {
      "id": "task-000001",
      "rule": "no-console",
      "category": "eslint",
      "severity": "error",
      "file": "src/views/home.vue",
      "line": 42,
      "column": 8,
      "message": "Unexpected console statement",
      "source": "eslint",
      "fix_strategy": "eslint",
      "fixable": true,
      "status": "pending",
      "batch_id": null,
      "retry_count": 0,
      "created_at": "ISO_TIME"
    }
  ],
  "files": [
    {
      "file": "src/views/home.vue",
      "total": 10,
      "tasks": ["task-000001"]
    }
  ]
}

Excel 报告要求

同时生成 Excel 明细报告：

skills/lhm-code-remediation/reports/latest.xlsx

Excel 至少包含以下列：

* task_id
* rule
* category
* severity
* file
* line
* column
* message
* source
* fix_strategy
* fixable
* status
* batch_id
* retry_count

扫描命令要求

请在 skills/lhm-code-remediation/pipelines/scan.js 中实现命令行参数：

node skills/lhm-code-remediation/pipelines/scan.js --target src

输出：

skills/lhm-code-remediation/reports/latest.json
skills/lhm-code-remediation/reports/latest.xlsx
skills/lhm-code-remediation/queue/latest.json
skills/lhm-code-remediation/queue/pending.json

不要做的事

不要直接大规模修改业务代码。

这次只创建 skill 框架、扫描管线、报告格式、规则元数据和示例 codemod。

不要把所有整改逻辑都交给 AI。

不要依赖旧行号长期追踪问题。

整改时后续应按文件聚合问题，再整体修复该文件，然后重新扫描。

验收标准

完成后请确保：

1. skills/lhm-code-remediation/skill.md 清楚说明使用方式
2. pipelines/scan.js --target src 可以执行
3. 能生成 JSON 报告
4. 能生成 Excel 报告
5. 能按文件生成 files 聚合信息
6. 规则 YAML 中能体现来自 docs/styleguide/ 的规则
7. 不修改业务代码
8. 如果缺少依赖，请更新 package.json 或给出明确安装命令


请先实现最小可运行版本，不要一次性实现完整自动修复闭环。第一阶段只要求 scan + json report + excel report + rule metadata。

lhm-code-remediation里reports/history里存放什么东西，queue里存放什么东西，这个skill不能只是为当前项目服务，这是一个通用的公共skill，不应该存放生成项目信息

你这个判断是对的。

如果 lhm-code-remediation 是公共通用 skill，就不应该把某个项目的扫描产物长期写进 skill 目录。

应该把它拆成两类：

1. skill 目录：只放通用能力

skills/lhm-code-remediation/
├── skill.md
├── scanner/
├── rules/
├── codemods/
├── ai/
├── pipelines/
├── reports/
│   └── templates/
└── scripts/

这里放：

目录	放什么
scanner/	通用扫描器
rules/	通用规则定义、规则映射
codemods/	通用 codemod 脚本
pipelines/	通用 scan/fix/verify/rescan 流水线
reports/templates/	Excel 模板、JSON schema
scripts/	通用辅助脚本

不要放：

reports/latest.json
reports/latest.xlsx
queue/latest.json
queue/pending.json
queue/fixed.json
queue/failed.json
reports/history/

这些都是项目运行产物。

⸻

2. 项目目录：放扫描产物和任务状态

建议输出到当前项目的：

.lhm-code-remediation/
├── reports/
│   ├── latest.json
│   ├── latest.xlsx
│   └── history/
│       ├── scan_20260527_100000.json
│       └── scan_20260527_100000.xlsx
│
├── queue/
│   ├── latest.json
│   ├── pending.json
│   ├── processing.json
│   ├── fixed.json
│   └── failed.json
│
└── logs/

⸻

reports/history/ 放什么

放每一轮扫描快照，用于对比趋势和审计。

例如：

.lhm-code-remediation/reports/history/
├── scan_20260527_100000.json
├── scan_20260527_100000.xlsx
├── scan_20260527_103000.json
├── scan_20260527_103000.xlsx
└── scan_20260527_110000.json

用途：

* 看问题是否减少
* 比较每轮整改效果
* 出报告
* 回溯某次扫描结果

⸻

queue/ 放什么

放当前项目的整改任务状态。

.lhm-code-remediation/queue/
├── latest.json       # 最近一次扫描完整任务
├── pending.json      # 待处理
├── processing.json   # 正在处理
├── fixed.json        # 已修复但可继续验证
└── failed.json       # 修复失败/需人工

用途：

* AI 每次只取一小批 pending
* 修完后移到 fixed
* 失败放 failed
* 重新扫描后刷新 latest/pending

⸻

所以最终推荐结构应该改成这样

公共 Skill

skills/
└── lhm-code-remediation/
    ├── skill.md
    ├── scanner/
    ├── rules/
    ├── codemods/
    ├── ai/
    ├── pipelines/
    ├── reports/
    │   └── templates/
    └── scripts/

每个项目运行时产物

.lhm-code-remediation/
├── reports/
├── queue/
└── logs/

⸻

scan 命令也应该改

不要默认写到 skill 内部。

应该这样：

node skills/lhm-code-remediation/pipelines/scan.js \
  --target src \
  --output .lhm-code-remediation

生成：

.lhm-code-remediation/reports/latest.json
.lhm-code-remediation/reports/latest.xlsx
.lhm-code-remediation/queue/latest.json
.lhm-code-remediation/queue/pending.json

这样 skills/lhm-code-remediation 才是真正可复用的公共 skill。