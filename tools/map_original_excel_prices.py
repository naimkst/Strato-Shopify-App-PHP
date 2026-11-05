#!/usr/bin/env python3
import argparse
import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


DEFAULT_ROWS = "reports/original-excel-price-rows.csv"
DEFAULT_MATRICES = "reports/original-excel-matrices.csv"
DEFAULT_SOURCE = "/Users/naim/WWW/strato-project-backups/codex-20260811-001938-before-original-excel-bulk-fix/remote-data/get-tabs-live.json"

PRODUCT_STATIC_CODE = {
    "Window": "__static_ksf__",
    "Balcony door": "__static_balkon__",
    "Sliding door": "__static_schiebe__",
}

PROFILE_IDS = {
    "aluplast ideal 4000": "1",
    "aluplast ideał 4000": "1",
    "aluplast ideal7000": "2",
    "aluplast ideal 7000": "2",
    "aluplast ideał 7000": "2",
    "aluplast ideal 8000": "3",
    "aluplast ideał 8000": "3",
    "fenster salamander 76 ad": "4",
    "salamander 76 ad balkon": "4",
    "fenster salamander 76 md": "5",
    "salamander 76 md balkon": "5",
    "fenster salamander 82 md": "420",
    "salamander balkontüren 82 md": "420",
    "aluplast hst85": "584",
    "salamander hst82": "585",
}

WING_IDS = {
    "1-part": "14",
    "2-part": "15",
    "3-part": "16",
    "sliding": "15",
}

OPENING_LABELS = {
    "425": "Dreh-Kipp Links",
    "426": "Dreh-Kipp Rechts",
    "429": "Festelement",
    "430": "Kipp Griff Oben",
    "437": "DKL/DKR-Pfosten",
    "438": "DL/DKR-Pfosten",
    "439": "DKL/DR-Pfosten",
    "440": "Fest/Fest",
    "441": "DL-Stulp/DKR",
    "444": "DKL/DR-Stulp",
    "445": "Fest/DKR",
    "446": "DKL/Fest",
    "497": "Fest/Fest/Fest im Rahmen",
    "498": "Fest/DKR/Fest",
    "499": "Fest/DKL/Fest",
    "502": "DKL/Fest/DKR",
    "503": "Fest/DL-Pfosten/DKR",
    "504": "DL-Pfosten/DKR-Fest",
    "505": "DKL/DR-Pfosten/Fest",
    "506": "Fest/DL-Stulp/DKR",
    "509": "DL-Stulp/DKR-Fest",
    "510": "DKL/DR-Stulp/Fest",
    "554": "DKL/Fest/Fest",
    "616": "Fest/Fest/DKR",
    "609": "Tür Dreh-Kipp Links",
    "610": "Tür Dreh-Kipp Rechts",
    "611": "Tür Dreh Links",
    "612": "Tür Dreh Rechts",
    "815": "Hebeschiebe Rechts - Hebeschiebe Festfeld",
    "816": "Hebeschiebe Festfeld - Hebeschiebe Links",
    "1078": "Fest im Rahmen-DKL-Pfosten-DKR",
    "1079": "DKL-Pfosten-DKR - Fest im Rahmen",
}


def normalize(value):
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("ß", "ss")
    text = re.sub(r"[^a-zA-Z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip().lower()


PROFILE_IDS_NORMALIZED = {normalize(key): value for key, value in PROFILE_IDS.items()}


def squash(value):
    return re.sub(r"[^a-z0-9]+", "", normalize(value))


def money(value):
    try:
        return Decimal(str(value).replace(",", ".")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"invalid money value: {value!r}") from exc


def compact_combo(ids):
    return json.dumps([str(item) for item in ids], separators=(",", ":"))


def sql_quote(value):
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def add_once(target, value):
    if value not in target:
        target.append(value)


def matrix_segments(matrix):
    raw_segments = [matrix["relative_path"]]
    raw_segments.extend(str(matrix.get("title", "")).split("|"))
    return [squash(segment) for segment in raw_segments if squash(segment)]


def has_any(segments, *patterns):
    return any(pattern in segment for segment in segments for pattern in patterns)


def infer_config(matrix):
    text = squash(matrix["relative_path"] + " " + matrix.get("title", ""))
    config = matrix["configuration"]
    if matrix["product"] == "Sliding door":
        return "sliding"
    if "1teilig" in text:
        return "1-part"
    if "2teilig" in text:
        return "2-part"

    # One 76 MD two-part Pfosten workbook is stored inside the 3-Teilig folder.
    if (
        matrix["product"] == "Window"
        and config == "3-part"
        and "festimrahmen" not in text
        and (
            "drehlinkspfostendrehkipprechts" in text
            or "drehkipplinkspfostendrehkipprechts" in text
            or "drehlinksstulpdrehkipprechts" in text
        )
    ):
        return "2-part"
    if "3teilig" in text:
        return "3-part"
    return config


def balcony_openings(config, segments):
    opening_ids = []
    if config == "1-part":
        if has_any(segments, "drehkipp"):
            add_once(opening_ids, "609")
            add_once(opening_ids, "610")
        elif has_any(segments, "drehflugel", "dreh1teilig", "dreh"):
            add_once(opening_ids, "611")
            add_once(opening_ids, "612")
    elif config == "2-part":
        if has_any(segments, "drehkipplinkspfostendrehkipprechts"):
            add_once(opening_ids, "437")
        if has_any(segments, "drehlinkspfostendrehkipprechts"):
            add_once(opening_ids, "438")
            add_once(opening_ids, "439")
        if has_any(segments, "drehlinksstulpdrehkipprechts"):
            add_once(opening_ids, "441")
            add_once(opening_ids, "444")
    return opening_ids


def window_openings(config, segments):
    opening_ids = []
    if config == "1-part":
        if has_any(segments, "drehkipp"):
            add_once(opening_ids, "425")
            add_once(opening_ids, "426")
        elif has_any(segments, "kipp"):
            add_once(opening_ids, "430")
        elif has_any(segments, "fest"):
            add_once(opening_ids, "429")
    elif config == "2-part":
        if has_any(segments, "festfest", "festfestimrahmen"):
            add_once(opening_ids, "440")
        if has_any(segments, "festdrehkipp", "festimrahmendrehkipprechts"):
            add_once(opening_ids, "445")
            add_once(opening_ids, "446")
        if has_any(segments, "drehkipplinkspfostendrehkipprechts"):
            add_once(opening_ids, "437")
        if has_any(segments, "drehlinkspfostendrehkipprechts"):
            add_once(opening_ids, "438")
            add_once(opening_ids, "439")
        if has_any(segments, "drehlinksstulpdrehkipp"):
            add_once(opening_ids, "441")
            add_once(opening_ids, "444")
    elif config == "3-part":
        if has_any(segments, "festfestfestimrahmen"):
            add_once(opening_ids, "497")
        if has_any(segments, "festimrahmendkrfestimrahmen", "festimrahmendrehkipprechtsfestimrahmen"):
            add_once(opening_ids, "498")
        if has_any(segments, "festimrahmendklfestimrahmen", "festimrahmendrehkipplinksfestimrahmen"):
            add_once(opening_ids, "499")
        if has_any(
            segments,
            "dklfestfestimrahmen",
            "dklfestimrahmenfestimrahmen",
            "drehkipplinksfestfestimrahmen",
            "drehkipplinksfestimrahmenfestimrahmen",
        ):
            add_once(opening_ids, "554")
        if has_any(
            segments,
            "festfestimrahmendkr",
            "festfestimrahmendrehkipprechts",
            "festimrahmenfestimrahmendkr",
        ):
            add_once(opening_ids, "616")
        if has_any(segments, "dklfestimrahmendkr", "drehkipplinksfestimrahmendrehkipprechts"):
            add_once(opening_ids, "502")
        if has_any(segments, "festimrahmendlpfostendkr", "festimrahmendrehlinkspfostendrehkipprechts"):
            add_once(opening_ids, "503")
        if has_any(
            segments,
            "dlpfostendkrfestimrahmen",
            "drehlinkspfostendrehkipprechtsfest",
            "drehlinkspfostendrehkipprechtsfestimrahmen",
        ):
            add_once(opening_ids, "504")
        if has_any(
            segments,
            "dklpfostendrfestimrahmen",
            "drehkipplinkspfostendrfest",
            "drehkipplinkspfostendrechtsfest",
            "drehkipplinkspfostendrechtsfestimrahmen",
        ):
            add_once(opening_ids, "505")
        if has_any(segments, "festimrahmendlstulpdkr", "festimrahmendrehlinksstulpdrehkipprechts"):
            add_once(opening_ids, "506")
        if has_any(
            segments,
            "dlstulpdkrfestimrahmen",
            "drehlinksstulpdrehkipprechtsfest",
            "drehlinksstulpdrehkipprechtsfestimrahmen",
        ):
            add_once(opening_ids, "509")
        if has_any(
            segments,
            "dklstulpdrfestimrahmen",
            "drehkipplinksstulpdrfest",
            "drehkipplinksstulpdrehrechtsfest",
            "drehkipplinksstulpdrehrechtsfestimrahmen",
        ):
            add_once(opening_ids, "510")
        if has_any(
            segments,
            "festimrahmendklpfostendkr",
            "festimrahmendrehkipplinkspfostendrehkipprechts",
            "drehkipplinkspfostenfestimrahmenpfostendrehkipprechts",
        ):
            add_once(opening_ids, "1078")
        if has_any(
            segments,
            "dklpfostendkrfestimrahmen",
            "drehkipplinkspfostendrehkipprechtsfestimrahmen",
        ):
            add_once(opening_ids, "1079")
    return opening_ids


def opening_ids_for(matrix):
    segments = matrix_segments(matrix)
    config = infer_config(matrix)
    if matrix["product"] == "Sliding door":
        return config, ["815", "816"]
    if matrix["product"] == "Balcony door":
        return config, balcony_openings(config, segments)
    if matrix["product"] == "Window":
        return config, window_openings(config, segments)
    return config, []


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


def build_db_indexes(data):
    row_by_key = defaultdict(list)
    parents_by_combo = defaultdict(set)
    option_parent_by_combo = defaultdict(set)

    for row in data.get("height_width_prices", []) or []:
        combo_key = row.get("combo_option_ids", "")
        width = str(row.get("width", "")).strip()
        height = str(row.get("height", "")).strip()
        row_by_key[(combo_key, width, height)].append(row)
        parents_by_combo[combo_key].add(str(row.get("option_parent_id")))

    for option in iter_options(data):
        extra = option_extra(option)
        if "combo_option_ids" in extra and "height_width_rows" in extra:
            combo_key = compact_combo(extra.get("combo_option_ids"))
            option_parent_by_combo[combo_key].add(str(option.get("id")))

    return {
        "row_by_key": row_by_key,
        "parents_by_combo": parents_by_combo,
        "option_parent_by_combo": option_parent_by_combo,
    }


def build_matrix_mappings(matrices):
    mappings = {}
    counters = Counter()
    for matrix in matrices:
        key = (matrix["relative_path"], matrix["matrix_index"])
        result = {
            "relative_path": matrix["relative_path"],
            "product": matrix["product"],
            "profile_folder": matrix["profile_folder"],
            "source_configuration": matrix["configuration"],
            "effective_configuration": None,
            "opening_ids": [],
            "opening_labels": [],
            "status": "pending",
            "title": matrix.get("title", ""),
            "record_count": int(matrix["record_count"]),
        }

        static_code = PRODUCT_STATIC_CODE.get(matrix["product"])
        profile_id = PROFILE_IDS_NORMALIZED.get(normalize(matrix["profile_folder"]))
        config, opening_ids = opening_ids_for(matrix)
        wing_id = WING_IDS.get(config)
        result["effective_configuration"] = config

        if not static_code:
            result["status"] = "unmapped_product"
        elif not profile_id:
            result["status"] = "unmapped_profile"
        elif not wing_id:
            result["status"] = "unmapped_configuration"
        elif not opening_ids:
            result["status"] = "unmapped_opening"
        else:
            result["status"] = "mapped"
            result["static_code"] = static_code
            result["profile_id"] = profile_id
            result["wing_id"] = wing_id
            result["opening_ids"] = opening_ids
            result["opening_labels"] = [OPENING_LABELS.get(opening_id, opening_id) for opening_id in opening_ids]
            result["combo_keys"] = [compact_combo([static_code, profile_id, wing_id, opening_id]) for opening_id in opening_ids]

        counters[result["status"]] += 1
        mappings[key] = result
    return mappings, counters


def build_targets(rows, matrix_mappings):
    targets = defaultdict(list)
    skipped_rows = []
    counters = Counter()

    for row in rows:
        key = (row["relative_path"], row["matrix_index"])
        mapping = matrix_mappings.get(key)
        if not mapping or mapping["status"] != "mapped":
            skipped_rows.append({"row": row, "matrix_status": mapping["status"] if mapping else "missing_matrix"})
            counters["skipped_unmapped_matrix"] += 1
            continue
        for combo_key in mapping["combo_keys"]:
            target_key = (combo_key, str(row["width"]).strip(), str(row["height"]).strip())
            targets[target_key].append({
                "target_price": str(money(row["price"])),
                "relative_path": row["relative_path"],
                "cell": row["cell"],
                "product": row["product"],
                "profile_folder": row["profile_folder"],
                "source_configuration": row["configuration"],
                "effective_configuration": mapping["effective_configuration"],
                "opening_labels": "; ".join(mapping["opening_labels"]),
            })
            counters["expanded_targets"] += 1
    return targets, skipped_rows, counters


def choose_parent(combo_key, indexes):
    parent_ids = set(indexes["parents_by_combo"].get(combo_key, set()))
    parent_ids.update(indexes["option_parent_by_combo"].get(combo_key, set()))
    if len(parent_ids) == 1:
        return next(iter(parent_ids)), None
    if not parent_ids:
        return None, "missing_parent"
    return None, "ambiguous_parent"


def analyze_targets(targets, indexes):
    rows = []
    counters = Counter()
    conflicts = []
    conflict_keys = set()

    for target_key, source_rows in targets.items():
        prices = {item["target_price"] for item in source_rows}
        if len(prices) > 1:
            conflict_keys.add(target_key)
            conflicts.append({
                "combo_key": target_key[0],
                "width": target_key[1],
                "height": target_key[2],
                "prices": sorted(prices),
                "sources": source_rows[:8],
            })
            counters["conflict_targets"] += 1

    for target_key, source_rows in targets.items():
        combo_key, width, height = target_key
        source = source_rows[0]
        source_files = sorted({item["relative_path"] for item in source_rows})
        source_cells = sorted({item["cell"] for item in source_rows})
        target_price = source["target_price"]
        base = {
            "combo_key": combo_key,
            "width": width,
            "height": height,
            "target_price": target_price,
            "source_files": " | ".join(source_files),
            "source_cells": " | ".join(source_cells),
            "product": source["product"],
            "profile_folder": source["profile_folder"],
            "configuration": source["effective_configuration"],
            "opening_labels": source["opening_labels"],
        }

        if target_key in conflict_keys:
            rows.append({**base, "action": "conflict", "current_price": "", "row_id": "", "option_parent_id": ""})
            continue

        matches = indexes["row_by_key"].get(target_key, [])
        if len(matches) > 1:
            counters["duplicate_db_keys"] += 1
            for db_row in matches:
                current_price = str(money(db_row.get("price")))
                action = "already_correct_duplicate" if current_price == target_price else "update_duplicate"
                rows.append({
                    **base,
                    "action": action,
                    "current_price": current_price,
                    "row_id": str(db_row.get("id")),
                    "option_parent_id": str(db_row.get("option_parent_id")),
                })
                counters[action] += 1
            continue
        if not matches:
            parent_id, parent_error = choose_parent(combo_key, indexes)
            if parent_error:
                action = "create_parent_insert" if parent_error == "missing_parent" else parent_error
                rows.append({**base, "action": action, "current_price": "", "row_id": "", "option_parent_id": ""})
                counters[action] += 1
            else:
                rows.append({**base, "action": "insert", "current_price": "", "row_id": "", "option_parent_id": parent_id})
                counters["insert"] += 1
            continue

        db_row = matches[0]
        current_price = str(money(db_row.get("price")))
        action = "already_correct" if current_price == target_price else "update"
        rows.append({
            **base,
            "action": action,
            "current_price": current_price,
            "row_id": str(db_row.get("id")),
            "option_parent_id": str(db_row.get("option_parent_id")),
        })
        counters[action] += 1

    counters["target_keys"] = len(targets)
    return rows, counters, conflicts


def build_sql(change_rows):
    statements = [
        "-- Generated by tools/map_original_excel_prices.py",
        "-- Source: original Excel files from data/original-excel/Prices 08-06-2026",
        "-- Guarded updates check row id, combo key, width, height, and old rounded price.",
        "-- Inserts check that the exact combo key/width/height row does not already exist.",
        "START TRANSACTION;",
    ]
    updates = 0
    inserts = 0
    parent_expr_by_combo = {}

    missing_parent_groups = defaultdict(list)
    for row in change_rows:
        if row["action"] == "create_parent_insert":
            missing_parent_groups[row["combo_key"]].append(row)

    for index, (combo_key, rows) in enumerate(sorted(missing_parent_groups.items()), start=1):
        combo_ids = json.loads(combo_key)
        label = "HW Combo: " + " > ".join(combo_ids)
        parent_var = f"@hw_parent_{index}"
        parent_expr_by_combo[combo_key] = parent_var
        height_width_rows = [
            {"height": row["height"], "width": row["width"], "price": row["target_price"]}
            for row in sorted(rows, key=lambda item: (int(item["height"]), int(item["width"])))
        ]
        extra_json = json.dumps(
            {"combo_option_ids": combo_ids, "height_width_rows": height_width_rows},
            ensure_ascii=False,
            separators=(",", ":"),
        )
        statements.append(f"-- Create missing parent for {combo_key}")
        statements.append(
            "INSERT INTO tab_options "
            "(tab_id, subtab_id, section_id, label, value_key, image_url, price, extra_json, option_type, depends_on) "
            "SELECT NULL, 1, NULL, "
            f"{sql_quote(label)}, '', '', '0.00', {sql_quote(extra_json)}, '', '' "
            "WHERE NOT EXISTS ("
            "SELECT 1 FROM tab_options "
            f"WHERE label = {sql_quote(label)} AND subtab_id = 1"
            ");"
        )
        statements.append(
            f"SET {parent_var} := ("
            "SELECT id FROM tab_options "
            f"WHERE label = {sql_quote(label)} AND subtab_id = 1 "
            "ORDER BY id DESC LIMIT 1"
            ");"
        )

    for row in sorted(change_rows, key=lambda item: (item["action"], int(item["row_id"] or 0), item["combo_key"], int(item["width"]), int(item["height"]))):
        if row["action"] in {"update", "update_duplicate"}:
            statements.append(
                "UPDATE height_width_prices "
                f"SET price = {sql_quote(row['target_price'])} "
                f"WHERE id = {int(row['row_id'])} "
                f"AND combo_option_ids = {sql_quote(row['combo_key'])} "
                f"AND width = {sql_quote(row['width'])} "
                f"AND height = {sql_quote(row['height'])} "
                f"AND ROUND(price, 2) = {sql_quote(row['current_price'])};"
            )
            updates += 1
        elif row["action"] in {"insert", "create_parent_insert"}:
            if row["combo_key"] in parent_expr_by_combo:
                parent_expr = parent_expr_by_combo[row["combo_key"]]
            else:
                parent_expr = str(int(row["option_parent_id"]))
            statements.append(
                "INSERT INTO height_width_prices (option_parent_id, combo_option_ids, height, width, price) "
                f"SELECT {parent_expr}, {sql_quote(row['combo_key'])}, "
                f"{sql_quote(row['height'])}, {sql_quote(row['width'])}, {sql_quote(row['target_price'])} "
                "WHERE NOT EXISTS ("
                "SELECT 1 FROM height_width_prices "
                f"WHERE combo_option_ids = {sql_quote(row['combo_key'])} "
                f"AND width = {sql_quote(row['width'])} "
                f"AND height = {sql_quote(row['height'])}"
                ");"
            )
            inserts += 1

    statements.extend([
        f"-- Expected update statements: {updates}",
        f"-- Expected insert statements: {inserts}",
        "COMMIT;",
        "",
    ])
    return "\n".join(statements), updates, inserts


def write_csv(path, rows):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "action",
        "product",
        "profile_folder",
        "configuration",
        "opening_labels",
        "width",
        "height",
        "current_price",
        "target_price",
        "row_id",
        "option_parent_id",
        "combo_key",
        "source_files",
        "source_cells",
    ]
    with Path(path).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description="Map original Excel price rows to configurator DB price rows.")
    parser.add_argument("--rows", default=DEFAULT_ROWS)
    parser.add_argument("--matrices", default=DEFAULT_MATRICES)
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--report", default="reports/original-excel-price-map-report.json")
    parser.add_argument("--changes-csv", default="reports/original-excel-price-changes.csv")
    parser.add_argument("--sql-out", default="reports/original-excel-price-fix.sql")
    args = parser.parse_args()

    matrices = read_csv(args.matrices)
    rows = read_csv(args.rows)
    data = json.loads(Path(args.source).read_text())
    indexes = build_db_indexes(data)

    matrix_mappings, matrix_counters = build_matrix_mappings(matrices)
    targets, skipped_rows, target_counters = build_targets(rows, matrix_mappings)
    change_rows, change_counters, conflicts = analyze_targets(targets, indexes)
    sql_text, sql_updates, sql_inserts = build_sql(change_rows)

    Path(args.sql_out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.sql_out).write_text(sql_text, encoding="utf-8")
    write_csv(args.changes_csv, change_rows)

    report = {
        "source_json": args.source,
        "excel_rows": len(rows),
        "excel_matrices": len(matrices),
        "matrix_summary": dict(matrix_counters),
        "target_summary": dict(target_counters),
        "change_summary": dict(change_counters),
        "sql_update_statements": sql_updates,
        "sql_insert_statements": sql_inserts,
        "unmapped_matrices": [item for item in matrix_mappings.values() if item["status"] != "mapped"],
        "mapped_matrices": list(matrix_mappings.values()),
        "conflicts": conflicts[:200],
        "skipped_row_count": len(skipped_rows),
        "outputs": {
            "changes_csv": args.changes_csv,
            "sql": args.sql_out,
        },
    }
    Path(args.report).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print("excel_matrices", len(matrices))
    print("excel_rows", len(rows))
    print("matrix_summary", json.dumps(dict(matrix_counters), sort_keys=True))
    print("target_summary", json.dumps(dict(target_counters), sort_keys=True))
    print("change_summary", json.dumps(dict(change_counters), sort_keys=True))
    print("sql_updates", sql_updates)
    print("sql_inserts", sql_inserts)
    print("conflicts", len(conflicts))
    print("report", args.report)
    print("changes_csv", args.changes_csv)
    print("sql_out", args.sql_out)


if __name__ == "__main__":
    main()
