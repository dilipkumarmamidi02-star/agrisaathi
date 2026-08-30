from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.firebase_auth import get_current_user
from app.api.routes import (
    data_gov, location, users, crop, fertilizer, diagnosis, health,
    weather, helper, ledger, animal_encyclopedia, livestock, crop_planner,
    crop_passport, livestock_encyclopedia, soil_profiles, kvk, gov_markets,
    mandi_prices, pest_library, livestock_details, sensor, translate,
    price_alerts, scheme, livestock_types, soil_records,
)

app = FastAPI(
    title="AgriSaathi API",
    description="AI-powered Agriculture Assistant",
    version="1.0.0"
)

origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public — no auth. Health check must stay reachable for uptime monitors.
app.include_router(health.router)

# users.router already enforces auth per-route (see app/api/routes/users.py),
# so it's not wrapped again here to avoid running the check twice.
app.include_router(users.router)

# Everything else requires a valid Firebase ID token.
_auth_dep = [Depends(get_current_user)]

app.include_router(crop.router, dependencies=_auth_dep)
app.include_router(fertilizer.router, dependencies=_auth_dep)
app.include_router(diagnosis.router, dependencies=_auth_dep)
app.include_router(livestock_encyclopedia.router, dependencies=_auth_dep)
app.include_router(mandi_prices.router, dependencies=_auth_dep)
app.include_router(pest_library.router, dependencies=_auth_dep)
app.include_router(livestock_details.router, dependencies=_auth_dep)
app.include_router(sensor.router, dependencies=_auth_dep)
app.include_router(soil_records.router, dependencies=_auth_dep)
app.include_router(gov_markets.router, dependencies=_auth_dep)
app.include_router(kvk.router, dependencies=_auth_dep)
app.include_router(soil_profiles.router, dependencies=_auth_dep)
app.include_router(weather.router, dependencies=_auth_dep)
app.include_router(helper.router, dependencies=_auth_dep)
app.include_router(ledger.router, dependencies=_auth_dep)
app.include_router(animal_encyclopedia.router, dependencies=_auth_dep)
app.include_router(livestock.router, dependencies=_auth_dep)
app.include_router(crop_planner.router, dependencies=_auth_dep)
app.include_router(crop_passport.router, dependencies=_auth_dep)
app.include_router(translate.router, dependencies=_auth_dep)
app.include_router(price_alerts.router, dependencies=_auth_dep)
app.include_router(scheme.router, dependencies=_auth_dep)
app.include_router(livestock_types.router, dependencies=_auth_dep)
# data_gov: public government open-data (Data.gov.in). No auth required —
# this is public information, same policy as health.router above.
app.include_router(data_gov.router)
# location: pincode/state/district/village lookup. Public — no auth
# required. Register.jsx and other pre-login flows need this to
# resolve a farmer's location before an account exists.
app.include_router(location.router)


@app.get("/")
def root():
    return {"service": "AgriSaathi API", "version": "1.0.0", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
