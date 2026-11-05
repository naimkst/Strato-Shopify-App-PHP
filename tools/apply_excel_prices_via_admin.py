#!/usr/bin/env python3
import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


DEFAULT_SOURCE = "/Users/naim/WWW/strato-project-backups/codex-20260811-004134-before-original-excel-http-apply/remote-data/get-tabs-live.json"
DEFAULT_CHANGES = "reports/original-excel-price-changes-pre-http-apply.csv"
UPDATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=update_option"
CREATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=create_option"


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
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"non-JSON response: {body[:500]}") from exc
    if not parsed.get("success"):
        raise RuntimeError(f"request failed: {parsed}")
    return parsed


def build_indexes(data):
    option_by_id = {str(option.get("id")): option for option in iter_options(data)}
    hw_by_parent = defaultdict(list)
    combo_keys_by_parent = defaultdict(set)
    combo_options_by_parent = Counter()

    for row in data.get("height_width_prices", []) or []:
        parent_id = str(row.get("option_parent_id"))
        hw_by_parent[parent_id].append(row)
        combo_keys_by_parent[parent_id].add(row.get("combo_option_ids", ""))

    for row in data.get("combo_options", []) or []:
        combo_options_by_parent[str(row.get("option_parent_id"))] += 1

    return {
        "option_by_id": option_by_id,
        "hw_by_parent": hw_by_parent,
        "combo_keys_by_parent": combo_keys_by_parent,
        "combo_options_by_parent": combo_options_by_parent,
    }


def build_update_payloads(changes, indexes):
    corrections_by_parent_row = defaultdict(dict)
    inserts_by_parent = defaultdict(list)
    blockers = []
    skipped = Counter()

    for row in changes:
        action = row["action"]
        if action in {"update", "update_duplicate"}:
            corrections_by_parent_row[row["option_parent_id"]][row["row_id"]] = row["target_price"]
        elif action == "insert":
            inserts_by_parent[row["option_parent_id"]].append(row)
        elif action in {"conflict", "create_parent_insert", "already_correct", "already_correct_duplicate"}:
            skipped[action] += 1
        else:
            skipped[action] += 1

    payloads = []
    parent_ids = sorted(set(corrections_by_parent_row) | set(inserts_by_parent), key=lambda value: int(value))
    for parent_id in parent_ids:
        option = indexes["option_by_id"].get(parent_id)
        current_rows = indexes["hw_by_parent"].get(parent_id, [])
        combo_keys = indexes["combo_keys_by_parent"].get(parent_id, set())

        if not option:
            blockers.append(f"parent {parent_id}: option not found")
            continue
        if indexes["combo_options_by_parent"].get(parent_id, 0):
            blockers.append(f"parent {parent_id}: has combo_options rows")
            continue
        if len(combo_keys) != 1:
            blockers.append(f"parent {parent_id}: has {len(combo_keys)} combo groups")
            continue

        combo_key = next(iter(combo_keys))
        extra = option_extra(option)
        if compact_combo(extra.get("combo_option_ids", [])) != combo_key:
            blockers.append(f"parent {parent_id}: extra_json combo_option_ids mismatch")
            continue

        row_payloads = []
        for db_row in sorted(current_rows, key=lambda item: int(item.get("id", 0))):
            row_id = str(db_row.get("id"))
            row_payloads.append({
                "height": str(db_row.get("height", "")).strip(),
                "width": str(db_row.get("width", "")).strip(),
                "price": str(corrections_by_parent_row[parent_id].get(row_id, money(db_row.get("price")))),
            })

        existing_size_keys = {(item["width"], item["height"]) for item in row_payloads}
        for insert in sorted(inserts_by_parent.get(parent_id, []), key=lambda item: (int(item["height"]), int(item["width"]))):
            size_key = (insert["width"], insert["height"])
            if size_key in existing_size_keys:
                blockers.append(f"parent {parent_id}: insert already exists for {size_key}")
                continue
            row_payloads.append({
                "height": insert["height"],
                "width": insert["width"],
                "price": insert["target_price"],
            })
            existing_size_keys.add(size_key)

        combo_ids = json.loads(combo_key)
        extra["combo_option_ids"] = combo_ids
        extra["height_width_rows"] = sorted(row_payloads, key=lambda item: (int(item["height"]), int(item["width"])))

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
            "_corrections": len(corrections_by_parent_row.get(parent_id, {})),
            "_inserts": len(inserts_by_parent.get(parent_id, [])),
            "_rows": len(row_payloads),
        })

    return payloads, blockers, skipped


def build_create_payloads(changes):
    by_combo = defaultdict(list)
    for row in changes:
        if row["action"] == "create_parent_insert":
            by_combo[row["combo_key"]].append(row)

    payloads = []
    for combo_key, rows in sorted(by_combo.items()):
        combo_ids = json.loads(combo_key)
        height_width_rows = [
            {"height": row["height"], "width": row["width"], "price": row["target_price"]}
            for row in sorted(rows, key=lambda item: (int(item["height"]), int(item["width"])))
        ]
        payloads.append({
            "subtab_id": 1,
            "label": "HW Combo: " + " > ".join(combo_ids),
            "value_key": "",
            "image_url": "",
            "price": "0",
            "extra_json": json.dumps({
                "combo_option_ids": combo_ids,
                "height_width_rows": height_width_rows,
            }, ensure_ascii=False, separators=(",", ":")),
            "section_id": "",
            "option_type": "",
            "depends_on": "",
            "_combo_key": combo_key,
            "_rows": len(height_width_rows),
        })
    return payloads


def clean_payload(payload):
    return {key: value for key, value in payload.items() if not key.startswith("_")}


def write_report(path, report):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Apply non-conflicting original Excel prices via existing admin HTTP endpoints.")
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--changes", default=DEFAULT_CHANGES)
    parser.add_argument("--report", default="reports/original-excel-http-apply-report.json")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--allow-partial", action="store_true", help="Apply safe payloads even when unsafe grouped parents are blocked.")
    args = parser.parse_args()

    data = json.loads(Path(args.source).read_text(encoding="utf-8"))
    changes = read_csv(args.changes)
    indexes = build_indexes(data)
    update_payloads, blockers, skipped = build_update_payloads(changes, indexes)
    create_payloads = build_create_payloads(changes)

    summary = {
        "mode": "apply" if args.apply else "dry-run",
        "source": args.source,
        "changes": args.changes,
        "update_parent_payloads": len(update_payloads),
        "create_parent_payloads": len(create_payloads),
        "update_corrections": sum(item["_corrections"] for item in update_payloads),
        "update_inserts": sum(item["_inserts"] for item in update_payloads),
        "create_parent_rows": sum(item["_rows"] for item in create_payloads),
        "skipped": dict(skipped),
        "blockers": blockers,
        "update_payloads": [
            {
                "id": item["id"],
                "label": item["label"],
                "corrections": item["_corrections"],
                "inserts": item["_inserts"],
                "rows": item["_rows"],
            }
            for item in update_payloads
        ],
        "create_payloads": [
            {
                "label": item["label"],
                "combo_key": item["_combo_key"],
                "rows": item["_rows"],
            }
            for item in create_payloads
        ],
        "applied": [],
    }

    if blockers and not args.allow_partial:
        write_report(args.report, summary)
        print(json.dumps({k: summary[k] for k in [
            "mode", "update_parent_payloads", "create_parent_payloads",
            "update_corrections", "update_inserts", "create_parent_rows",
            "skipped", "blockers",
        ]}, indent=2, ensure_ascii=False))
        print(f"Refusing to apply because blockers exist. Report: {args.report}", file=sys.stderr)
        return 2 if args.apply else 0

    if args.apply:
        for index, payload in enumerate(update_payloads, start=1):
            post_json(UPDATE_URL, clean_payload(payload))
            summary["applied"].append({
                "type": "update_option",
                "id": payload["id"],
                "corrections": payload["_corrections"],
                "inserts": payload["_inserts"],
            })
            if index % 20 == 0 or index == len(update_payloads):
                print(f"updated_parent_payloads {index}/{len(update_payloads)}")
                sys.stdout.flush()
            time.sleep(0.08)

        for index, payload in enumerate(create_payloads, start=1):
            response = post_json(CREATE_URL, clean_payload(payload))
            summary["applied"].append({
                "type": "create_option",
                "id": response.get("id"),
                "combo_key": payload["_combo_key"],
                "rows": payload["_rows"],
            })
            print(f"created_parent_payloads {index}/{len(create_payloads)} id={response.get('id')}")
            sys.stdout.flush()
            time.sleep(0.08)

    write_report(args.report, summary)
    print(json.dumps({k: summary[k] for k in [
        "mode", "update_parent_payloads", "create_parent_payloads",
        "update_corrections", "update_inserts", "create_parent_rows", "skipped",
    ]}, indent=2, ensure_ascii=False))
    print("report", args.report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
