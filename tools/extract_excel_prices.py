#!/usr/bin/env python3
import argparse
import csv
import json
import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

from openpyxl import load_workbook


DEFAULT_ROOT = "data/original-excel/Prices 08-06-2026"


def as_decimal(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    text = str(value).strip().replace("€", "").replace(" ", "").replace(",", ".")
    if text == "":
        return None
    try:
        value = Decimal(text)
    except InvalidOperation:
        return None
    if value == 0:
        return None
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def as_int(value):
    dec = as_decimal(value)
    if dec is None:
        return None
    if dec != dec.to_integral_value():
        return None
    number = int(dec)
    if number < 100 or number > 10000:
        return None
    return number


def as_dimension(value):
    number = as_int(value)
    if number is None:
        return None
    # Configurator size grids use 100 mm steps. This prevents ordinary
    # price values like 230, 242, 252 from being mistaken for width headers.
    if number % 100 != 0:
        return None
    return number


def row_values(ws, row):
    return [ws.cell(row, col).value for col in range(1, ws.max_column + 1)]


def text_near(ws, row, col, row_before=10, row_after=30, col_radius=14):
    texts = []
    for r in range(max(1, row - row_before), min(ws.max_row, row + row_after) + 1):
        for c in range(max(1, col - col_radius), min(ws.max_column, col + col_radius) + 1):
            value = ws.cell(r, c).value
            if isinstance(value, str):
                text = re.sub(r"\s+", " ", value).strip()
                if text:
                    texts.append(text)
    return " | ".join(dict.fromkeys(texts))


def find_width_runs(ws):
    runs = []
    for row in range(1, ws.max_row + 1):
        current = []
        for col in range(1, ws.max_column + 2):
            number = as_dimension(ws.cell(row, col).value) if col <= ws.max_column else None
            if number is not None:
                current.append((col, number))
                continue
            if len(current) >= 3:
                widths = [value for _col, value in current]
                if widths == sorted(widths) and len(set(widths)) == len(widths):
                    runs.append((row, current[0][0], current[-1][0], widths))
            current = []
    return runs


def extract_matrix(ws, header_row, start_col, end_col, widths):
    # Height labels usually sit immediately to the left of the first width
    # column, but some sheets have a few spacer columns before the matrix.
    candidate_height_cols = range(max(1, start_col - 4), start_col)
    best = None
    for height_col in candidate_height_cols:
        records = []
        last_height_row = None
        for row in range(header_row + 1, ws.max_row + 1):
            height = as_dimension(ws.cell(row, height_col).value)
            if height is None:
                if records and last_height_row is not None and row > last_height_row + 2:
                    break
                continue
            last_height_row = row
            row_prices = []
            for offset, col in enumerate(range(start_col, end_col + 1)):
                price = as_decimal(ws.cell(row, col).value)
                if price is not None:
                    row_prices.append({
                        "width": widths[offset],
                        "height": height,
                        "price": str(price),
                        "cell": ws.cell(row, col).coordinate,
                    })
            if row_prices:
                records.extend(row_prices)

        if best is None or len(records) > len(best["records"]):
            best = {"height_col": height_col, "records": records}

    if not best or len(best["records"]) < 3:
        return None

    return {
        "sheet": ws.title,
        "header_row": header_row,
        "start_col": start_col,
        "end_col": end_col,
        "height_col": best["height_col"],
        "title": text_near(ws, header_row, start_col),
        "records": best["records"],
    }


def extract_file(path):
    wb = load_workbook(path, data_only=True, read_only=False)
    matrices = []
    for ws in wb.worksheets:
        for header_row, start_col, end_col, widths in find_width_runs(ws):
            matrix = extract_matrix(ws, header_row, start_col, end_col, widths)
            if matrix and len(matrix["records"]) >= 3:
                matrices.append(matrix)
    return matrices


def product_from_path(parts):
    if "Balkontür" in parts:
        return "Balcony door"
    if "Fenster" in parts:
        return "Window"
    if "Schiebetür" in parts:
        return "Sliding door"
    return ""


def profile_from_path(parts):
    if len(parts) < 3:
        return ""
    product = parts[0]
    if product in {"Balkontür", "Fenster"}:
        return parts[1]
    if product == "Schiebetür":
        return parts[1]
    return ""


def config_from_path(parts):
    filename = parts[-1] if parts else ""
    match = re.search(r"([123])\s*[- ]?\s*teilig", filename, re.I)
    if match:
        return f"{match.group(1)}-part"
    for part in parts:
        match = re.search(r"([123])-Teilig", part, re.I)
        if match:
            return f"{match.group(1)}-part"
    if "Schiebetür" in parts:
        return "sliding"
    return ""


def write_outputs(root, summary_out, rows_out):
    root = Path(root)
    files = sorted(root.rglob("*.xlsx"))
    summaries = []
    rows = []

    for file in files:
        rel = file.relative_to(root)
        parts = rel.parts
        matrices = extract_file(file)
        for matrix_index, matrix in enumerate(matrices, start=1):
            summaries.append({
                "file": str(file),
                "relative_path": str(rel),
                "product": product_from_path(parts),
                "profile_folder": profile_from_path(parts),
                "configuration": config_from_path(parts),
                "matrix_index": matrix_index,
                "sheet": matrix["sheet"],
                "title": matrix["title"],
                "record_count": len(matrix["records"]),
                "width_count": len({record["width"] for record in matrix["records"]}),
                "height_count": len({record["height"] for record in matrix["records"]}),
                "min_width": min(record["width"] for record in matrix["records"]),
                "max_width": max(record["width"] for record in matrix["records"]),
                "min_height": min(record["height"] for record in matrix["records"]),
                "max_height": max(record["height"] for record in matrix["records"]),
            })
            for record in matrix["records"]:
                rows.append({
                    "file": str(file),
                    "relative_path": str(rel),
                    "product": product_from_path(parts),
                    "profile_folder": profile_from_path(parts),
                    "configuration": config_from_path(parts),
                    "matrix_index": matrix_index,
                    "sheet": matrix["sheet"],
                    "title": matrix["title"],
                    **record,
                })

    Path(summary_out).parent.mkdir(parents=True, exist_ok=True)
    with Path(summary_out).open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(summaries[0].keys()) if summaries else ["file"])
        writer.writeheader()
        writer.writerows(summaries)

    with Path(rows_out).open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()) if rows else ["file"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"files={len(files)} matrices={len(summaries)} rows={len(rows)}")
    print(f"summary={summary_out}")
    print(f"rows={rows_out}")


def main():
    parser = argparse.ArgumentParser(description="Extract width/height price matrices from original Excel files.")
    parser.add_argument("--root", default=DEFAULT_ROOT)
    parser.add_argument("--summary-out", default="reports/original-excel-matrices.csv")
    parser.add_argument("--rows-out", default="reports/original-excel-price-rows.csv")
    args = parser.parse_args()
    write_outputs(args.root, args.summary_out, args.rows_out)


if __name__ == "__main__":
    main()
