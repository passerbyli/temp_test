#!/bin/bash
# raw-to-wiki.sh — 从 raw/ 生成 wiki/ Markdown
# 用法:
#   bash raw-to-wiki.sh              # 全部转换
#   bash raw-to-wiki.sh us           # 只转换 US
#   bash raw-to-wiki.sh api          # 只转换 API

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET="${1:-all}"

cd "$VAULT_ROOT"

echo "🔄 raw → wiki 转换"
echo "   raw/US/*.xlsx → wiki/US/"
echo "   raw/API/*.xlsx → wiki/API/"

python3 << 'PYTHON_SCRIPT'
import openpyxl
import os
import re
import json
import yaml
from datetime import datetime

VAULT_ROOT = "."
RAW_US = os.path.join(VAULT_ROOT, "raw", "US")
RAW_API = os.path.join(VAULT_ROOT, "raw", "API")
WIKI_US = os.path.join(VAULT_ROOT, "wiki", "US")
WIKI_API = os.path.join(VAULT_ROOT, "wiki", "API")
SCHEME = os.path.join(VAULT_ROOT, "scheme")

TARGET = os.environ.get("TARGET", "all")
today = datetime.now().strftime("%Y-%m-%d")

def safe_name(s):
    return re.sub(r'[\\/:*?"<>|]', '', str(s).strip())

def parse_xlsx(filepath):
    wb = openpyxl.load_workbook(filepath, read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    wb.close()
    return rows

def write_wiki(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# ===== US 转换 =====
if TARGET in ("all", "us"):
    print("\n📂 US 转换...")
    us_files = [f for f in os.listdir(RAW_US) if f.endswith('.xlsx')] if os.path.exists(RAW_US) else []
    us_index = []

    for excel_file in us_files:
        rows = parse_xlsx(os.path.join(RAW_US, excel_file))
        print(f"   读取: {excel_file} ({len(rows)} 行)")

        for row in rows:
            if not row or not row[0]:
                continue

            us_id = str(row[0]).strip()
            title = str(row[1]).strip() if row[1] else ""
            module = str(row[2]).strip() if row[2] else "未分类"
            status = str(row[3]).strip() if row[3] else "未开始"
            priority = str(row[4]).strip() if row[4] else "P1"
            version = str(row[5]).strip() if row[5] else "v1.0"
            author = str(row[6]).strip() if row[6] else ""
            description = str(row[7]).strip() if row[7] else ""
            acceptance = str(row[8]).strip() if row[8] else ""
            related_apis = str(row[9]).strip() if row[9] else ""
            related_us = str(row[10]).strip() if row[10] else ""
            code_repos = str(row[11]).strip() if row[11] else ""
            test_status = str(row[12]).strip() if row[12] else "none"

            mod = safe_name(module)
            filename = f"{us_id}-{safe_name(title)}.md"
            filepath = os.path.join(WIKI_US, mod, filename)

            if os.path.exists(filepath):
                continue

            def fmt_links(text):
                if not text or text == "None":
                    return "  - 无"
                items = [x.strip() for x in text.split("|") if x.strip()]
                return "\n".join(f'  - "{x}"' for x in items) or "  - 无"

            def fmt_acceptance(text):
                if not text or text == "None":
                    return "- [ ] "
                items = [x.strip() for x in text.split("|") if x.strip()]
                return "\n".join(f"- [ ] {x}" for x in items)

            md = f"""---
id: {us_id}
title: "{title}"
module: "{module}"
status: {status}
priority: {priority}
version: {version}
author: "{author}"
created: {today}
updated: {today}
tags:
  - US
  - 模块/{module}
  - 状态/{status}
  - 优先级/{priority}
related_apis:
{fmt_links(related_apis)}
related_us:
{fmt_links(related_us)}
code_repos:
  - "{code_repos}"
test_status: {test_status}
---

# {us_id} {title}

## 需求描述

{description}

## 验收标准

{fmt_acceptance(acceptance)}

## 关联代码

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| {today} | v1.0 | 从 Excel 导入 |
"""
            write_wiki(filepath, md)
            us_index.append({"id": us_id, "title": title, "module": module, "status": status, "priority": priority, "version": version, "file": f"wiki/US/{mod}/{filename}"})

    # 写入 scheme 索引
    os.makedirs(SCHEME, exist_ok=True)
    with open(os.path.join(SCHEME, "us-index.json"), 'w', encoding='utf-8') as f:
        json.dump(us_index, f, ensure_ascii=False, indent=2)
    print(f"   ✅ US: {len(us_index)} 条 → wiki/US/ + scheme/us-index.json")

# ===== API 转换 =====
if TARGET in ("all", "api"):
    print("\n📂 API 转换...")
    api_files = [f for f in os.listdir(RAW_API) if f.endswith('.xlsx')] if os.path.exists(RAW_API) else []
    api_index = []

    for excel_file in api_files:
        rows = parse_xlsx(os.path.join(RAW_API, excel_file))
        print(f"   读取: {excel_file} ({len(rows)} 行)")

        for row in rows:
            if not row or not row[0]:
                continue

            api_id = str(row[0]).strip()
            title = str(row[1]).strip() if row[1] else ""
            module = str(row[2]).strip() if row[2] else "未分类"
            method = str(row[3]).strip().upper() if row[3] else "GET"
            path = str(row[4]).strip() if row[4] else "/api/v1/"
            status = str(row[5]).strip() if row[5] else "已上线"
            version = str(row[6]).strip() if row[6] else "v1.0"
            description = str(row[7]).strip() if row[7] else ""
            request_params = str(row[8]).strip() if row[8] else ""
            response_format = str(row[9]).strip() if row[9] else ""
            error_codes = str(row[10]).strip() if row[10] else ""
            related_us = str(row[11]).strip() if row[11] else ""

            mod = safe_name(module)
            filename = f"{api_id}-{safe_name(title)}.md"
            filepath = os.path.join(WIKI_API, mod, filename)

            if os.path.exists(filepath):
                continue

            def fmt_links(text):
                if not text or text == "None":
                    return "  - 无"
                items = [x.strip() for x in text.split("|") if x.strip()]
                return "\n".join(f'  - "{x}"' for x in items) or "  - 无"

            md = f"""---
id: {api_id}
title: "{title}"
module: "{module}"
method: {method}
path: {path}
status: {status}
version: {version}
created: {today}
updated: {today}
tags:
  - API
  - 模块/{module}
  - 方法/{method}
related_us:
{fmt_links(related_us)}
---

# {method} {path}

## 基本信息

| 属性 | 值 |
|------|-----|
| ID | {api_id} |
| 方法 | {method} |
| 路径 | `{path}` |
| 描述 | {description} |
| 状态 | {status} |

## 请求参数

{request_params or "待补充"}

## 响应格式

{response_format or "待补充"}

## 错误码

{error_codes or "待补充"}

## 关联 US

## 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| {today} | v1.0 | 从 Excel 导入 |
"""
            write_wiki(filepath, md)
            api_index.append({"id": api_id, "title": title, "module": module, "method": method, "path": path, "status": status, "file": f"wiki/API/{mod}/{filename}"})

    os.makedirs(SCHEME, exist_ok=True)
    with open(os.path.join(SCHEME, "api-index.json"), 'w', encoding='utf-8') as f:
        json.dump(api_index, f, ensure_ascii=False, indent=2)
    print(f"   ✅ API: {len(api_index)} 条 → wiki/API/ + scheme/api-index.json")

print("\n✅ raw → wiki 转换完成")
PYTHON_SCRIPT
