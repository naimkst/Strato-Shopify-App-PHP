#!/usr/bin/env python3
import argparse
import csv
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


DEFAULT_CSV = "/Users/naim/Downloads/deine-fenster24_configurator-vs-excel_developer.csv"
DEFAULT_SNAPSHOT = "/Users/naim/WWW/strato-project-backups/codex-20260810-233829-before-price-fix/remote-data/get-tabs.json"
LIVE_TABS_URL = "https://droplify.de/deine-fenster24/admin/get-tabs.php"
UPDATE_URL = "https://droplify.de/deine-fenster24/admin/index.php?action=update_option"

PRODUCT_STATIC_CODE = {
    "Window": "__static_ksf__",
    "Balcony door": "__static_balkon__",
}

PROFILE_ALIASES = {
    "Ideal 4000": "Aluplast Ideal 4000",
    "Ideal 7000": "Aluplast Ideal 7000",
    "Ideal 8000": "Aluplast Ideal 8000",
    "Salamander 76 AD": "GreenEvolution flex 76 AD",
    "Salamander 76 MD": "GreenEvolution flex 76 MD",
    "Salamander 82 MD": "BluEvolution 82 MD classic",
}

RAW_MAPPING_3 = {
    "Festelement - Festelement - Festelement": "Fest/Fest/Fest im Rahmen",
    "Festelement - Dreh-Kipp Rechts - Festelement": "Fest/DKR/Fest",
    "Festelement - Dreh-Kipp Links - Festelement": "Fest/DKL/Fest",
    "Dreh-Kipp Links - Festelement - Festelement": "DKL/Fest/Fest",
    "Festelement - Festelement - Dreh-Kipp Rechts": "Fest/Fest/DKR",
    "Dreh-Kipp Links - Festelement - Dreh-Kipp Rechts": "DKL/Fest/DKR",
    "Festelement - Dreh Links - Dreh-Kipp Rechts": "Fest/DL-Pfosten/DKR",
    "Dreh Links - Dreh-Kipp Rechts - Festelement": "DL-Pfosten/DKR-Fest",
    "Dreh-Kipp Links - Dreh Rechts - Festelement": "DKL/DR-Pfosten/Fest",
    "Festelement Stulp Dreh Links (ohne Griff) - Dreh-Kipp Rechts": "Fest/DL-Stulp/DKR",
    "Stulp Dreh Links (ohne Griff) - Dreh-Kipp Rechts - Festelement": "DL-Stulp/DKR-Fest",
    "Dreh-Kipp Links - Stulp Dreh Rechts (ohne Griff) - Festelement": "DKL/DR-Stulp/Fest",
}

RAW_MAPPING_2 = {
    "Festelement - Festelement": "Fest/Fest",
    "Festelement - Dreh-Kipp Rechts": "Fest/DKR",
    "Dreh-Kipp Links - Festelement": "DKL/Fest",
    "Dreh-Kipp Links - Dreh-Kipp Rechts": "DKL/DKR-Pfosten",
    "Dreh-Kipp Links - Dreh Rechts": "DKL/DR-Pfosten",
    "Dreh Links - Dreh-Kipp Rechts": "DL/DKR-Pfosten",
    "Dreh-Kipp Links - Stulp Dreh Rechts (ohne Griff)": "DKL/DR-Stulp",
    "Stulp Dreh Links (ohne Griff) - Dreh-Kipp Rechts": "DL-Stulp/DKR",
}


def normalize(value):
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("ß", "ss").replace("–", "-").replace("—", "-")
    text = re.sub(r"\s*-\s*", "-", text)
    text = re.sub(r"[^a-zA-Z0-9/()]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def money(value):
    try:
        return Decimal(str(value).replace(",", ".")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        raise ValueError(f"invalid money value: {value!r}")


def compact_combo(ids):
    return json.dumps([str(x) for x in ids], separators=(",", ":"))


def read_json(source):
    if source.startswith("http://") or source.startswith("https://"):
        with urllib.request.urlopen(source, timeout=90) as response:
            return json.loads(response.read())
    return json.loads(Path(source).read_text())


def iter_options(data):
    for tab in data.get("tabs", []):
        for option in tab.get("options", []) or []:
            yield option
        for subtab in tab.get("subtabs", []) or []:
            for option in subtab.get("options", []) or []:
                yield option
            for section in subtab.get("sections", []) or []:
                for option in section.get("options", []) or []:
                    yield option


def tab(data, tab_id):
    for item in data.get("tabs", []):
        if str(item.get("id")) == str(tab_id):
            return item
    raise KeyError(f"tab {tab_id} not found")


def option_extra(option):
    try:
        return json.loads(option.get("extra_json") or "{}")
    except json.JSONDecodeError:
        return {}


def build_indexes(data):
    profile_by_name = {}
    for option in tab(data, 1).get("options", []) or []:
        profile_by_name[normalize(option.get("label"))] = str(option.get("id"))

    wing_by_key = {}
    for option in tab(data, 2).get("options", []) or []:
        extra = option_extra(option)
        combo_ids = [str(x) for x in extra.get("combo_option_ids", [])]
        if len(combo_ids) != 2:
            continue
        static_code, profile_id = combo_ids
        for row in extra.get("combo_rows", []) or []:
            match = re.search(r"(\d+)", str(row.get("heading", "")))
            if not match:
                continue
            wing_by_key[(static_code, profile_id, int(match.group(1)))] = str(row.get("option_id"))

    opening_name_map = {}
    for raw, mapped in {**RAW_MAPPING_3, **RAW_MAPPING_2}.items():
        opening_name_map[normalize(raw)] = mapped

    opening_by_key = defaultdict(dict)
    for option in tab(data, 3).get("options", []) or []:
        extra = option_extra(option)
        combo_ids = [str(x) for x in extra.get("combo_option_ids", [])]
        if len(combo_ids) != 3:
            continue
        static_code, profile_id, wing_id = combo_ids
        for row in extra.get("combo_rows", []) or []:
            option_id = str(row.get("option_id"))
            raw_heading = str(row.get("heading", ""))
            mapped_heading = opening_name_map.get(normalize(raw_heading), raw_heading)
            names = {raw_heading, mapped_heading}
            for name in names:
                opening_by_key[(static_code, profile_id, wing_id)][normalize(name)] = option_id

    hw_by_combo_size = defaultdict(list)
    hw_by_parent = defaultdict(list)
    combo_keys_by_parent = defaultdict(set)
    for row in data.get("height_width_prices", []) or []:
        combo = row.get("combo_option_ids", "")
        width = str(row.get("width", "")).strip()
        height = str(row.get("height", "")).strip()
        hw_by_combo_size[(combo, width, height)].append(row)
        hw_by_parent[str(row.get("option_parent_id"))].append(row)
        combo_keys_by_parent[str(row.get("option_parent_id"))].add(combo)

    option_by_id = {str(option.get("id")): option for option in iter_options(data)}
    combo_options_by_parent = Counter(str(row.get("option_parent_id")) for row in data.get("combo_options", []) or [])

    return {
        "profile_by_name": profile_by_name,
        "wing_by_key": wing_by_key,
        "opening_by_key": opening_by_key,
        "hw_by_combo_size": hw_by_combo_size,
        "hw_by_parent": hw_by_parent,
        "combo_keys_by_parent": combo_keys_by_parent,
        "option_by_id": option_by_id,
        "combo_options_by_parent": combo_options_by_parent,
    }


def profile_id_for(csv_profile, profile_by_name):
    alias = PROFILE_ALIASES.get(csv_profile, csv_profile)
    exact = profile_by_name.get(normalize(alias))
    if exact:
        return exact

    csv_norm = normalize(csv_profile)
    matches = [id_ for label, id_ in profile_by_name.items() if csv_norm in label]
    if len(matches) == 1:
        return matches[0]
    return None


def part_count(config):
    match = re.search(r"(\d+)", str(config))
    return int(match.group(1)) if match else None


def include_csv_row(csv_row, args):
    filters = {
        "Product": args.only_product,
        "Profile": args.only_profile,
        "Configuration": args.only_configuration,
        "Opening": args.only_opening,
    }
    for field, expected in filters.items():
        if expected and csv_row.get(field) != expected:
            return False
    return True


def analyze(csv_path, data, args):
    indexes = build_indexes(data)
    rows = list(csv.DictReader(Path(csv_path).open(encoding="utf-8-sig", newline="")))
    results = []
    counters = Counter()

    for line_no, csv_row in enumerate(rows, start=2):
        if not include_csv_row(csv_row, args):
            counters["skipped_filter"] += 1
            continue

        mapping = csv_row.get("Mapping", "")
        if not args.include_same_glass and not mapping.startswith("Direct"):
            counters["skipped_same_glass"] += 1
            continue

        result = {"line": line_no, "csv": csv_row, "status": "pending"}
        results.append(result)

        static_code = PRODUCT_STATIC_CODE.get(csv_row.get("Product"))
        if not static_code:
            result["status"] = "unmapped_product"
            counters[result["status"]] += 1
            continue

        profile_id = profile_id_for(csv_row.get("Profile", ""), indexes["profile_by_name"])
        if not profile_id:
            result["status"] = "unmapped_profile"
            counters[result["status"]] += 1
            continue

        count = part_count(csv_row.get("Configuration"))
        wing_id = indexes["wing_by_key"].get((static_code, profile_id, count))
        if not wing_id:
            result["status"] = "unmapped_configuration"
            result["ids"] = {"static_code": static_code, "profile_id": profile_id, "part_count": count}
            counters[result["status"]] += 1
            continue

        opening_id = indexes["opening_by_key"].get((static_code, profile_id, wing_id), {}).get(normalize(csv_row.get("Opening")))
        if not opening_id:
            result["status"] = "unmapped_opening"
            result["ids"] = {"static_code": static_code, "profile_id": profile_id, "wing_id": wing_id}
            counters[result["status"]] += 1
            continue

        combo_key = compact_combo([static_code, profile_id, wing_id, opening_id])
        width = str(csv_row.get("Width_mm", "")).strip()
        height = str(csv_row.get("Height_mm", "")).strip()
        matches = indexes["hw_by_combo_size"].get((combo_key, width, height), [])

        result["ids"] = {
            "static_code": static_code,
            "profile_id": profile_id,
            "wing_id": wing_id,
            "opening_id": opening_id,
            "combo_key": combo_key,
            "width": width,
            "height": height,
        }

        if not matches:
            result["status"] = "missing_height_width_row"
            counters[result["status"]] += 1
            continue
        if len(matches) > 1:
            result["status"] = "duplicate_height_width_row"
            result["matches"] = matches
            counters[result["status"]] += 1
            continue

        db_row = matches[0]
        current_db = money(db_row.get("price"))
        current_csv = money(csv_row.get("Current_Configurator_Price_EUR"))
        target = money(csv_row.get("Target_Excel_Price_EUR"))

        result.update({
            "status": "matched",
            "height_width_price_id": str(db_row.get("id")),
            "option_parent_id": str(db_row.get("option_parent_id")),
            "current_db_price": str(current_db),
            "current_csv_price": str(current_csv),
            "target_price": str(target),
            "db_matches_csv_current": current_db == current_csv,
            "needs_update": current_db != target,
        })
        counters["matched"] += 1
        counters["needs_update" if current_db != target else "already_correct"] += 1
        if current_db != current_csv:
            counters["db_csv_current_mismatch"] += 1

    blockers = {k: counters[k] for k in [
        "unmapped_product",
        "unmapped_profile",
        "unmapped_configuration",
        "unmapped_opening",
        "missing_height_width_row",
        "duplicate_height_width_row",
    ] if counters[k]}

    return results, counters, blockers, indexes


def build_parent_payloads(results, indexes):
    corrections_by_parent_row = defaultdict(dict)
    for result in results:
        if result.get("status") != "matched" or not result.get("needs_update"):
            continue
        parent_id = result["option_parent_id"]
        row_id = result["height_width_price_id"]
        corrections_by_parent_row[parent_id][row_id] = result["target_price"]

    payloads = []
    blockers = []
    for parent_id, corrections in sorted(corrections_by_parent_row.items(), key=lambda item: int(item[0])):
        option = indexes["option_by_id"].get(parent_id)
        current_rows = indexes["hw_by_parent"].get(parent_id, [])
        combo_option_count = indexes["combo_options_by_parent"].get(parent_id, 0)
        parent_combo_keys = indexes["combo_keys_by_parent"].get(parent_id, set())

        if not option:
            blockers.append(f"parent {parent_id}: parent option not found")
            continue
        if combo_option_count:
            blockers.append(f"parent {parent_id}: has {combo_option_count} combo_options rows")
            continue
        if len(parent_combo_keys) != 1:
            blockers.append(f"parent {parent_id}: has {len(parent_combo_keys)} combo_option_ids groups")
            continue

        extra = option_extra(option)
        if "combo_option_ids" not in extra:
            blockers.append(f"parent {parent_id}: missing combo_option_ids in extra_json")
            continue
        if compact_combo(extra.get("combo_option_ids")) not in parent_combo_keys:
            blockers.append(f"parent {parent_id}: extra_json combo_option_ids does not match DB rows")
            continue

        height_width_rows = []
        for row in sorted(current_rows, key=lambda item: int(item.get("id", 0))):
            row_id = str(row.get("id"))
            price = corrections.get(row_id, str(money(row.get("price"))))
            height_width_rows.append({
                "height": str(row.get("height", "")).strip(),
                "width": str(row.get("width", "")).strip(),
                "price": price,
            })

        extra["height_width_rows"] = height_width_rows
        payloads.append({
            "id": parent_id,
            "label": option.get("label") or "",
            "value_key": option.get("value_key") or "",
            "image_url": option.get("image_url") or "",
            "price": option.get("price") or "0",
            "extra_json": json.dumps(extra, ensure_ascii=False, separators=(",", ":")),
            "section_id": option.get("section_id") or "",
            "option_type": option.get("option_type") or "",
            "depends_on": option.get("depends_on") or "",
            "_correction_count": len(corrections),
        })

    return payloads, blockers


def sql_quote(value):
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def build_sql(results):
    statements = [
        "-- Generated by tools/price_corrections.py",
        "-- Guarded updates: each row also checks combo_option_ids, width, height, and old price.",
        "START TRANSACTION;",
    ]
    count = 0
    seen = set()
    conflicts = defaultdict(set)

    for result in results:
        if result.get("status") != "matched" or not result.get("needs_update"):
            continue
        row_id = result["height_width_price_id"]
        target = result["target_price"]
        key = (
            row_id,
            result["ids"]["combo_key"],
            result["ids"]["width"],
            result["ids"]["height"],
            result["current_db_price"],
        )
        conflicts[key].add(target)

    for key, targets in conflicts.items():
        if len(targets) > 1:
            raise RuntimeError(f"conflicting targets for SQL key {key}: {sorted(targets)}")

    for key, targets in sorted(conflicts.items(), key=lambda item: int(item[0][0])):
        row_id, combo_key, width, height, current_price = key
        target = next(iter(targets))
        if row_id in seen:
            continue
        seen.add(row_id)
        statements.append(
            "UPDATE height_width_prices "
            f"SET price = {sql_quote(target)} "
            f"WHERE id = {int(row_id)} "
            f"AND combo_option_ids = {sql_quote(combo_key)} "
            f"AND width = {sql_quote(width)} "
            f"AND height = {sql_quote(height)} "
            f"AND ROUND(price, 2) = {sql_quote(current_price)};"
        )
        count += 1

    statements.extend([
        f"-- Expected affected rows: {count}",
        "COMMIT;",
        "",
    ])
    return "\n".join(statements), count


def post_update(payload):
    clean_payload = {k: v for k, v in payload.items() if not k.startswith("_")}
    request = urllib.request.Request(
        UPDATE_URL,
        data=json.dumps(clean_payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        body = response.read().decode("utf-8", errors="replace")
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        raise RuntimeError(f"non-JSON update response for parent {payload['id']}: {body[:500]}")
    if not parsed.get("success"):
        raise RuntimeError(f"update failed for parent {payload['id']}: {parsed}")
    return parsed


def write_report(path, results, counters, blockers, payloads, payload_blockers, sql_count, args):
    report = {
        "mode": "apply" if args.apply else "dry-run",
        "include_same_glass": args.include_same_glass,
        "source": args.source,
        "csv": args.csv,
        "summary": dict(counters),
        "sql_update_count": sql_count,
        "blockers": blockers,
        "payload_blockers": payload_blockers,
        "parent_payloads": [
            {"id": payload["id"], "correction_count": payload["_correction_count"], "label": payload["label"]}
            for payload in payloads
        ],
        "bad_rows": [result for result in results if result.get("status") != "matched"],
        "db_csv_current_mismatches": [
            result for result in results
            if result.get("status") == "matched" and not result.get("db_matches_csv_current")
        ][:200],
    }
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(report, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Dry-run or apply configurator price corrections from the audit CSV.")
    parser.add_argument("--csv", default=DEFAULT_CSV)
    parser.add_argument("--source", default=DEFAULT_SNAPSHOT, help="Path or URL for get-tabs.php JSON")
    parser.add_argument("--include-same-glass", action="store_true", help="Also process same-glass-area mapping rows.")
    parser.add_argument("--apply", action="store_true", help="Apply updates through admin/index.php?action=update_option.")
    parser.add_argument("--only-product")
    parser.add_argument("--only-profile")
    parser.add_argument("--only-configuration")
    parser.add_argument("--only-opening")
    parser.add_argument("--report", default="reports/price-correction-dry-run.json")
    parser.add_argument("--sql-out")
    args = parser.parse_args()

    data = read_json(args.source)
    results, counters, blockers, indexes = analyze(args.csv, data, args)
    payloads, payload_blockers = build_parent_payloads(results, indexes)
    sql_text, sql_count = build_sql(results)

    if args.sql_out:
        Path(args.sql_out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.sql_out).write_text(sql_text)

    write_report(args.report, results, counters, blockers, payloads, payload_blockers, sql_count, args)

    print("mode", "apply" if args.apply else "dry-run")
    print("csv_rows_processed", len(results))
    print("summary", json.dumps(dict(counters), sort_keys=True))
    print("blockers", json.dumps(blockers, sort_keys=True))
    print("payload_blockers", json.dumps(payload_blockers, ensure_ascii=False))
    print("parent_payloads", len(payloads), "corrections", sum(p["_correction_count"] for p in payloads))
    print("sql_updates", sql_count)
    print("report", args.report)
    if args.sql_out:
        print("sql_out", args.sql_out)

    if blockers or payload_blockers:
        print("Refusing to apply because blockers exist.", file=sys.stderr)
        return 2 if args.apply else 0

    if not args.apply:
        return 0

    applied = 0
    for payload in payloads:
        post_update(payload)
        applied += payload["_correction_count"]
        print(f"updated parent {payload['id']} corrections={payload['_correction_count']}")

    print("applied_corrections", applied)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
