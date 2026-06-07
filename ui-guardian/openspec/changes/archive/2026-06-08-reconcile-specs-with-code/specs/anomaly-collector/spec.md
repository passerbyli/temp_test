## MODIFIED Requirements

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
系统 SHALL 采集请求失败（status >= 400）的 url、method、status、statusText、timestamp。

#### Scenario: 采集 502 请求
- **WHEN** 页面加载过程中 GET /api/user 返回 502
- **THEN** collector.collect() 的 network 数组包含 { url: "/api/user", method: "GET", status: 502, statusText: "Bad Gateway", timestamp: <number> }

### Requirement: JS 异常采集
系统 SHALL 采集未捕获的 page error 的 message、stack、timestamp。

#### Scenario: 采集未捕获异常
- **WHEN** 页面执行过程中抛出未捕获的 TypeError
- **THEN** collector.collect() 的 errors 数组包含 { message: "TypeError: ...", stack: "...", timestamp: <number> }

### Requirement: 异常内存收集
系统 SHALL 将异常数据收集到内存中，通过 collector.collect() 返回完整的 AnomalyResult。系统 SHALL 在 baseline 和 candidate 之间通过 collector.reset() 重置状态。异常数据通过 PageSideResult 返回，最终包含在 HTML 报告和 data.json 中展示。

#### Scenario: baseline 和 candidate 异常独立收集
- **WHEN** baseline 侧有 2 个 console error，candidate 侧有 1 个 network failure
- **THEN** baseline 的 anomalies.console 有 2 条记录，candidate 的 anomalies.network 有 1 条记录

#### Scenario: collector reset 清除状态
- **WHEN** baseline 处理完成后调用 collector.reset()
- **THEN** collector.collect() 返回空的 anomalies（console、network、errors 均为空数组）
