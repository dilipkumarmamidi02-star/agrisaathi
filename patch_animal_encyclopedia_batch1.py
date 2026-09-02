path = "backend/app/data/animal_encyclopedia.py"
with open(path, encoding="utf-8") as f:
    content = f.read()

BREED_ADDITIONS = {
    "poultry": [
        "Aseel", "Chittagong", "Ankaleshwar", "Nicobari", "Punjab Brown",
        "CARI Nirbheek", "CARI Shyama", "Grampriya", "Krishibro", "Kalinga Brown",
        "Giriraja", "Swarnadhara", "Cobb 400 (Broiler)", "Rhode Island Red",
        "White Leghorn",
    ],
    "dairy": [
        "Red Sindhi", "Tharparkar", "Rathi", "Kankrej", "Ongole",
        "Hariana", "Deoni", "Nagori", "Malvi", "Krishna Valley",
        "Amritmahal", "Hallikar", "Khillari", "Nimari", "Vechur",
        "Punganur", "Dangi", "Kherigarh", "Siri", "Mewati",
        "Nili-Ravi Buffalo", "Surti Buffalo", "Mehsana Buffalo",
        "Jaffarabadi Buffalo", "Bhadawari Buffalo", "Nagpuri Buffalo",
        "Pandharpuri Buffalo", "Toda Buffalo", "Banni Buffalo",
    ],
    "fisheries": [
        "Common Carp", "Grass Carp", "Silver Carp", "Magur (Walking Catfish)",
        "Singhi (Stinging Catfish)", "Pearl Spot (Karimeen)", "Hilsa",
        "Anabas (Climbing Perch)", "Freshwater Prawn (Scampi)",
    ],
    "apiculture": [
        "Apis dorsata (Rock Bee)", "Apis florea (Little Bee)", "Stingless Bee (Trigona)",
    ],
    "aquaculture_prawns": [
        "Freshwater Giant Prawn (Macrobrachium rosenbergii)",
    ],
    "small_ruminants": [
        "Jamunapari", "Barbari", "Beetal", "Sirohi", "Black Bengal",
        "Malabari", "Ganjam", "Marwari Goat", "Kutchi", "Jakhrana",
        "Sangamneri", "Kanni Aadu", "Changthangi", "Nali", "Magra",
        "Chokla", "Patanwadi", "Bellary", "Mandya", "Coimbatore",
        "Madras Red", "Gaddi", "Bhakarwal", "Kashmir Merino", "Rampur Bushair",
        "Muzaffarnagari",
    ],
}

NEW_CATEGORIES = """
    {
        "category": "swine",
        "label": "Pig Farming",
        "breeds": ["Large White Yorkshire", "Landrace", "Ghungroo", "Doom", "Niang Megha", "Tenyi Vo", "Duroc"],
        "vaccination_schedule": [
            {"age": "6-8 weeks", "vaccine": "Classical Swine Fever (CSF)", "route": "Intramuscular, annual booster"},
            {"age": "8 weeks", "vaccine": "Foot and Mouth Disease (FMD)", "route": "Every 6 months"},
        ],
        "feed": "Starter ration (0-8 wks, 20% protein), grower-finisher ration thereafter, kitchen waste supplementation common in backyard systems",
        "environment": "Concrete-floor pen, 1.5-2 sq.m per adult, shade and wallow access in hot climates",
        "yield_timeline": "Market weight (80-100kg) reached in 6-8 months; sows farrow twice/year, 8-12 piglets/litter",
    },
    {
        "category": "rabbit",
        "label": "Rabbit Farming",
        "breeds": ["New Zealand White", "Soviet Chinchilla", "Grey Giant", "Angora"],
        "vaccination_schedule": [
            {"age": "N/A", "vaccine": "No standard vaccination in India — focus on hygiene and deworming every 3 months", "route": "N/A"},
        ],
        "feed": "Pelleted rabbit feed + green fodder (lucerne, carrot tops), 100-150g/day for adults",
        "environment": "Raised wire-floor cages, well-ventilated shed, protection from direct heat and predators",
        "yield_timeline": "Breeding age 5-6 months, gestation 30-31 days, 5-8 kits/litter, market weight in 3 months",
    },
    {
        "category": "duck",
        "label": "Duck Farming",
        "breeds": ["Khaki Campbell", "Indian Runner", "Nageswari", "White Pekin"],
        "vaccination_schedule": [
            {"age": "1 week", "vaccine": "Duck Plague (if endemic area)", "route": "Subcutaneous"},
            {"age": "4 weeks", "vaccine": "Duck Cholera", "route": "As per local advisory"},
        ],
        "feed": "Duck starter mash (0-8 wks), grower ration thereafter, supplemented by natural foraging in ponds/paddy fields",
        "environment": "Access to water body or paddy field, simple shelter for night housing, low input system",
        "yield_timeline": "Egg laying starts at 22-24 weeks, 250-300 eggs/year for layer breeds",
    },
    {
        "category": "quail",
        "label": "Japanese Quail Farming",
        "breeds": ["Japanese Quail (Coturnix coturnix japonica)"],
        "vaccination_schedule": [
            {"age": "N/A", "vaccine": "No standard vaccination — biosecurity and clean brooding critical", "route": "N/A"},
        ],
        "feed": "Quail starter mash (24% protein) first 3 weeks, layer ration after, ad-lib feeding",
        "environment": "Brooding temp 35-37°C reducing weekly, cage or deep-litter system, low space requirement",
        "yield_timeline": "Egg laying starts at 6-7 weeks, market-ready for meat at 5 weeks, ~250-300 eggs/year",
    },
"""

pattern_marker = '    {\n        "category": "small_ruminants",'
if pattern_marker not in content:
    print("small_ruminants block marker not found — aborting to avoid corrupting the file")
else:
    added_breeds_count = 0
    for cat_key, new_breeds in BREED_ADDITIONS.items():
        marker = f'"category": "{cat_key}",'
        idx = content.find(marker)
        if idx == -1:
            print(f"category {cat_key} not found, skipping")
            continue
        breeds_start = content.find('"breeds": [', idx)
        breeds_end = content.find(']', breeds_start)
        existing_block = content[breeds_start:breeds_end]
        insertion = "".join(f', "{b}"' for b in new_breeds)
        content = content[:breeds_end] + insertion + content[breeds_end:]
        added_breeds_count += len(new_breeds)

    end_marker = "]\n\n\n# Flat per-animal list"
    if end_marker in content:
        content = content.replace(end_marker, "]\n" + NEW_CATEGORIES + "\n\n# Flat per-animal list", 1)
        new_cat_breed_count = 7 + 4 + 4 + 1
        print(f"added {added_breeds_count} breeds to existing categories")
        print(f"added 4 new categories with {new_cat_breed_count} more breeds")
    else:
        print("end marker for ANIMAL_CATEGORIES not found, new categories not inserted")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

import re
count = len(re.findall(r'"category":\s*"', content)) - content.count("category_label")
print("done, run backend and check /api/livestock/... or the encyclopedia route to confirm it loads")
