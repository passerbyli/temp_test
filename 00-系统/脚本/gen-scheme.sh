#!/bin/bash
# gen-scheme.sh — 从 wiki/ 生成 scheme/ 结构化索引
# 生成: us-index.json, api-index.json, module-map.json, tags.json

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$VAULT_ROOT"
mkdir -p scheme

python3 << 'PYTHON_SCRIPT'
import os
import json
import yaml
from datetime import datetime

VAULT_ROOT = "."
WIKI_DIR = os.path.join(VAULT_ROOT, "wiki")
SCHEME_DIR = os.path.join(VAULT_ROOT, "scheme")

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

print("🔄 生成 scheme/ 索引...")

# 扫描所有 wiki 文件
us_list = []
api_list = []
all_tags = set()
module_map = {}

for root, dirs, files in os.walk(WIKI_DIR):
    for f in files:
        if not f.endswith('.md') or f.startswith('_'):
            continue
        filepath = os.path.join(root, f)
        fm = parse_frontmatter(filepath)
        rel = os.path.relpath(filepath, VAULT_ROOT)

        # 分类
        if rel.startswith("wiki/US/") and fm.get("id", "").startswith("US-"):
            entry = {k: fm.get(k) for k in ["id", "title", "module", "status", "priority", "version", "author", "test_status", "related_apis", "related_us", "code_repos"]}
            entry["file"] = rel
            us_list.append(entry)

            mod = fm.get("module", "未分类")
            module_map.setdefault(mod, {"us": [], "api": []})
            module_map[mod]["us"].append(fm.get("id"))

        elif rel.startswith("wiki/API/") and fm.get("id", "").startswith("API-"):
            entry = {k: fm.get(k) for k in ["id", "title", "module", "method", "path", "status", "version", "related_us"]}
            entry["file"] = rel
            api_list.append(entry)

            mod = fm.get("module", "未分类")
            module_map.setdefault(mod, {"us": [], "api": []})
            module_map[mod]["api"].append(fm.get("id"))

        # 收集标签
        tags = fm.get("tags", [])
        if isinstance(tags, list):
            for t in tags:
                all_tags.add(str(t))

# 写入索引
with open(os.path.join(SCHEME_DIR, "us-index.json"), 'w', encoding='utf-8') as f:
    json.dump(us_list, f, ensure_ascii=False, indent=2)
print(f"   ✅ us-index.json ({len(us_list)} 条)")

with open(os.path.join(SCHEME_DIR, "api-index.json"), 'w', encoding='utf-8') as f:
    json.dump(api_list, f, ensure_ascii=False, indent=2)
print(f"   ✅ api-index.json ({len(api_list)} 条)")

with open(os.path.join(SCHEME_DIR, "module-map.json"), 'w', encoding='utf-8') as f:
    json.dump(module_map, f, ensure_ascii=False, indent=2)
print(f"   ✅ module-map.json ({len(module_map)} 个模块)")

with open(os.path.join(SCHEME_DIR, "tags.json"), 'w', encoding='utf-8') as f:
    json.dump(sorted(all_tags), f, ensure_ascii=False, indent=2)
print(f"   ✅ tags.json ({len(all_tags)} 个标签)")

print(f"\n✅ scheme/ 生成完成")
PYTHON_SCRIPT
