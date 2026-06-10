请为 `skills/lhm-code-remediation` 增加多 worker 批处理能力。

要求：

1. 将 pending tasks 按文件分组生成 batches
2. 每个 batch 包含 1~3 个文件
3. 支持多个 worker 并发处理 batch
4. 不允许两个 worker 同时处理同一个文件
5. 增加 `.lhm-code-remediation/locks/` 文件锁机制
6. 每个 batch 处理完成后必须执行 verify
7. verify 失败必须回滚该 batch 并写入 failed.json
8. verify 成功后更新 batch 状态为 verified
9. 一轮 batch 全部完成后执行 rescan
10. 不要让单个 worker 读取全部 pending.json
11. worker 只能读取自己 batch 对应的文件和任务
12. 所有运行产物写入 `.lhm-code-remediation/`