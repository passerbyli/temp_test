#!/bin/bash
# build-context.sh — 为 AI 工具构建 SDD 上下文
# 用法:
#   bash build-context.sh us US-001
#   bash build-context.sh module 用户中心
#   bash build-context.sh all

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$VAULT_ROOT/.claude/context"

cd "$VAULT_ROOT"
mkdir -p "$OUTPUT_DIR"

TYPE="${1:-}"
VALUE="${2:-}"

if [ -z "$TYPE" ]; then
    echo "用法: bash build-context.sh <类型> <值>"
    echo "  us US-XXX       — 按 US 编号"
    echo "  module 模块名    — 按模块名"
    echo "  all             — 全量"
    exit 1
fi

python3 << PYTHON_SCRIPT
import os
import re
import yaml
from datetime import datetime

VAULT_ROOT = "."
WIKI_DIR = os.path.join(VAULT_ROOT, "wiki")
SCHEME_DIR = os.path.join(VAULT_ROOT, "scheme")
OUTPUT_DIR = os.path.join(VAULT_ROOT, ".claude", "context")

TYPE = "$TYPE"
VALUE = "$VALUE"

def read_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return ""

def parse_fm(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read()
        if not c.startswith("---"):
            return {}
        p = c.split("---", 2)
        return yaml.safe_load(p[1]) or {} if len(p) >= 3 else {}
    except:
        return {}

def find_file(directory, prefix):
    for root, dirs, files in os.walk(directory):
        for f in files:
            if f.startswith(prefix) and f.endswith('.md'):
                return os.path.join(root, f)
    return None

timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
parts = []

if TYPE == "us":
    us_file = find_file(os.path.join(WIKI_DIR, "US"), VALUE)
    if not us_file:
        print(f"❌ 未找到: {VALUE}")
        exit(1)

    fm = parse_fm(us_file)
    parts.append(f"# SDD 上下文 — {VALUE} {fm.get('title', '')}")
    parts.append(f"> {timestamp}\n")
    parts.append(read_file(us_file))

    # 关联 API
    for ref in fm.get("related_apis", []) or []:
        m = re.search(r'API-\d+', str(ref))
        if m:
            api_file = find_file(os.path.join(WIKI_DIR, "API"), m.group(0))
            if api_file:
                parts.append(f"\n---\n\n{read_file(api_file)}")

    # 功能地图
    mod = fm.get("module", "")
    if mod:
        map_file = os.path.join(WIKI_DIR, "功能地图", f"{mod}.md")
        if os.path.exists(map_file):
            parts.append(f"\n---\n\n{read_file(map_file)}")

    # 代码上下文
    code_dir = os.path.join(VAULT_ROOT, "raw", "代码仓")
    if os.path.exists(code_dir):
        for f in os.listdir(code_dir):
            if f.endswith('.md'):
                parts.append(f"\n---\n\n{read_file(os.path.join(code_dir, f))}")

    name = f"context-{VALUE}.md"

elif TYPE == "module":
    parts.append(f"# SDD 上下文 — 模块: {VALUE}")
    parts.append(f"> {timestamp}\n")

    for root, dirs, files in os.walk(os.path.join(WIKI_DIR, "US")):
        for f in files:
            if f.endswith('.md') and not f.startswith('_'):
                fp = os.path.join(root, f)
                fm = parse_fm(fp)
                if fm.get("module") == VALUE:
                    parts.append(read_file(fp))
                    parts.append("\n---\n")

    for root, dirs, files in os.walk(os.path.join(WIKI_DIR, "API")):
        for f in files:
            if f.endswith('.md') and not f.startswith('_'):
                fp = os.path.join(root, f)
                fm = parse_fm(fp)
                if fm.get("module") == VALUE:
                    parts.append(read_file(fp))
                    parts.append("\n---\n")

    map_file = os.path.join(WIKI_DIR, "功能地图", f"{VALUE}.md")
    if os.path.exists(map_file):
        parts.append(read_file(map_file))

    name = f"context-module-{VALUE}.md"

elif TYPE == "all":
    parts.append(f"# SDD 全量上下文")
    parts.append(f"> {timestamp}\n")

    for root, dirs, files in os.walk(WIKI_DIR):
        for f in files:
            if f.endswith('.md') and not f.startswith('_'):
                parts.append(read_file(os.path.join(root, f)))
                parts.append("\n---\n")

    name = "context-all.md"

else:
    print(f"❌ 未知类型: {TYPE}")
    exit(1)

output = os.path.join(OUTPUT_DIR, name)
with open(output, 'w', encoding='utf-8') as f:
    f.write("\n".join(parts))

print(f"✅ {output} ({os.path.getsize(output)} bytes)")
PYTHON_SCRIPT
