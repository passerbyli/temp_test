---
description: 检查 US 测试覆盖情况
---

# 测试覆盖检查

扫描 `wiki/US/` 的 `test_status` 字段，统计覆盖率。

## 用法

```
/test-coverage              # 全部 US
/test-coverage US-001       # 指定 US
```

## 输出

- 完整/部分/未覆盖统计
- 按模块覆盖率
- 按优先级排序的未覆盖清单
