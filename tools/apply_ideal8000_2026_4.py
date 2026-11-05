#!/usr/bin/env python3
import argparse
import csv
import json
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


DEFAULT_SOURCE = "/Users/naim/WWW/strato-project-backups/codex-20260811-021102-before-ideal8000-2026-4-apply/remote-data/get-tabs-live.json"
DEFAULT_ROWS = "reports/original-excel-price-rows.csv"
SOURCE_FILE = "Fenster/Aluplast Ideal 8000/3-Teilig/2026-4-8000-DKL-Fest im Rahmen-DKR.xlsx"
COMBO_KEYS = [
    '["__static_ksf__","3","16","502"]',
    '["__static_ksf__","3","16","1078"]',
    '["__static_ksf__","3","16","1079"]',
]
UPDATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=update_option"


def money(value):
    try:
        return Decimal(str(value).replace(",", ".")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"invalid money value: {value!r}") from exc


def read_csv(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def iter_options(data):
    for tab in data.get("tabs", []) or []:
        for option in tab.get("options", []) or []:
            yield option
        for subtab in tab.get("subtabs", []) or []:
            for option in subtab.get("options", []) or []:
                yield option
            for section in subtab.get("sections", []) or []:
                for option in section.get("options", []) or []:
                    yield option


def option_extra(option):
    try:
        return json.loads(option.get("extra_json") or "{}")
    except json.JSONDecodeError:
        return {}


def post_json(url, payload, timeout=120):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8", errors="replace")
    parsed = json.loads(body)
    if not parsed.get("success"):
        raise RuntimeError(f"request failed: {parsed}")
    return parsed


def clean_payload(payload):
    return {key: value for key, value in payload.items() if not key.startswith("_")}


def desired_rows(rows):
    desired = []
    for row in rows:
        if row["relative_path"] != SOURCE_FILE:
            continue
        desired.append({
            "height": str(row["height"]).strip(),
            "width": str(row["width"]).strip(),
            "price": str(money(row["price"])),
        })
    return sorted(desired, key=lambda item: (int(item["height"]), int(item["width"])))


def build_indexes(data):
    option_by_id = {str(option.get("id")): option for option in iter_options(data)}
    rows_by_parent = defaultdict(list)
    combo_keys_by_parent = defaultdict(set)
    parent_by_combo = defaultdict(set)
    combo_options_by_parent = Counter()

    for row in data.get("height_width_prices", []) or []:
        parent_id = str(row.get("option_parent_id"))
        combo_key = str(row.get("combo_option_ids"))
        rows_by_parent[parent_id].append(row)
        combo_keys_by_parent[parent_id].add(combo_key)
        parent_by_combo[combo_key].add(parent_id)

    for row in data.get("combo_options", []) or []:
        combo_options_by_parent[str(row.get("option_parent_id"))] += 1

    return {
        "option_by_id": option_by_id,
        "rows_by_parent": rows_by_parent,
        "combo_keys_by_parent": combo_keys_by_parent,
        "parent_by_combo": parent_by_combo,
        "combo_options_by_parent": combo_options_by_parent,
    }


def compare(current_rows, wanted_rows):
    current_by_size = {
        (str(row.get("width")).strip(), str(row.get("height")).strip()): str(money(row.get("price")))
        for row in current_rows
    }
    wanted_by_size = {(row["width"], row["height"]): row["price"] for row in wanted_rows}
    return {
        "updates": sum(1 for key, price in wanted_by_size.items() if key in current_by_size and current_by_size[key] != price),
        "inserts": sum(1 for key in wanted_by_size if key not in current_by_size),
        "deletes": sum(1 for key in current_by_size if key not in wanted_by_size),
        "already_correct": sum(1 for key, price in wanted_by_size.items() if current_by_size.get(key) == price),
        "current_rows": len(current_by_size),
        "wanted_rows": len(wanted_by_size),
    }


def build_payloads(data, wanted_rows):
    indexes = build_indexes(data)
    payloads = []
    blockers = []
    comparisons = []

    for combo_key in COMBO_KEYS:
        parent_ids = indexes["parent_by_combo"].get(combo_key, set())
        if len(parent_ids) != 1:
            blockers.append(f"{combo_key}: expected one parent, found {sorted(parent_ids)}")
            continue
        parent_id = next(iter(parent_ids))
        option = indexes["option_by_id"].get(parent_id)
        if not option:
            blockers.append(f"parent {parent_id}: option not found")
            continue
        if indexes["combo_options_by_parent"].get(parent_id, 0):
            blockers.append(f"parent {parent_id}: has combo_options rows")
            continue
        combo_groups = indexes["combo_keys_by_parent"].get(parent_id, set())
        if combo_groups != {combo_key}:
            blockers.append(f"parent {parent_id}: expected only {combo_key}, found {sorted(combo_groups)}")
            continue
        extra = option_extra(option)
        if json.dumps(extra.get("combo_option_ids", []), separators=(",", ":")) != combo_key:
            blockers.append(f"parent {parent_id}: extra_json combo mismatch")
            continue
        comparisons.append({"combo_key": combo_key, "parent_id": parent_id, **compare(indexes["rows_by_parent"][parent_id], wanted_rows)})

        extra["height_width_rows"] = wanted_rows
        payloads.append({
            "id": parent_id,
            "label": option.get("label") or "",
            "value_key": option.get("value_key") or "",
            "image_url": option.get("image_url") or "",
            "price": str(option.get("price") or "0"),
            "extra_json": json.dumps(extra, ensure_ascii=False, separators=(",", ":")),
            "section_id": option.get("section_id") or "",
            "option_type": option.get("option_type") or "",
            "depends_on": option.get("depends_on") or "",
            "_combo_key": combo_key,
            "_rows": len(wanted_rows),
        })

    return payloads, blockers, comparisons


def write_report(path, report):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Apply Ideal 8000 3-part conflict values from 2026-4 Excel file.")
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--rows", default=DEFAULT_ROWS)
    parser.add_argument("--report", default="reports/ideal8000-2026-4-apply-report.json")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    data = json.loads(Path(args.source).read_text(encoding="utf-8"))
    wanted_rows = desired_rows(read_csv(args.rows))
    payloads, blockers, comparisons = build_payloads(data, wanted_rows)
    report = {
        "mode": "apply" if args.apply else "dry-run",
        "source_json": args.source,
        "source_excel_file": SOURCE_FILE,
        "target_combo_keys": COMBO_KEYS,
        "wanted_rows_per_combo": len(wanted_rows),
        "payload_count": len(payloads),
        "comparisons": comparisons,
        "summary": {
            "updates": sum(item["updates"] for item in comparisons),
            "inserts": sum(item["inserts"] for item in comparisons),
            "deletes": sum(item["deletes"] for item in comparisons),
            "already_correct": sum(item["already_correct"] for item in comparisons),
        },
        "blockers": blockers,
        "applied": [],
    }

    if len(wanted_rows) != 206:
        report["blockers"].append(f"expected 206 Excel rows from {SOURCE_FILE}, found {len(wanted_rows)}")

    if report["blockers"]:
        write_report(args.report, report)
        print(json.dumps({key: report[key] for key in ["mode", "wanted_rows_per_combo", "payload_count", "summary", "blockers"]}, indent=2, ensure_ascii=False))
        print(f"Refusing to apply because blockers exist. Report: {args.report}", file=sys.stderr)
        return 2 if args.apply else 0

    if args.apply:
        for index, payload in enumerate(payloads, start=1):
            post_json(UPDATE_URL, clean_payload(payload))
            report["applied"].append({"id": payload["id"], "combo_key": payload["_combo_key"], "rows": payload["_rows"]})
            print(f"ideal8000_2026_4_update {index}/{len(payloads)} parent={payload['id']}")
            sys.stdout.flush()
            time.sleep(0.08)

    write_report(args.report, report)
    print(json.dumps({key: report[key] for key in ["mode", "wanted_rows_per_combo", "payload_count", "summary"]}, indent=2, ensure_ascii=False))
    print("report", args.report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
