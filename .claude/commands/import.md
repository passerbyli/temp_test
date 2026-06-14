---
description: 从 raw/ 导入 Excel 数据到 wiki/
---

# 导入数据

从 `raw/` 目录读取 Excel，生成 `wiki/` Markdown 和 `scheme/` 索引。

## 用法

```
/import              # 全部导入
/import us           # 只导入 US
/import api          # 只导入 API
```

## 步骤

1. 检查 `raw/US/` 和 `raw/API/` 下是否有 .xlsx 文件
2. 运行: `bash "00-系统/脚本/raw-to-wiki.sh" [us|api]`
3. 运行: `bash "00-系统/脚本/gen-scheme.sh"` 更新索引
4. 报告结果

## 前置

将 Excel 放入 `raw/US/` 或 `raw/API/`
