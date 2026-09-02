path = "backend/app/data/animal_encyclopedia.py"
with open(path, encoding="utf-8") as f:
    content = f.read()

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

broken = "]\n" + NEW_CATEGORIES + "\n\n# Flat per-animal list"
fixed = NEW_CATEGORIES + "]\n\n\n# Flat per-animal list"

if broken in content:
    content = content.replace(broken, fixed, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("bracket placement fixed")
else:
    print("could not find the exact broken pattern -- file may need manual inspection")
