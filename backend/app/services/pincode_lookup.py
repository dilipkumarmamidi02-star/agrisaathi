"""
pincode_lookup.py

Loads the full India pincode directory CSV once at startup into an
in-memory index, so /api/location/pincode/{pincode} answers instantly
for ALL of India — no live Data.gov.in call, no rate limit, no
"only 10 states available right now" issue.

Also builds a state -> district -> village tree from the same load,
so /api/location/states, /districts, /villages can serve manual
cascading dropdowns without a second dataset or a second file.

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


def _titlecase(value: str) -> str:
    return " ".join(w.capitalize() for w in value.split())


class PincodeIndex:
    def __init__(self):
        self._index: dict[str, dict] = {}
        # state -> district -> set(villages)
        self._tree: dict[str, dict[str, set]] = {}
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

                if not state or state.upper() == "NA":
                    state = ""
                if not district or district.upper() == "NA":
                    district = ""

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

                if state and district:
                    state_key = _titlecase(state)
                    district_key = _titlecase(district)
                    self._tree.setdefault(state_key, {}).setdefault(district_key, set())
                    if village and village.upper() != "NA":
                        village_clean = village
                        for suffix in [" B.O", " S.O", " SO", " PO", " P.O"]:
                            if village_clean.upper().endswith(suffix.upper()):
                                village_clean = village_clean[: -len(suffix)].strip()
                        self._tree[state_key][district_key].add(_titlecase(village_clean))

        self._loaded = True
        total_districts = sum(len(d) for d in self._tree.values())
        print(
            f"[pincode_lookup] indexed {len(self._index)} pincodes, "
            f"{len(self._tree)} states, {total_districts} districts "
            f"from {CSV_PATH}"
        )

    def resolve(self, pincode: str) -> Optional[dict]:
        if not self._loaded:
            self.load()
        entry = self._index.get(pincode)
        if not entry:
            return None
        return {
            "pincode": entry["pincode"],
            # Title-cased to match get_states()/get_districts() output —
            # the raw CSV has inconsistent casing (e.g. "TELANGANA")
            # which would otherwise break exact-match comparisons
            # against the manual-selection dropdowns.
            "state": _titlecase(entry["state"]) if entry["state"] else "",
            "district": _titlecase(entry["district"]) if entry["district"] else "",
            "mandals": sorted(entry["mandals"]),
            "villages": sorted(entry["villages"]),
        }

    def get_states(self) -> list[str]:
        if not self._loaded:
            self.load()
        return sorted(self._tree.keys())

    def get_districts(self, state: str) -> list[str]:
        if not self._loaded:
            self.load()
        state_key = _titlecase(state)
        return sorted(self._tree.get(state_key, {}).keys())

    def get_villages(self, state: str, district: str) -> list[str]:
        if not self._loaded:
            self.load()
        state_key = _titlecase(state)
        district_key = _titlecase(district)
        return sorted(self._tree.get(state_key, {}).get(district_key, set()))


@lru_cache(maxsize=1)
def get_pincode_index() -> PincodeIndex:
    idx = PincodeIndex()
    idx.load()
    return idx
