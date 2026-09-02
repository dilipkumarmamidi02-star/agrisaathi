# Reference data for common Indian livestock/aquaculture categories.
# TODO_API: replace with data.gov.in livestock/animal husbandry dataset
# once API key is available — keep the same shape (category, breeds,
# vaccination_schedule, feed, environment, yield_timeline) so the
# frontend and route below don't need to change, only this file's source.

ANIMAL_CATEGORIES = [
    {
        "category": "poultry",
        "label": "Poultry (Layer/Broiler)",
        "breeds": [
            "Broiler",
            "Layer (BV-300)",
            "Kadaknath",
            "Vanaraja",
            "Aseel",
            "Chittagong",
            "Ankaleshwar",
            "Nicobari",
            "Punjab Brown",
            "CARI Nirbheek",
            "CARI Shyama",
            "Grampriya",
            "Krishibro",
            "Kalinga Brown",
            "Giriraja",
            "Swarnadhara",
            "Cobb 400 (Broiler)",
            "Rhode Island Red",
            "White Leghorn",
            "Nicobari Fowl (Black)",
            "Punjab Brown Hen",
            "Busra",
            "Miri",
            "Danki"
        ],
        "vaccination_schedule": [
            {
                "age": "Day 1",
                "vaccine": "Marek's Disease",
                "route": "Subcutaneous"
            },
            {
                "age": "Day 7",
                "vaccine": "Newcastle Disease (Lasota)",
                "route": "Eye drop"
            },
            {
                "age": "Day 14",
                "vaccine": "Infectious Bursal Disease (IBD)",
                "route": "Drinking water"
            },
            {
                "age": "Day 21",
                "vaccine": "IBD booster",
                "route": "Drinking water"
            },
            {
                "age": "Day 28",
                "vaccine": "Newcastle Disease booster",
                "route": "Drinking water"
            }
        ],
        "feed": "Starter mash (0-3 wks, 21-23% protein), grower mash (3-6 wks), layer/finisher mash after",
        "environment": "28-32°C brooding temp, dry bedding, 16 hrs light/day for layers",
        "yield_timeline": "Broilers: market-ready in 6 weeks. Layers: start laying at 18-20 weeks."
    },
    {
        "category": "dairy",
        "label": "Dairy Cattle/Buffalo",
        "breeds": [
            "Gir",
            "Sahiwal",
            "Murrah Buffalo",
            "HF Crossbred",
            "Red Sindhi",
            "Tharparkar",
            "Rathi",
            "Kankrej",
            "Ongole",
            "Hariana",
            "Deoni",
            "Nagori",
            "Malvi",
            "Krishna Valley",
            "Amritmahal",
            "Hallikar",
            "Khillari",
            "Nimari",
            "Vechur",
            "Punganur",
            "Dangi",
            "Kherigarh",
            "Siri",
            "Mewati",
            "Nili-Ravi Buffalo",
            "Surti Buffalo",
            "Mehsana Buffalo",
            "Jaffarabadi Buffalo",
            "Bhadawari Buffalo",
            "Nagpuri Buffalo",
            "Pandharpuri Buffalo",
            "Toda Buffalo",
            "Banni Buffalo",
            "Kangayam",
            "Bargur",
            "Umblachery",
            "Pulikulam",
            "Gaolao",
            "Kenkatha",
            "Ponwar",
            "Malnad Gidda",
            "Jersey (Crossbred Dairy)",
            "Ayrshire",
            "Brown Swiss",
            "Holstein Friesian (Purebred)",
            "Konkan Kapila",
            "Kosali",
            "Kherigarh Cow (distinct dwarf line)",
            "Motu",
            "Ladakhi Cattle"
        ],
        "vaccination_schedule": [
            {
                "age": "4 months",
                "vaccine": "Foot and Mouth Disease (FMD)",
                "route": "Intramuscular, repeat every 6 months"
            },
            {
                "age": "6 months",
                "vaccine": "Haemorrhagic Septicaemia (HS)",
                "route": "Annual, before monsoon"
            },
            {
                "age": "6 months",
                "vaccine": "Black Quarter (BQ)",
                "route": "Annual"
            },
            {
                "age": "8 months",
                "vaccine": "Brucellosis (females only, once)",
                "route": "Subcutaneous"
            }
        ],
        "feed": "Green fodder + dry fodder + concentrate mix (1kg concentrate per 2.5L milk yield)",
        "environment": "Well-ventilated shed, 4-5 sq.m per animal, clean water ad-lib",
        "yield_timeline": "First calving ~30 months, lactation ~305 days, dry period ~60 days"
    },
    {
        "category": "fisheries",
        "label": "Freshwater Fisheries",
        "breeds": [
            "Rohu",
            "Catla",
            "Mrigal",
            "Pangasius",
            "Tilapia",
            "Common Carp",
            "Grass Carp",
            "Silver Carp",
            "Magur (Walking Catfish)",
            "Singhi (Stinging Catfish)",
            "Pearl Spot (Karimeen)",
            "Hilsa",
            "Anabas (Climbing Perch)",
            "Freshwater Prawn (Scampi)",
            "Bhetki (Barramundi)",
            "Chital (Featherback)",
            "Murrel (Channa striata)",
            "Kalbasu",
            "Fringed-lipped Peninsula Carp (Labeo fimbriatus)",
            "Snakehead (Channa marulius)"
        ],
        "vaccination_schedule": [
            {
                "age": "N/A",
                "vaccine": "No standard vaccination — focus on water quality and biosecurity",
                "route": "N/A"
            }
        ],
        "feed": "Floating pellet feed, 3-5% of body weight/day, protein 25-35% depending on stage",
        "environment": "Pond depth 1.5-2m, dissolved oxygen >5mg/L, pH 6.5-8.5, stocking 5000-8000/acre",
        "yield_timeline": "Harvest in 8-10 months, average 2-3 tonnes/acre/year"
    },
    {
        "category": "apiculture",
        "label": "Apiculture (Beekeeping)",
        "breeds": [
            "Apis mellifera",
            "Apis cerana indica",
            "Apis dorsata (Rock Bee)",
            "Apis florea (Little Bee)",
            "Stingless Bee (Trigona)",
            "Bombus (Bumble Bee, hill apiculture)"
        ],
        "vaccination_schedule": [
            {
                "age": "N/A",
                "vaccine": "No vaccination — monitor for Varroa mites and disease signs",
                "route": "N/A"
            }
        ],
        "feed": "Sugar syrup (1:1) during dearth period, natural forage otherwise",
        "environment": "Away from pesticide spraying, flowering plants within 2-3km, shade for hives",
        "yield_timeline": "Honey harvest 2-3 times/year, 20-25kg/colony/year average"
    },
    {
        "category": "aquaculture_prawns",
        "label": "Prawn/Shrimp Farming",
        "breeds": [
            "Vannamei (Litopenaeus vannamei)",
            "Black Tiger Prawn (Penaeus monodon)",
            "Freshwater Giant Prawn (Macrobrachium rosenbergii)",
            "Indian White Prawn (Fenneropenaeus indicus)",
            "Banana Prawn (Fenneropenaeus merguiensis)"
        ],
        "vaccination_schedule": [
            {
                "age": "N/A",
                "vaccine": "No vaccination — biosecurity and water quality management critical",
                "route": "N/A"
            }
        ],
        "feed": "Formulated shrimp feed, 3-8% body weight/day, protein 32-38%",
        "environment": "Salinity 15-25 ppt, pH 7.5-8.5, aeration required, pond liner recommended",
        "yield_timeline": "Harvest in 90-120 days, 2 crops/year possible in favorable climate"
    },
    {
        "category": "small_ruminants",
        "label": "Goat/Sheep Herd",
        "breeds": [
            "Osmanabadi",
            "Boer",
            "Deccani (sheep)",
            "Nellore (sheep)",
            "Jamunapari",
            "Barbari",
            "Beetal",
            "Sirohi",
            "Black Bengal",
            "Malabari",
            "Ganjam",
            "Marwari Goat",
            "Kutchi",
            "Jakhrana",
            "Sangamneri",
            "Kanni Aadu",
            "Changthangi",
            "Nali",
            "Magra",
            "Chokla",
            "Patanwadi",
            "Bellary",
            "Mandya",
            "Coimbatore",
            "Madras Red",
            "Gaddi",
            "Bhakarwal",
            "Kashmir Merino",
            "Rampur Bushair",
            "Muzaffarnagari",
            "Attapady Black",
            "Zalawadi",
            "Chegu",
            "Berari",
            "Gohilwadi",
            "Chottanagpuri",
            "Shahabadi",
            "Balangir",
            "Tibetan (sheep)",
            "Karnah",
            "Teressa (Goat)",
            "Kilakarsal (Sheep)",
            "Vembur (Sheep)",
            "Kodi Adu",
            "Salem Black",
            "Ramnad White",
            "Tellicherry",
            "Sonadi (Sheep)"
        ],
        "vaccination_schedule": [
            {
                "age": "3 months",
                "vaccine": "Peste des Petits Ruminants (PPR)",
                "route": "Subcutaneous, annual"
            },
            {
                "age": "6 months",
                "vaccine": "Enterotoxaemia (ET)",
                "route": "Before monsoon, annual"
            },
            {
                "age": "6 months",
                "vaccine": "Foot and Mouth Disease (FMD)",
                "route": "Every 6 months"
            }
        ],
        "feed": "Grazing + concentrate supplement (200-300g/day for lactating does)",
        "environment": "Raised slatted-floor shed, 1-1.5 sq.m per adult, good ventilation",
        "yield_timeline": "Goats: kidding at 12-15 months, 2 kiddings in 3 years typical"
    },
    {
        "category": "swine",
        "label": "Pig Farming",
        "breeds": [
            "Large White Yorkshire",
            "Landrace",
            "Ghungroo",
            "Doom",
            "Niang Megha",
            "Tenyi Vo",
            "Duroc",
            "Berkshire",
            "Agonda Goan"
        ],
        "vaccination_schedule": [
            {
                "age": "6-8 weeks",
                "vaccine": "Classical Swine Fever (CSF)",
                "route": "Intramuscular, annual booster"
            },
            {
                "age": "8 weeks",
                "vaccine": "Foot and Mouth Disease (FMD)",
                "route": "Every 6 months"
            }
        ],
        "feed": "Starter ration (0-8 wks, 20% protein), grower-finisher ration thereafter, kitchen waste supplementation common in backyard systems",
        "environment": "Concrete-floor pen, 1.5-2 sq.m per adult, shade and wallow access in hot climates",
        "yield_timeline": "Market weight (80-100kg) reached in 6-8 months; sows farrow twice/year, 8-12 piglets/litter"
    },
    {
        "category": "rabbit",
        "label": "Rabbit Farming",
        "breeds": [
            "New Zealand White",
            "Soviet Chinchilla",
            "Grey Giant",
            "Angora",
            "Dutch",
            "Flemish Giant",
            "Californian White",
            "Chinchilla Giant"
        ],
        "vaccination_schedule": [
            {
                "age": "N/A",
                "vaccine": "No standard vaccination in India — focus on hygiene and deworming every 3 months",
                "route": "N/A"
            }
        ],
        "feed": "Pelleted rabbit feed + green fodder (lucerne, carrot tops), 100-150g/day for adults",
        "environment": "Raised wire-floor cages, well-ventilated shed, protection from direct heat and predators",
        "yield_timeline": "Breeding age 5-6 months, gestation 30-31 days, 5-8 kits/litter, market weight in 3 months"
    },
    {
        "category": "duck",
        "label": "Duck Farming",
        "breeds": [
            "Khaki Campbell",
            "Indian Runner",
            "Nageswari",
            "White Pekin",
            "Chara Chemballi",
            "Assam Local Duck"
        ],
        "vaccination_schedule": [
            {
                "age": "1 week",
                "vaccine": "Duck Plague (if endemic area)",
                "route": "Subcutaneous"
            },
            {
                "age": "4 weeks",
                "vaccine": "Duck Cholera",
                "route": "As per local advisory"
            }
        ],
        "feed": "Duck starter mash (0-8 wks), grower ration thereafter, supplemented by natural foraging in ponds/paddy fields",
        "environment": "Access to water body or paddy field, simple shelter for night housing, low input system",
        "yield_timeline": "Egg laying starts at 22-24 weeks, 250-300 eggs/year for layer breeds"
    },
    {
        "category": "quail",
        "label": "Japanese Quail Farming",
        "breeds": [
            "Japanese Quail (Coturnix coturnix japonica)",
            "Bobwhite Quail (Colinus virginianus)"
        ],
        "vaccination_schedule": [
            {
                "age": "N/A",
                "vaccine": "No standard vaccination — biosecurity and clean brooding critical",
                "route": "N/A"
            }
        ],
        "feed": "Quail starter mash (24% protein) first 3 weeks, layer ration after, ad-lib feeding",
        "environment": "Brooding temp 35-37°C reducing weekly, cage or deep-litter system, low space requirement",
        "yield_timeline": "Egg laying starts at 6-7 weeks, market-ready for meat at 5 weeks, ~250-300 eggs/year"
    },
    {
        "category": "camel",
        "label": "Camel Rearing",
        "breeds": [
            "Bikaneri",
            "Jaisalmeri (Camel)",
            "Kachchhi (Camel)",
            "Mewari (Camel)",
            "Marwari (Camel)",
            "Kharai (Camel)"
        ],
        "vaccination_schedule": [
            {
                "age": "6 months",
                "vaccine": "Camel Pox",
                "route": "Subcutaneous"
            },
            {
                "age": "Annual booster",
                "vaccine": "Trypanosomiasis prophylaxis (as advised by local vet)",
                "route": "Intramuscular"
            }
        ],
        "feed": "Grazing on desert scrub/thorny vegetation + concentrate supplement 1-2 kg/day for working camels",
        "environment": "Arid/semi-arid climate, tolerates extreme heat (up to 45°C), minimal shelter needed",
        "yield_timeline": "Working life 15-20 years. Milk yield (dairy-purpose): 3-5 L/day, lactation ~12-18 months."
    },
    {
        "category": "equine",
        "label": "Horse/Pony Rearing",
        "breeds": [
            "Marwari (Horse)",
            "Kathiawari",
            "Manipuri Pony",
            "Spiti Pony",
            "Zanskari Pony"
        ],
        "vaccination_schedule": [
            {
                "age": "6 months",
                "vaccine": "Equine Influenza",
                "route": "Intramuscular, annual booster"
            },
            {
                "age": "6 months",
                "vaccine": "Tetanus Toxoid",
                "route": "Intramuscular, annual booster"
            }
        ],
        "feed": "Grazing/hay + grain concentrate (oats, gram) 2-4 kg/day depending on work load",
        "environment": "Well-drained stable, dry bedding, moderate climate tolerance depending on breed origin",
        "yield_timeline": "Working/riding age from 3-4 years, working life 15-20 years."
    },
    {
        "category": "sericulture",
        "label": "Sericulture (Silk Moths)",
        "breeds": [
            "Bombyx mori (Mulberry Silkworm)",
            "Antheraea mylitta (Tasar Silkworm)",
            "Antheraea assamensis (Muga Silkworm)",
            "Samia ricini (Eri Silkworm)"
        ],
        "vaccination_schedule": [
            {
                "age": "N/A",
                "vaccine": "No vaccination — strict hygiene and disease-free layings (DFLs) critical",
                "route": "N/A"
            }
        ],
        "feed": "Mulberry leaves (Bombyx mori), or host-specific leaves (Terminalia/castor/Som depending on species)",
        "environment": "Rearing house 24-28°C, 65-85% humidity depending on instar stage, good ventilation",
        "yield_timeline": "Larval period 25-30 days, cocoon harvest thereafter, 4-6 crops/year possible."
    },
    {
        "category": "marine_fisheries",
        "label": "Marine Fisheries",
        "breeds": [
            "Indian Mackerel",
            "Indian Oil Sardine",
            "Silver Pomfret",
            "Seer Fish (Vanjaram)",
            "Yellowfin Tuna",
            "Bombay Duck (Bombil)",
            "Ribbonfish (Lepturacanthus savala)"
        ],
        "vaccination_schedule": [
            {
                "age": "N/A",
                "vaccine": "No vaccination — wild-caught/cage-cultured, focus on sustainable catch limits and cage biosecurity",
                "route": "N/A"
            }
        ],
        "feed": "Wild-caught: natural marine feeding. Cage-cultured: trash fish or formulated marine feed pellets, 3-5% body weight/day",
        "environment": "Coastal/offshore waters, salinity 30-35 ppt, cage culture depth 5-15m where applicable",
        "yield_timeline": "Wild catch: seasonal, varies by species and monsoon-linked breeding cycles. Cage culture: harvest in 8-12 months."
    }
]
# Flat per-animal list, derived from ANIMAL_CATEGORIES above.
# This is what app/services/livestock_service.py expects: one entry per
# breed, each carrying its category's reference data. Keeping ANIMAL_CATEGORIES
# (grouped) AND ANIMAL_ENCYCLOPEDIA (flat) both available so neither the
# pre-existing livestock encyclopedia service nor the newer category-view
# route/page need to change shape.
ANIMAL_ENCYCLOPEDIA = [
    {
        "name_en": breed,
        "category": cat["category"],
        "category_label": cat["label"],
        "vaccination_schedule": cat["vaccination_schedule"],
        "feed": cat["feed"],
        "environment": cat["environment"],
        "yield_timeline": cat["yield_timeline"],
    }
    for cat in ANIMAL_CATEGORIES
    for breed in cat["breeds"]
]
