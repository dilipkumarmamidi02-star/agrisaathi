"""
download_pincodes.py

Downloads the full India Pincode Directory from Data.gov.in using the
JSON API (not CSV format — the CSV endpoint silently caps how many
rows it returns per request regardless of the `limit` param).

v2 fixes:
- Catches ALL request failures (TimeoutError is NOT a URLError
  subclass in Python 3.10+, which crashed the first version outright
  instead of retrying).
- RESUMABLE: writes progress to a .offset file, so re-running after a
  crash continues from where it left off instead of restarting.
- Smaller batch size (500) and longer per-request timeout (60s) since
  data.gov.in's server appears slow/flaky on this resource.

Usage:
    export DATA_GOV_API_KEY="your_key_here"
    python3 app/data/download_pincodes.py
    # if it crashes or you Ctrl+C, just run it again — it resumes
"""

import csv
import os
import sys
import time
import urllib.request
import json
from pathlib import Path

API_KEY = os.environ.get("DATA_GOV_API_KEY")
RESOURCE_ID = "5c2f62fe-5afa-4119-a499-fec9d604d5bd"
BASE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

DATA_DIR = Path(__file__).resolve().parent
OUT_PATH = DATA_DIR / "pincode_directory.csv"
OFFSET_FILE = DATA_DIR / "pincode_directory.offset"

BATCH_SIZE = 500
REQUEST_TIMEOUT = 60
MAX_RETRIES = 8


def fetch_batch(offset: int) -> dict:
    params = f"api-key={API_KEY}&format=json&limit={BATCH_SIZE}&offset={offset}"
    url = f"{BASE_URL}?{params}"

    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as resp:
                body = resp.read().decode("utf-8", errors="ignore")
                return json.loads(body)
        except Exception as e:
            # Catch everything here on purpose — TimeoutError, socket
            # errors, URLError, JSON decode errors on a truncated
            # response, all of it. We always want to retry, not crash.
            last_err = e
            wait = min(attempt * 3, 30)
            print(f"  ! request failed at offset {offset} (attempt {attempt}/{MAX_RETRIES}): "
                  f"{type(e).__name__}: {e}")
            print(f"    retrying in {wait}s...")
            time.sleep(wait)

    raise RuntimeError(f"Failed to fetch offset {offset} after {MAX_RETRIES} attempts: {last_err}")


def load_resume_offset() -> int:
    if OFFSET_FILE.exists() and OUT_PATH.exists() and OUT_PATH.stat().st_size > 0:
        try:
            return int(OFFSET_FILE.read_text().strip())
        except ValueError:
            return 0
    return 0


def main():
    if not API_KEY:
        print("✗ DATA_GOV_API_KEY is not set in this shell. Run:")
        print('  export DATA_GOV_API_KEY="your_key_here"')
        sys.exit(1)

    offset = load_resume_offset()
    mode = "a" if offset > 0 else "w"
    write_header = offset == 0

    if offset > 0:
        print(f"Resuming from offset {offset} (found existing progress)")
    print(f"Writing to {OUT_PATH}")

    total = None
    writer = None
    fieldnames = None
    rows_written = 0

    with open(OUT_PATH, mode, newline="", encoding="utf-8") as f:
        while True:
            data = fetch_batch(offset)

            if total is None:
                total = int(data.get("total", 0))
                print(f"API reports total records available: {total}")

            records = data.get("records", [])
            if not records:
                print(f"No more records at offset {offset} — stopping.")
                break

            if writer is None:
                fieldnames = list(records[0].keys())
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                if write_header:
                    writer.writeheader()

            for rec in records:
                writer.writerow(rec)
            f.flush()
            rows_written += len(records)

            offset += len(records)
            OFFSET_FILE.write_text(str(offset))
            print(f"  fetched {len(records)} records (offset now {offset}, written this run: {rows_written})")

            if total and offset >= total:
                print("Reached reported total — download complete.")
                break

            time.sleep(0.5)

    print(f"\n✓ Done. Wrote {rows_written} rows this run to {OUT_PATH}")
    print(f"  Total rows in file: {sum(1 for _ in open(OUT_PATH)) - 1}")
    OFFSET_FILE.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
