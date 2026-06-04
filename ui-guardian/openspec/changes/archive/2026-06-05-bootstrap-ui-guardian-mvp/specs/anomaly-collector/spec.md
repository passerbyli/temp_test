## ADDED Requirements

### Requirement: Collector 注册时机
系统 SHALL 在页面导航（goto）前调用 `collector.attach(page)` 注册监听器，确保覆盖页面加载全过程。

#### Scenario: 监听器在 goto 前注册
- **WHEN** processSide 处理某侧页面
- **THEN** collector.attach() 在 page.goto() 之前调用

### Requirement: 控制台异常采集
系统 SHALL 采集 console.error 和 console.warn 的 type、text、timestamp。

#### Scenario: 采集 console error
- **WHEN** 页面加载过程中产生 console.error("Failed to load resource")
- **THEN** collector.collect() 的 console 数组包含 { type: "error", text: "Failed to load resource", timestamp: <number> }

### Requirement: 网络请求失败采集
系统 SHALL 采集请求失败（4xx/5xx）的 url、method、status、statusText、timestamp。

#### Scenario: 采集 502 请求
- **WHEN** 页面加载过程中 GET /api/user 返回 502
- **THEN** collector.collect() 的 network 数组包含 { url: "/api/user", method: "GET", status: 502, statusText: "Bad Gateway", timestamp: <number> }

### Requirement: JS 异常采集
系统 SHALL 采集未捕获的 page error 的 message、stack、timestamp。

#### Scenario: 采集未捕获异常
- **WHEN** 页面执行过程中抛出未捕获的 TypeError
- **THEN** collector.collect() 的 errors 数组包含 { message: "TypeError: ...", stack: "...", timestamp: <number> }

### Requirement: 异常按页面归档
系统 SHALL 将异常数据按 pageId + baseline/candidate 分侧归档到 logs/console.json、logs/network.json、logs/errors.json。

#### Scenario: 异常日志归档
- **WHEN** 某页面的 baseline 侧有 2 个 console error，candidate 侧有 1 个 network failure
- **THEN** logs/console.json 该 pageId 的 baseline 数组有 2 条记录，candidate 数组为空
- **AND** logs/network.json 该 pageId 的 candidate 数组有 1 条记录，baseline 数组为空
