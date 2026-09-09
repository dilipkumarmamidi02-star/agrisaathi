import csv
import json
from collections import defaultdict

INPUT = "scripts/pincode_directory.csv"
OUTPUT = "src/data/locations.json"

def clean(value):
    return (value or "").strip()

def titlecase(value):
    return " ".join(w.capitalize() for w in value.split())

tree = defaultdict(lambda: defaultdict(set))

with open(INPUT, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        state = clean(row.get("statename"))
        district = clean(row.get("district"))
        village = clean(row.get("officename"))

        if not state or state.upper() == "NA":
            continue
        if not district or district.upper() == "NA":
            continue

        state_key = titlecase(state)
        district_key = titlecase(district)

        if village and village.upper() != "NA":
            # Strip trailing office-type suffixes like "B.O" / "S.O" / "SO"
            village_clean = village
            for suffix in [" B.O", " S.O", " SO", " PO", " P.O"]:
                if village_clean.upper().endswith(suffix.upper()):
                    village_clean = village_clean[: -len(suffix)].strip()
            tree[state_key][district_key].add(titlecase(village_clean))

result = {}
for state, districts in sorted(tree.items()):
    result[state] = {}
    for district, villages in sorted(districts.items()):
        result[state][district] = sorted(villages)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

total_states = len(result)
total_districts = sum(len(d) for d in result.values())
total_villages = sum(len(v) for d in result.values() for v in d.values())

print(f"OK: wrote {OUTPUT}")
print(f"States: {total_states}, Districts: {total_districts}, Villages: {total_villages}")
