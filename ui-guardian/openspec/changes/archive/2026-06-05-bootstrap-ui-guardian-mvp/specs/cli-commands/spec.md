## ADDED Requirements

### Requirement: init 命令生成配置模板
系统 SHALL 提供 `ui-guardian init` 命令，在当前目录生成 `global.config.json` 和 `pages.config.json` 模板文件，包含所有必填字段的占位值和示例。

#### Scenario: 执行 init 生成配置文件
- **WHEN** 用户执行 `npx ui-guardian init`
- **THEN** 当前目录下生成 `global.config.json` 和 `pages.config.json`，文件内容包含合法的 JSON 结构和所有必填字段的占位值

### Requirement: run 命令执行对比流程
系统 SHALL 提供 `ui-guardian run` 命令，读取配置文件，启动浏览器，执行完整的对比流程（认证 → 截图 → 对比 → 报告），并在终端输出摘要。

#### Scenario: 正常执行 run 命令
- **WHEN** 用户执行 `npx ui-guardian run`，且当前目录存在合法的配置文件
- **THEN** 系统完成认证、截图、对比、报告生成全流程，终端输出通过/失败/异常统计和报告路径

#### Scenario: 配置文件缺失
- **WHEN** 用户执行 `npx ui-guardian run`，但当前目录不存在配置文件
- **THEN** 系统输出错误信息，不创建输出目录，退出码非零

#### Scenario: 配置校验失败
- **WHEN** 用户执行 `npx ui-guardian run`，但配置文件缺少必填字段或格式错误
- **THEN** 系统输出校验错误列表，不创建输出目录，退出码非零
