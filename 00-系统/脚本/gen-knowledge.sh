#!/bin/bash
# gen-knowledge.sh — 为每个模块生成知识关联页
# 用法: bash gen-knowledge.sh [模块名]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET_MODULE="${1:-}"

cd "$VAULT_ROOT"

python3 << 'PYTHON_SCRIPT'
import os
import json
import yaml
from datetime import datetime

VAULT_ROOT = "."
WIKI_DIR = os.path.join(VAULT_ROOT, "wiki")
KNOWLEDGE_DIR = os.path.join(WIKI_DIR, "功能地图")
SCHEME_DIR = os.path.join(VAULT_ROOT, "scheme")
TARGET_MODULE = os.environ.get("TARGET_MODULE", "")

os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

def parse_frontmatter(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if not content.startswith("---"):
            return {}
        parts = content.split("---", 2)
        return yaml.safe_load(parts[1]) or {} if len(parts) >= 3 else {}
    except:
        return {}

# 按模块聚合
us_by_module = {}
api_by_module = {}

for root, dirs, files in os.walk(os.path.join(WIKI_DIR, "US")):
    for f in files:
        if f.startswith("US-") and f.endswith(".md"):
            fm = parse_frontmatter(os.path.join(root, f))
            mod = fm.get("module", "未分类")
            us_by_module.setdefault(mod, []).append(fm)

for root, dirs, files in os.walk(os.path.join(WIKI_DIR, "API")):
    for f in files:
        if f.startswith("API-") and f.endswith(".md"):
            fm = parse_frontmatter(os.path.join(root, f))
            mod = fm.get("module", "未分类")
            api_by_module.setdefault(mod, []).append(fm)

all_modules = set(list(us_by_module.keys()) + list(api_by_module.keys()))
if TARGET_MODULE:
    all_modules = {TARGET_MODULE} if TARGET_MODULE in all_modules else set()

today = datetime.now().strftime("%Y-%m-%d")

for module in sorted(all_modules):
    us_list = sorted(us_by_module.get(module, []), key=lambda x: x.get("id", ""))
    api_list = sorted(api_by_module.get(module, []), key=lambda x: x.get("id", ""))

    content = f"""---
type: knowledge
category: 功能地图
module: "{module}"
us_count: {len(us_list)}
api_count: {len(api_list)}
tags:
  - 功能地图
  - 模块/{module}
---

# {module} — 功能地图

**US**: {len(us_list)} | **API**: {len(api_list)}

## US

| 编号 | 标题 | 状态 | 优先级 |
|------|------|------|--------|
"""
    for us in us_list:
        content += f"| {us.get('id','')} | {us.get('title','')} | {us.get('status','')} | {us.get('priority','')} |\n"

    content += f"""
## API

| 编号 | 接口 | 方法 | 路径 |
|------|------|------|------|
"""
    for api in api_list:
        content += f"| {api.get('id','')} | {api.get('title','')} | {api.get('method','')} | `{api.get('path','')}` |\n"

    filepath = os.path.join(KNOWLEDGE_DIR, f"{module}.md")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ {module}.md ({len(us_list)} US, {len(api_list)} API)")

# 产品演进时间线
all_us = []
for uss in us_by_module.values():
    all_us.extend(uss)

version_groups = {}
for us in all_us:
    ver = us.get("version", "v0.0")
    version_groups.setdefault(ver, []).append(us)

if version_groups:
    timeline = f"""---
type: knowledge
category: 产品演进
tags:
  - 产品演进
---

# 产品演进时间线

"""
    for ver in sorted(version_groups.keys()):
        uss = version_groups[ver]
        timeline += f"## {ver} ({len(uss)} 个 US)\n\n"
        timeline += "| 编号 | 标题 | 模块 | 状态 |\n|------|------|------|------|\n"
        for us in sorted(uss, key=lambda x: x.get("id", "")):
            timeline += f"| {us.get('id','')} | {us.get('title','')} | {us.get('module','')} | {us.get('status','')} |\n"
        timeline += "\n"

    with open(os.path.join(WIKI_DIR, "产品演进", "产品演进时间线.md"), 'w', encoding='utf-8') as f:
        f.write(timeline)
    print(f"  ✅ 产品演进时间线.md ({len(version_groups)} 个版本)")

print(f"\n✅ 功能地图生成完成")
PYTHON_SCRIPT
