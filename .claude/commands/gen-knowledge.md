---
description: 为模块生成功能地图和产品演进时间线
---

# 生成知识关联页

扫描 `wiki/US/` 和 `wiki/API/`，按模块聚合并生成功能地图。

## 用法

```
/gen-knowledge              # 所有模块
/gen-knowledge 用户中心      # 指定模块
```

## 步骤

1. 运行: `bash "00-系统/脚本/gen-knowledge.sh" [模块名]`
2. 验证 `wiki/功能地图/` 下的文件
3. 报告结果
