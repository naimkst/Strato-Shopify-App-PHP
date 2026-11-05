#!/usr/bin/env python3
import argparse
import html
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT_FOLDER_ID = "17YiPZeqjkDJYywiB0G_OYcFuzNjHqzBA"
ROOT_URL = f"https://drive.google.com/drive/folders/{ROOT_FOLDER_ID}"


def safe_name(name):
    name = re.sub(r"\s+", " ", name).strip()
    name = name.replace("/", "-").replace("\\", "-").replace(":", "-")
    name = re.sub(r"[^\w .()\-+äöüÄÖÜßłŁ]", "_", name)
    return name[:180] or "unnamed"


def fetch(url, timeout=60):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read(), response.headers, response.geturl()


def list_folder(folder_id):
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    raw, _headers, _final = fetch(url)
    text = raw.decode("utf-8", errors="replace")

    entries = []
    pattern = re.compile(
        r'data-id="([A-Za-z0-9_-]{10,})"[^>]*data-tooltip="([^"]+)"',
        re.S,
    )
    for match in pattern.finditer(text):
        file_id = match.group(1)
        tooltip = html.unescape(match.group(2))
        if (file_id, tooltip) not in entries:
            entries.append((file_id, tooltip))

    return entries


def download_file(file_id, tooltip, output_dir):
    is_excel = ".xlsx" in tooltip.lower() or "microsoft excel" in tooltip.lower()
    is_sheet = "google sheets" in tooltip.lower() or "spreadsheet" in tooltip.lower()
    if is_sheet and not is_excel:
        url = f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=xlsx"
    else:
        url = f"https://drive.google.com/uc?export=download&id={urllib.parse.quote(file_id)}"

    raw, headers, final_url = fetch(url, timeout=120)
    content_type = headers.get("Content-Type", "")

    # Public Drive downloads can return an HTML confirmation page for blocked or
    # permission-denied downloads. Refuse to save those as workbooks.
    if raw[:200].lower().find(b"<html") != -1 and "spreadsheet" not in content_type:
        raise RuntimeError(f"download returned HTML for {tooltip!r}: {final_url}")

    filename = tooltip
    filename = re.sub(r"\s+Microsoft Excel$", "", filename).strip()
    if not filename.lower().endswith(".xlsx"):
        filename += ".xlsx"
    output = output_dir / safe_name(filename)
    output.write_bytes(raw)
    return output, len(raw), content_type


def crawl(folder_id, output_root, rel_parts, seen, files):
    if folder_id in seen:
        return
    seen.add(folder_id)

    entries = list_folder(folder_id)
    folder_dir = output_root.joinpath(*[safe_name(part) for part in rel_parts])
    folder_dir.mkdir(parents=True, exist_ok=True)

    for file_id, tooltip in entries:
        if tooltip.endswith("Shared folder"):
            folder_name = tooltip[: -len("Shared folder")].strip()
            print(f"folder: {'/'.join(rel_parts + [folder_name])}")
            crawl(file_id, output_root, rel_parts + [folder_name], seen, files)
            time.sleep(0.2)
            continue

        if ".xlsx" not in tooltip.lower() and "excel" not in tooltip.lower() and "sheet" not in tooltip.lower():
            print(f"skip: {tooltip}")
            continue

        output, size, content_type = download_file(file_id, tooltip, folder_dir)
        files.append({
            "id": file_id,
            "tooltip": tooltip,
            "path": str(output),
            "bytes": size,
            "content_type": content_type,
        })
        print(f"downloaded: {output} ({size} bytes)")
        time.sleep(0.2)


def main():
    parser = argparse.ArgumentParser(description="Download public Drive price workbook folder.")
    parser.add_argument("--folder-id", default=ROOT_FOLDER_ID)
    parser.add_argument("--output", default="data/original-excel/Prices 08-06-2026")
    args = parser.parse_args()

    output_root = Path(args.output)
    files = []
    crawl(args.folder_id, output_root, [], set(), files)

    manifest = output_root / "download_manifest.tsv"
    manifest.write_text(
        "id\tbytes\tcontent_type\ttooltip\tpath\n"
        + "\n".join(
            f"{item['id']}\t{item['bytes']}\t{item['content_type']}\t{item['tooltip']}\t{item['path']}"
            for item in files
        )
        + "\n"
    )
    print(f"files_downloaded={len(files)}")
    print(f"manifest={manifest}")
    return 0 if files else 1


if __name__ == "__main__":
    raise SystemExit(main())
