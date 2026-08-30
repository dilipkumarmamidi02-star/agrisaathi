"""
pincode_lookup.py

Loads the full India pincode directory CSV once at startup into an
in-memory index, so /api/location/pincode/{pincode} answers instantly
for ALL of India — no live Data.gov.in call, no rate limit, no
"only 10 states available right now" issue.

Rebuild the CSV periodically (monthly is plenty) by re-running the
download script; pincode->district mappings barely change.
"""

import csv
from functools import lru_cache
from pathlib import Path
from typing import Optional

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "pincode_directory.csv"


def _normalise_key(key: str) -> str:
    return key.strip().lower().replace(" ", "").replace("_", "")


def _pick(row: dict, *candidates: str) -> str:
    normalised = {_normalise_key(k): v for k, v in row.items()}
    for c in candidates:
        v = normalised.get(_normalise_key(c))
        if v:
            return str(v).strip()
    return ""


class PincodeIndex:
    def __init__(self):
        self._index: dict[str, dict] = {}
        self._loaded = False

    def load(self):
        if self._loaded:
            return
        if not CSV_PATH.exists():
            raise RuntimeError(
                f"pincode_directory.csv not found at {CSV_PATH}. "
                "Run the download script first."
            )

        with open(CSV_PATH, newline="", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pincode = _pick(row, "pincode", "pin", "pincod")
                if not pincode or not pincode.isdigit() or len(pincode) != 6:
                    continue

                state = _pick(row, "statename", "state")
                district = _pick(row, "districtname", "district")
                mandal = _pick(row, "taluk", "mandal", "block")
                village = _pick(row, "officename", "village", "postoffice")

                entry = self._index.setdefault(pincode, {
                    "pincode": pincode,
                    "state": state,
                    "district": district,
                    "mandals": set(),
                    "villages": set(),
                })
                if mandal:
                    entry["mandals"].add(mandal)
                if village:
                    entry["villages"].add(village)

        self._loaded = True
        print(f"[pincode_lookup] indexed {len(self._index)} pincodes from {CSV_PATH}")

    def resolve(self, pincode: str) -> Optional[dict]:
        if not self._loaded:
            self.load()
        entry = self._index.get(pincode)
        if not entry:
            return None
        return {
            "pincode": entry["pincode"],
            "state": entry["state"],
            "district": entry["district"],
            "mandals": sorted(entry["mandals"]),
            "villages": sorted(entry["villages"]),
        }


@lru_cache(maxsize=1)
def get_pincode_index() -> PincodeIndex:
    idx = PincodeIndex()
    idx.load()
    return idx
