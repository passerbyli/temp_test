---
description: 为 AI 工具构建 SDD 上下文文件
---

# 构建 AI 上下文

收集 wiki/ 中的相关文件，生成可喂给 Claude/OpenCode 的上下文。

## 用法

```
/build-context us US-001
/build-context module 用户中心
/build-context all
```

## 步骤

1. 运行: `bash "00-系统/脚本/build-context.sh" <类型> <值>`
2. 读取生成的文件并展示
3. 提示使用方式
