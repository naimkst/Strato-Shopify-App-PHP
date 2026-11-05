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
from urllib.parse import quote


DEFAULT_SOURCE = "reports/live-after-original-excel-http-apply/get-tabs-live.json"
DEFAULT_CHANGES = "reports/original-excel-price-changes-post-http-apply.csv"
UPDATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=update_option"
CREATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=create_option"
DELETE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=delete_option&id="


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


def get_json(url, timeout=60):
    with urllib.request.urlopen(url, timeout=timeout) as response:
        body = response.read().decode("utf-8", errors="replace")
    parsed = json.loads(body)
    if not parsed.get("success"):
        raise RuntimeError(f"request failed: {parsed}")
    return parsed


def clean_payload(payload):
    return {key: value for key, value in payload.items() if not key.startswith("_")}


def combo_label(combo_key):
    return "HW Combo: " + " > ".join(json.loads(combo_key))


def build_indexes(data):
    option_by_id = {str(option.get("id")): option for option in iter_options(data)}
    option_ids_by_label = defaultdict(list)
    for option in iter_options(data):
        option_ids_by_label[str(option.get("label") or "")].append(str(option.get("id")))

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
        "option_ids_by_label": option_ids_by_label,
        "hw_by_parent": hw_by_parent,
        "combo_keys_by_parent": combo_keys_by_parent,
        "combo_options_by_parent": combo_options_by_parent,
    }


def height_width_payload(rows, corrections_by_row_id, inserts):
    result = []
    existing_sizes = set()
    for row in sorted(rows, key=lambda item: int(item.get("id", 0))):
        row_id = str(row.get("id"))
        item = {
            "height": str(row.get("height", "")).strip(),
            "width": str(row.get("width", "")).strip(),
            "price": str(corrections_by_row_id.get(row_id, money(row.get("price")))),
        }
        result.append(item)
        existing_sizes.add((item["width"], item["height"]))

    blockers = []
    for row in sorted(inserts, key=lambda item: (int(item["height"]), int(item["width"]))):
        size_key = (row["width"], row["height"])
        if size_key in existing_sizes:
            blockers.append(f"insert already exists for {size_key}")
            continue
        result.append({"height": row["height"], "width": row["width"], "price": row["target_price"]})
        existing_sizes.add(size_key)

    return sorted(result, key=lambda item: (int(item["height"]), int(item["width"]))), blockers


def build_plan(data, changes):
    indexes = build_indexes(data)
    corrections_by_parent_row = defaultdict(dict)
    inserts_by_parent_combo = defaultdict(lambda: defaultdict(list))
    changed_parents = set()
    skipped = Counter()

    for row in changes:
        action = row["action"]
        if action in {"update", "update_duplicate"}:
            corrections_by_parent_row[row["option_parent_id"]][row["row_id"]] = row["target_price"]
            changed_parents.add(row["option_parent_id"])
        elif action == "insert":
            inserts_by_parent_combo[row["option_parent_id"]][row["combo_key"]].append(row)
            changed_parents.add(row["option_parent_id"])
        else:
            skipped[action] += 1

    parent_plans = []
    blockers = []
    for parent_id in sorted(changed_parents, key=lambda value: int(value)):
        combo_keys = sorted(indexes["combo_keys_by_parent"].get(parent_id, set()))
        if len(combo_keys) <= 1:
            skipped["single_combo_parent"] += 1
            continue
        option = indexes["option_by_id"].get(parent_id)
        if not option:
            blockers.append(f"parent {parent_id}: option not found")
            continue
        if indexes["combo_options_by_parent"].get(parent_id, 0):
            blockers.append(f"parent {parent_id}: has combo_options rows")
            continue

        extra = option_extra(option)
        primary_combo = compact_combo(extra.get("combo_option_ids", []))
        if primary_combo not in combo_keys:
            blockers.append(f"parent {parent_id}: primary combo not present in height_width rows")
            continue

        rows_by_combo = defaultdict(list)
        for row in indexes["hw_by_parent"].get(parent_id, []):
            rows_by_combo[row.get("combo_option_ids", "")].append(row)

        combo_payloads = {}
        for combo_key in combo_keys:
            rows, row_blockers = height_width_payload(
                rows_by_combo[combo_key],
                corrections_by_parent_row.get(parent_id, {}),
                inserts_by_parent_combo.get(parent_id, {}).get(combo_key, []),
            )
            for blocker in row_blockers:
                blockers.append(f"parent {parent_id} combo {combo_key}: {blocker}")
            combo_payloads[combo_key] = rows

        create_payloads = []
        for combo_key in combo_keys:
            if combo_key == primary_combo:
                continue
            label = combo_label(combo_key)
            existing_ids = [item for item in indexes["option_ids_by_label"].get(label, []) if item != parent_id]
            if existing_ids:
                blockers.append(f"parent {parent_id}: label already exists for {label}: {existing_ids}")
                continue
            create_payloads.append({
                "subtab_id": 1,
                "label": label,
                "value_key": "",
                "image_url": "",
                "price": "0",
                "extra_json": json.dumps({
                    "combo_option_ids": json.loads(combo_key),
                    "height_width_rows": combo_payloads[combo_key],
                }, ensure_ascii=False, separators=(",", ":")),
                "section_id": "",
                "option_type": "",
                "depends_on": "",
                "_combo_key": combo_key,
                "_rows": len(combo_payloads[combo_key]),
            })

        primary_extra = extra
        primary_extra["combo_option_ids"] = json.loads(primary_combo)
        primary_extra["height_width_rows"] = combo_payloads[primary_combo]
        update_payload = {
            "id": parent_id,
            "label": option.get("label") or combo_label(primary_combo),
            "value_key": option.get("value_key") or "",
            "image_url": option.get("image_url") or "",
            "price": str(option.get("price") or "0"),
            "extra_json": json.dumps(primary_extra, ensure_ascii=False, separators=(",", ":")),
            "section_id": option.get("section_id") or "",
            "option_type": option.get("option_type") or "",
            "depends_on": option.get("depends_on") or "",
            "_combo_key": primary_combo,
            "_rows": len(combo_payloads[primary_combo]),
        }

        parent_plans.append({
            "parent_id": parent_id,
            "primary_combo": primary_combo,
            "combo_count": len(combo_keys),
            "create_payloads": create_payloads,
            "update_payload": update_payload,
            "corrections": len(corrections_by_parent_row.get(parent_id, {})),
            "inserts": sum(len(rows) for rows in inserts_by_parent_combo.get(parent_id, {}).values()),
            "created_rows": sum(payload["_rows"] for payload in create_payloads),
            "primary_rows": update_payload["_rows"],
        })

    return parent_plans, blockers, skipped


def write_report(path, report):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def rollback_created(ids):
    for option_id in reversed(ids):
        try:
            get_json(DELETE_URL + quote(str(option_id)))
            print(f"rolled_back_created_option {option_id}")
        except Exception as exc:
            print(f"rollback_failed option={option_id} error={exc}", file=sys.stderr)


def apply_plan(parent_plans):
    applied = []
    for index, plan in enumerate(parent_plans, start=1):
        created_ids = []
        try:
            for payload in plan["create_payloads"]:
                response = post_json(CREATE_URL, clean_payload(payload))
                created_ids.append(str(response.get("id")))
            post_json(UPDATE_URL, clean_payload(plan["update_payload"]))
        except Exception:
            rollback_created(created_ids)
            raise

        applied.append({
            "parent_id": plan["parent_id"],
            "created_ids": created_ids,
            "converted_primary_combo": plan["primary_combo"],
            "corrections": plan["corrections"],
            "inserts": plan["inserts"],
        })
        print(f"split_parent {index}/{len(parent_plans)} parent={plan['parent_id']} created={','.join(created_ids)}")
        sys.stdout.flush()
        time.sleep(0.08)
    return applied


def main():
    parser = argparse.ArgumentParser(description="Split grouped HW parents so remaining Excel prices can be applied through admin endpoints.")
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--changes", default=DEFAULT_CHANGES)
    parser.add_argument("--report", default="reports/grouped-hw-parent-split-report.json")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    data = json.loads(Path(args.source).read_text(encoding="utf-8"))
    changes = read_csv(args.changes)
    parent_plans, blockers, skipped = build_plan(data, changes)

    report = {
        "mode": "apply" if args.apply else "dry-run",
        "source": args.source,
        "changes": args.changes,
        "parent_plan_count": len(parent_plans),
        "create_payload_count": sum(len(plan["create_payloads"]) for plan in parent_plans),
        "corrections": sum(plan["corrections"] for plan in parent_plans),
        "inserts": sum(plan["inserts"] for plan in parent_plans),
        "created_rows": sum(plan["created_rows"] for plan in parent_plans),
        "primary_rows": sum(plan["primary_rows"] for plan in parent_plans),
        "skipped": dict(skipped),
        "blockers": blockers,
        "plans": [
            {
                "parent_id": plan["parent_id"],
                "primary_combo": plan["primary_combo"],
                "combo_count": plan["combo_count"],
                "create_count": len(plan["create_payloads"]),
                "corrections": plan["corrections"],
                "inserts": plan["inserts"],
                "created_rows": plan["created_rows"],
                "primary_rows": plan["primary_rows"],
            }
            for plan in parent_plans
        ],
        "applied": [],
    }

    if blockers:
        write_report(args.report, report)
        print(json.dumps({key: report[key] for key in [
            "mode", "parent_plan_count", "create_payload_count",
            "corrections", "inserts", "blockers",
        ]}, indent=2, ensure_ascii=False))
        print(f"Refusing to apply because blockers exist. Report: {args.report}", file=sys.stderr)
        return 2 if args.apply else 0

    if args.apply:
        report["applied"] = apply_plan(parent_plans)

    write_report(args.report, report)
    print(json.dumps({key: report[key] for key in [
        "mode", "parent_plan_count", "create_payload_count",
        "corrections", "inserts", "created_rows", "primary_rows", "skipped",
    ]}, indent=2, ensure_ascii=False))
    print("report", args.report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
