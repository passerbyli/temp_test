## ADDED Requirements

### Requirement: 自动登录流程
系统 SHALL 支持自动登录流程：导航到 loginUrl → 填写 usernameSelector/passwordSelector → 点击 submitSelector → 等待登录成功 → 提取凭证。

#### Scenario: 表单登录成功
- **WHEN** 配置了合法的 loginUrl、username、password 及对应选择器，且登录接口正常
- **THEN** 系统自动完成登录，提取 cookies/token 到内存，返回带凭证的 BrowserContext

#### Scenario: 登录超时
- **WHEN** 登录流程超过 auth.timeout（默认 30s）仍未成功
- **THEN** 系统抛出 AuthError，终止整个运行

#### Scenario: 登录元素未找到
- **WHEN** usernameSelector 或 passwordSelector 或 submitSelector 在页面上不存在
- **THEN** 系统抛出 AuthError，终止整个运行

### Requirement: 登录成功判定
系统 SHALL 支持两种登录成功判定方式：URL 包含指定字符串（type: "url"）或指定选择器出现（type: "selector"）。未配置 successWait 时默认等待 networkidle。

#### Scenario: URL 判定登录成功
- **WHEN** successWait 配置为 { type: "url", value: "/dashboard" }
- **THEN** 系统在 URL 包含 "/dashboard" 时判定登录成功

#### Scenario: 选择器判定登录成功
- **WHEN** successWait 配置为 { type: "selector", value: ".user-avatar" }
- **THEN** 系统在 ".user-avatar" 元素出现时判定登录成功

#### Scenario: 未配置 successWait
- **WHEN** successWait 未配置
- **THEN** 系统等待 networkidle 判定登录成功

### Requirement: 凭证复用
系统 SHALL 将登录凭证通过 Playwright storageState 注入到后续所有视口的 BrowserContext，凭证存内存不落盘，运行结束后销毁。

#### Scenario: 多页面共享凭证
- **WHEN** 认证成功后，系统遍历多个 pagePair 和 viewports
- **THEN** 每个 BrowserContext 都注入了相同的 storageState，无需重复登录

### Requirement: 跳过认证
系统 SHALL 支持 auth.skipAuth 配置为 true 时跳过认证流程，直接使用无凭证的 BrowserContext。

#### Scenario: skipAuth 为 true
- **WHEN** auth.skipAuth 配置为 true
- **THEN** 系统跳过登录流程，直接开始截图对比
