#!/usr/bin/env python3
import argparse
import csv
import json
import re
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


DEFAULT_CSV = "/Users/naim/Downloads/deine-fenster24_remaining-fixes_developer.csv"
DEFAULT_SOURCE = "reports/live-after-exact-grid-prune/get-tabs-live.json"
UPDATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=update_option"

PRODUCT_STATIC = {
    "Window": "__static_ksf__",
}

PROFILE_IDS = {
    "Ideal 8000": "3",
    "Salamander 76 MD": "5",
}

CONFIG_WING_IDS = {
    "3-part": "16",
}


def money(value):
    try:
        return Decimal(str(value).replace(",", ".")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"invalid money value: {value!r}") from exc


def compact_combo(ids):
    return json.dumps([str(item) for item in ids], separators=(",", ":"))


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


def post_json(url, payload, timeout=90):
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


def include_row(row, include_unconfirmed):
    action = row.get("Action", "")
    if not include_unconfirmed and "client must confirm" in action.lower():
        return False
    return True


def combo_key_for(row):
    static_code = PRODUCT_STATIC.get(row["Product"])
    profile_id = PROFILE_IDS.get(row["Profile"])
    wing_id = CONFIG_WING_IDS.get(row["Configuration"])
    match = re.search(r"id(\d+)", row.get("Opening", ""))
    opening_id = match.group(1) if match else None
    if not all([static_code, profile_id, wing_id, opening_id]):
        return None
    return compact_combo([static_code, profile_id, wing_id, opening_id])


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


def build_payloads(csv_rows, indexes, include_unconfirmed=False):
    corrections = defaultdict(dict)
    skipped = Counter()
    blockers = []

    for row in csv_rows:
        if not include_row(row, include_unconfirmed):
            skipped["unconfirmed_conflict_rows"] += 1
            continue
        combo_key = combo_key_for(row)
        if not combo_key:
            skipped["unmapped_rows"] += 1
            continue
        parent_ids = indexes["parent_by_combo"].get(combo_key, set())
        if len(parent_ids) != 1:
            blockers.append(f"{combo_key}: expected one parent, found {sorted(parent_ids)}")
            continue
        parent_id = next(iter(parent_ids))
        matches = [
            item for item in indexes["rows_by_parent"][parent_id]
            if item.get("combo_option_ids") == combo_key
            and str(item.get("width")).strip() == row["Width_mm"]
            and str(item.get("height")).strip() == row["Height_mm"]
        ]
        if len(matches) != 1:
            blockers.append(f"{combo_key} {row['Width_mm']}x{row['Height_mm']}: expected one row, found {len(matches)}")
            continue
        target = str(money(row["Target_Excel_Price_EUR"]))
        current = str(money(matches[0]["price"]))
        if current == target:
            skipped["already_correct"] += 1
            continue
        corrections[parent_id][str(matches[0]["id"])] = target

    payloads = []
    for parent_id, row_corrections in sorted(corrections.items(), key=lambda item: int(item[0])):
        option = indexes["option_by_id"].get(parent_id)
        if not option:
            blockers.append(f"parent {parent_id}: option not found")
            continue
        if indexes["combo_options_by_parent"].get(parent_id):
            blockers.append(f"parent {parent_id}: has combo_options rows")
            continue
        combo_keys = indexes["combo_keys_by_parent"].get(parent_id, set())
        if len(combo_keys) != 1:
            blockers.append(f"parent {parent_id}: has {len(combo_keys)} combo groups")
            continue
        combo_key = next(iter(combo_keys))
        extra = option_extra(option)
        if compact_combo(extra.get("combo_option_ids", [])) != combo_key:
            blockers.append(f"parent {parent_id}: extra_json combo mismatch")
            continue
        height_width_rows = []
        for item in sorted(indexes["rows_by_parent"][parent_id], key=lambda value: int(value.get("id", 0))):
            row_id = str(item.get("id"))
            height_width_rows.append({
                "height": str(item.get("height", "")).strip(),
                "width": str(item.get("width", "")).strip(),
                "price": str(row_corrections.get(row_id, money(item.get("price")))),
            })
        extra["height_width_rows"] = sorted(height_width_rows, key=lambda item: (int(item["height"]), int(item["width"])))
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
            "_corrections": len(row_corrections),
        })
    return payloads, blockers, skipped


def write_report(path, report):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Apply pending CSV price rows, skipping unconfirmed conflict rows by default.")
    parser.add_argument("--csv", default=DEFAULT_CSV)
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--report", default="reports/pending-csv-price-apply-report.json")
    parser.add_argument("--include-unconfirmed", action="store_true")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    csv_rows = read_csv(args.csv)
    data = json.loads(Path(args.source).read_text(encoding="utf-8"))
    indexes = build_indexes(data)
    payloads, blockers, skipped = build_payloads(csv_rows, indexes, args.include_unconfirmed)

    report = {
        "mode": "apply" if args.apply else "dry-run",
        "csv": args.csv,
        "source": args.source,
        "payload_count": len(payloads),
        "corrections": sum(item["_corrections"] for item in payloads),
        "skipped": dict(skipped),
        "blockers": blockers,
        "payloads": [
            {"id": item["id"], "label": item["label"], "corrections": item["_corrections"]}
            for item in payloads
        ],
        "applied": [],
    }

    if blockers:
        write_report(args.report, report)
        print(json.dumps({key: report[key] for key in ["mode", "payload_count", "corrections", "skipped", "blockers"]}, indent=2, ensure_ascii=False))
        print(f"Refusing to apply because blockers exist. Report: {args.report}", file=sys.stderr)
        return 2 if args.apply else 0

    if args.apply:
        for index, payload in enumerate(payloads, start=1):
            post_json(UPDATE_URL, clean_payload(payload))
            report["applied"].append({"id": payload["id"], "corrections": payload["_corrections"]})
            print(f"pending_csv_update {index}/{len(payloads)} parent={payload['id']}")
            sys.stdout.flush()
            time.sleep(0.08)

    write_report(args.report, report)
    print(json.dumps({key: report[key] for key in ["mode", "payload_count", "corrections", "skipped"]}, indent=2, ensure_ascii=False))
    print("report", args.report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
