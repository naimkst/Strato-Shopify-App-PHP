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

import map_original_excel_prices as mapper


DEFAULT_SOURCE = "/Users/naim/WWW/strato-project-backups/codex-20260811-015127-before-exact-excel-grid-prune/remote-data/get-tabs-live.json"
DEFAULT_ROWS = "reports/original-excel-price-rows.csv"
DEFAULT_MATRICES = "reports/original-excel-matrices.csv"
UPDATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=update_option"
CREATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=create_option"
DELETE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=delete_option&id="

CONFLICT_FILES = {
    "Fenster/Aluplast Ideal 8000/3-Teilig/2026-3-8000-DKL-Fest im Rahmen-DKR.xlsx",
    "Fenster/Aluplast Ideal 8000/3-Teilig/2026-4-8000-DKL-Fest im Rahmen-DKR.xlsx",
}


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


def compact_combo(ids):
    return json.dumps([str(item) for item in ids], separators=(",", ":"))


def combo_label(combo_key):
    return "HW Combo: " + " > ".join(json.loads(combo_key))


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


def get_json(url, timeout=60):
    with urllib.request.urlopen(url, timeout=timeout) as response:
        body = response.read().decode("utf-8", errors="replace")
    parsed = json.loads(body)
    if not parsed.get("success"):
        raise RuntimeError(f"request failed: {parsed}")
    return parsed


def clean_payload(payload):
    return {key: value for key, value in payload.items() if not key.startswith("_")}


def build_desired_targets(rows, matrix_mappings):
    desired = defaultdict(dict)
    sources = defaultdict(dict)
    conflicts = []
    skipped = Counter()

    for row in rows:
        if row["relative_path"] in CONFLICT_FILES:
            skipped["conflict_file_rows"] += 1
            continue
        matrix_key = (row["relative_path"], row["matrix_index"])
        mapping = matrix_mappings.get(matrix_key)
        if not mapping or mapping["status"] != "mapped":
            skipped["unmapped_matrix_rows"] += 1
            continue

        price = str(money(row["price"]))
        for combo_key in mapping["combo_keys"]:
            size_key = (str(row["width"]).strip(), str(row["height"]).strip())
            previous = desired[combo_key].get(size_key)
            if previous is not None and previous != price:
                conflicts.append({
                    "combo_key": combo_key,
                    "width": size_key[0],
                    "height": size_key[1],
                    "prices": sorted({previous, price}),
                    "sources": [sources[combo_key][size_key], row["relative_path"]],
                })
                continue
            desired[combo_key][size_key] = price
            sources[combo_key][size_key] = row["relative_path"]

    return desired, sources, conflicts, skipped


def build_db_indexes(data):
    option_by_id = {str(option.get("id")): option for option in iter_options(data)}
    option_ids_by_label = defaultdict(list)
    parent_by_extra_combo = defaultdict(set)
    for option in iter_options(data):
        option_id = str(option.get("id"))
        option_ids_by_label[str(option.get("label") or "")].append(option_id)
        extra = option_extra(option)
        if "combo_option_ids" in extra and "height_width_rows" in extra:
            parent_by_extra_combo[compact_combo(extra.get("combo_option_ids"))].add(option_id)

    rows_by_parent_combo = defaultdict(lambda: defaultdict(list))
    combo_keys_by_parent = defaultdict(set)
    parents_by_combo = defaultdict(set)
    for row in data.get("height_width_prices", []) or []:
        parent_id = str(row.get("option_parent_id"))
        combo_key = str(row.get("combo_option_ids"))
        rows_by_parent_combo[parent_id][combo_key].append(row)
        combo_keys_by_parent[parent_id].add(combo_key)
        parents_by_combo[combo_key].add(parent_id)

    combo_options_by_parent = Counter(str(row.get("option_parent_id")) for row in data.get("combo_options", []) or [])

    return {
        "option_by_id": option_by_id,
        "option_ids_by_label": option_ids_by_label,
        "parent_by_extra_combo": parent_by_extra_combo,
        "rows_by_parent_combo": rows_by_parent_combo,
        "combo_keys_by_parent": combo_keys_by_parent,
        "parents_by_combo": parents_by_combo,
        "combo_options_by_parent": combo_options_by_parent,
    }


def exact_rows_for(combo_key, desired):
    return [
        {"height": height, "width": width, "price": price}
        for (width, height), price in sorted(
            desired[combo_key].items(),
            key=lambda item: (int(item[0][1]), int(item[0][0])),
        )
    ]


def compare_rows(current_rows, desired_rows):
    current_by_size = {
        (str(row.get("width")).strip(), str(row.get("height")).strip()): str(money(row.get("price")))
        for row in current_rows
    }
    desired_by_size = {(row["width"], row["height"]): row["price"] for row in desired_rows}
    deletions = [key for key in current_by_size if key not in desired_by_size]
    inserts = [key for key in desired_by_size if key not in current_by_size]
    updates = [key for key in desired_by_size if key in current_by_size and desired_by_size[key] != current_by_size[key]]
    return deletions, inserts, updates


def build_update_payload(option, combo_key, desired_rows):
    extra = option_extra(option)
    extra["combo_option_ids"] = json.loads(combo_key)
    extra["height_width_rows"] = desired_rows
    return {
        "id": str(option.get("id")),
        "label": option.get("label") or combo_label(combo_key),
        "value_key": option.get("value_key") or "",
        "image_url": option.get("image_url") or "",
        "price": str(option.get("price") or "0"),
        "extra_json": json.dumps(extra, ensure_ascii=False, separators=(",", ":")),
        "section_id": option.get("section_id") or "",
        "option_type": option.get("option_type") or "",
        "depends_on": option.get("depends_on") or "",
        "_combo_key": combo_key,
        "_rows": len(desired_rows),
    }


def build_create_payload(combo_key, desired_rows):
    return {
        "subtab_id": 1,
        "label": combo_label(combo_key),
        "value_key": "",
        "image_url": "",
        "price": "0",
        "extra_json": json.dumps({
            "combo_option_ids": json.loads(combo_key),
            "height_width_rows": desired_rows,
        }, ensure_ascii=False, separators=(",", ":")),
        "section_id": "",
        "option_type": "",
        "depends_on": "",
        "_combo_key": combo_key,
        "_rows": len(desired_rows),
    }


def build_plan(data, desired):
    indexes = build_db_indexes(data)
    blockers = []
    update_payloads = []
    create_payloads = []
    split_plans = []
    planned_combos = set()
    stats = Counter()
    deletion_samples = []

    relevant_parents = set()
    for combo_key in desired:
        relevant_parents.update(indexes["parents_by_combo"].get(combo_key, set()))
        relevant_parents.update(indexes["parent_by_extra_combo"].get(combo_key, set()))

    for parent_id in sorted(relevant_parents, key=lambda value: int(value)):
        option = indexes["option_by_id"].get(parent_id)
        if not option:
            blockers.append(f"parent {parent_id}: option not found")
            continue
        if indexes["combo_options_by_parent"].get(parent_id):
            blockers.append(f"parent {parent_id}: has combo_options rows")
            continue

        parent_combos = sorted(indexes["combo_keys_by_parent"].get(parent_id, set()))
        if not parent_combos:
            extra_combo = compact_combo(option_extra(option).get("combo_option_ids", []))
            parent_combos = [extra_combo] if extra_combo in desired else []
        if not parent_combos:
            continue
        if any(combo_key not in desired for combo_key in parent_combos):
            blockers.append(f"parent {parent_id}: contains combo without non-conflict Excel target: {parent_combos}")
            continue

        primary_combo = compact_combo(option_extra(option).get("combo_option_ids", []))
        if primary_combo not in parent_combos:
            blockers.append(f"parent {parent_id}: primary combo not in parent rows")
            continue

        if len(parent_combos) == 1:
            combo_key = parent_combos[0]
            desired_rows = exact_rows_for(combo_key, desired)
            current_rows = indexes["rows_by_parent_combo"].get(parent_id, {}).get(combo_key, [])
            deletions, inserts, updates = compare_rows(current_rows, desired_rows)
            if not deletions and not inserts and not updates:
                stats["already_exact_parent"] += 1
                planned_combos.add(combo_key)
                continue
            update_payloads.append(build_update_payload(option, combo_key, desired_rows))
            planned_combos.add(combo_key)
            stats["single_parent_updates"] += 1
            stats["delete_rows"] += len(deletions)
            stats["insert_rows"] += len(inserts)
            stats["price_update_rows"] += len(updates)
            for width, height in deletions[:10]:
                deletion_samples.append({"parent_id": parent_id, "combo_key": combo_key, "width": width, "height": height})
            continue

        create_for_parent = []
        combo_payloads = {}
        parent_stats = Counter()
        parent_deletion_samples = []
        for combo_key in parent_combos:
            desired_rows = exact_rows_for(combo_key, desired)
            current_rows = indexes["rows_by_parent_combo"].get(parent_id, {}).get(combo_key, [])
            deletions, inserts, updates = compare_rows(current_rows, desired_rows)
            parent_stats["delete_rows"] += len(deletions)
            parent_stats["insert_rows"] += len(inserts)
            parent_stats["price_update_rows"] += len(updates)
            for width, height in deletions[:10]:
                parent_deletion_samples.append({"parent_id": parent_id, "combo_key": combo_key, "width": width, "height": height})
            combo_payloads[combo_key] = desired_rows
            if combo_key == primary_combo:
                continue
            label = combo_label(combo_key)
            existing_ids = [item for item in indexes["option_ids_by_label"].get(label, []) if item != parent_id]
            if existing_ids:
                blockers.append(f"parent {parent_id}: label already exists for {label}: {existing_ids}")
                continue
            create_for_parent.append(build_create_payload(combo_key, desired_rows))

        split_plans.append({
            "parent_id": parent_id,
            "primary_combo": primary_combo,
            "create_payloads": create_for_parent,
            "update_payload": build_update_payload(option, primary_combo, combo_payloads[primary_combo]),
            "stats": dict(parent_stats),
            "deletion_samples": parent_deletion_samples[:20],
        })
        planned_combos.update(parent_combos)
        stats["grouped_parent_splits"] += 1
        stats["created_split_parents"] += len(create_for_parent)
        stats.update(parent_stats)
        deletion_samples.extend(parent_deletion_samples[:20])

    for combo_key in sorted(set(desired) - planned_combos):
        parent_ids = set(indexes["parents_by_combo"].get(combo_key, set()))
        parent_ids.update(indexes["parent_by_extra_combo"].get(combo_key, set()))
        if parent_ids:
            continue
        label = combo_label(combo_key)
        if indexes["option_ids_by_label"].get(label):
            blockers.append(f"combo {combo_key}: label exists without rows: {indexes['option_ids_by_label'][label]}")
            continue
        desired_rows = exact_rows_for(combo_key, desired)
        create_payloads.append(build_create_payload(combo_key, desired_rows))
        stats["missing_parent_creates"] += 1
        stats["insert_rows"] += len(desired_rows)

    return {
        "update_payloads": update_payloads,
        "create_payloads": create_payloads,
        "split_plans": split_plans,
        "blockers": blockers,
        "stats": stats,
        "deletion_samples": deletion_samples[:200],
    }


def rollback_created(option_ids):
    for option_id in reversed(option_ids):
        try:
            get_json(DELETE_URL + quote(str(option_id)))
            print(f"rolled_back_created_option {option_id}")
        except Exception as exc:
            print(f"rollback_failed option={option_id} error={exc}", file=sys.stderr)


def apply_plan(plan):
    applied = []
    total_single = len(plan["update_payloads"])
    for index, payload in enumerate(plan["update_payloads"], start=1):
        post_json(UPDATE_URL, clean_payload(payload))
        applied.append({"type": "update_option", "id": payload["id"], "combo_key": payload["_combo_key"], "rows": payload["_rows"]})
        if index % 20 == 0 or index == total_single:
            print(f"exact_grid_update {index}/{total_single}")
            sys.stdout.flush()
        time.sleep(0.08)

    total_creates = len(plan["create_payloads"])
    for index, payload in enumerate(plan["create_payloads"], start=1):
        response = post_json(CREATE_URL, clean_payload(payload))
        applied.append({"type": "create_option", "id": response.get("id"), "combo_key": payload["_combo_key"], "rows": payload["_rows"]})
        print(f"exact_grid_create {index}/{total_creates} id={response.get('id')}")
        sys.stdout.flush()
        time.sleep(0.08)

    total_splits = len(plan["split_plans"])
    for index, split in enumerate(plan["split_plans"], start=1):
        created_ids = []
        try:
            for payload in split["create_payloads"]:
                response = post_json(CREATE_URL, clean_payload(payload))
                created_ids.append(str(response.get("id")))
            post_json(UPDATE_URL, clean_payload(split["update_payload"]))
        except Exception:
            rollback_created(created_ids)
            raise
        applied.append({
            "type": "split_parent",
            "parent_id": split["parent_id"],
            "created_ids": created_ids,
            "primary_combo": split["primary_combo"],
        })
        print(f"exact_grid_split {index}/{total_splits} parent={split['parent_id']} created={','.join(created_ids)}")
        sys.stdout.flush()
        time.sleep(0.08)
    return applied


def main():
    parser = argparse.ArgumentParser(description="Prune configurator HW rows to exactly the non-conflicting original Excel grids.")
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--rows", default=DEFAULT_ROWS)
    parser.add_argument("--matrices", default=DEFAULT_MATRICES)
    parser.add_argument("--report", default="reports/exact-excel-grid-prune-report.json")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    data = json.loads(Path(args.source).read_text(encoding="utf-8"))
    rows = read_csv(args.rows)
    matrices = read_csv(args.matrices)
    matrix_mappings, matrix_counters = mapper.build_matrix_mappings(matrices)
    desired, sources, conflicts, skipped = build_desired_targets(rows, matrix_mappings)
    plan = build_plan(data, desired)

    report = {
        "mode": "apply" if args.apply else "dry-run",
        "source": args.source,
        "conflict_files_skipped": sorted(CONFLICT_FILES),
        "matrix_summary": dict(matrix_counters),
        "desired_combo_count": len(desired),
        "desired_row_count": sum(len(rows_by_size) for rows_by_size in desired.values()),
        "source_conflicts": conflicts[:200],
        "skipped": dict(skipped),
        "update_parent_payloads": len(plan["update_payloads"]),
        "create_parent_payloads": len(plan["create_payloads"]),
        "split_parent_payloads": len(plan["split_plans"]),
        "stats": dict(plan["stats"]),
        "blockers": plan["blockers"],
        "deletion_samples": plan["deletion_samples"],
        "applied": [],
    }

    if conflicts:
        report["blockers"].append(f"non-conflict source produced {len(conflicts)} conflicting target cells")

    if report["blockers"]:
        Path(args.report).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        print(json.dumps({key: report[key] for key in [
            "mode", "desired_combo_count", "desired_row_count",
            "update_parent_payloads", "create_parent_payloads",
            "split_parent_payloads", "stats", "blockers",
        ]}, indent=2, ensure_ascii=False))
        print(f"Refusing to apply because blockers exist. Report: {args.report}", file=sys.stderr)
        return 2 if args.apply else 0

    if args.apply:
        report["applied"] = apply_plan(plan)

    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({key: report[key] for key in [
        "mode", "desired_combo_count", "desired_row_count",
        "update_parent_payloads", "create_parent_payloads",
        "split_parent_payloads", "stats", "skipped",
    ]}, indent=2, ensure_ascii=False))
    print("report", args.report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
