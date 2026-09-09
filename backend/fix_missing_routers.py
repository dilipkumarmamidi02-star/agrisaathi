path = "app/api/routes/lots.py"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = "from app.core.auth import get_current_user"
new = "from app.core.firebase_auth import get_current_user"
if old in content:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("lots.py: fixed broken import (app.core.auth -> app.core.firebase_auth)")
else:
    print("lots.py: import already correct or not found, skipped")

path = "app/main.py"
with open(path, encoding="utf-8") as f:
    content = f.read()

old_import = """from app.api.routes import (
    data_gov, location, users, crop, fertilizer, diagnosis, health,
    weather, helper, ledger, animal_encyclopedia, livestock, crop_planner,
    crop_passport, livestock_encyclopedia, soil_profiles, kvk, gov_markets,
    mandi_prices, pest_library, livestock_details, sensor, translate,
    price_alerts, scheme, livestock_types, soil_records,
)"""
new_import = """from app.api.routes import (
    data_gov, location, users, crop, fertilizer, diagnosis, health,
    weather, helper, ledger, animal_encyclopedia, livestock, crop_planner,
    crop_passport, livestock_encyclopedia, soil_profiles, kvk, gov_markets,
    mandi_prices, pest_library, livestock_details, sensor, translate,
    price_alerts, scheme, livestock_types, soil_records, lots,
    base44_entities_router,
)"""
if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print("main.py: imports updated (lots, base44_entities_router)")
else:
    print("main.py: import anchor not found, skipped")

old_anchor = "app.include_router(soil_records.router, dependencies=_auth_dep)"
new_anchor = (
    "app.include_router(soil_records.router, dependencies=_auth_dep)\n"
    "app.include_router(lots.router, dependencies=_auth_dep)\n"
    "app.include_router(base44_entities_router.router, dependencies=_auth_dep)"
)
if old_anchor in content:
    content = content.replace(old_anchor, new_anchor, 1)
    print("main.py: lots.router and base44_entities_router.router registered")
else:
    print("main.py: include_router anchor not found, skipped")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
