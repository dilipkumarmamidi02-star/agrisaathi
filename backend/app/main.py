from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.firebase_auth import get_current_user
from app.api.routes.email_otp import router as email_otp_router
from app.api.routes.grievances import router as grievances_router
from app.api.routes.quality_reports import router as quality_reports_router
from app.api.routes.lot_verification import router as lot_verification_router
from app.api.routes import (
    data_gov, location, users, crop, fertilizer, diagnosis, health,
    weather, helper, ledger, animal_encyclopedia, livestock, crop_planner,
    crop_passport, livestock_encyclopedia, soil_profiles, kvk, gov_markets,
    mandi_prices, pest_library, livestock_details, sensor, translate,
    price_alerts, scheme, livestock_types, soil_records, lots,
    base44_entities_router,
)

app = FastAPI(
    title="AgriSaathi API",
    description="AI-powered Agriculture Assistant",
    version="1.0.0"
)

# Ensure all tables exist. On Vercel the SQLite file is created fresh
# in /tmp on every cold start, so tables must be created at startup
# rather than relying on a one-time migration step.
from app.core.database import Base, engine  # noqa: E402
from app.models.lot import Lot  # noqa: E402,F401
from app.models.user import User  # noqa: E402,F401
from app.models.crop import Crop  # noqa: E402,F401
from app.models.farm import Farm, CropBatch  # noqa: E402,F401
from app.models.email_otp import EmailOTP  # noqa: E402,F401
from app.models.base44_entities import (  # noqa: E402,F401
    QualityReport, QualitySession, QualitySample, Grievance,
    Notification, Offer, Order, PriceAlert, StorageFacility,
    LogisticsTrip, AuditLog,
)

Base.metadata.create_all(bind=engine)


# ============================================================
# 🌾 AGRISAATHI CORS
# ============================================================

def _build_allowed_origins():
    configured = getattr(settings, "allowed_origins", "") or ""

    origins = [
        origin.strip().rstrip("/")
        for origin in configured.split(",")
        if origin.strip()
    ]

    required = [
        "https://agrisaathi-ashy.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    for origin in required:
        if origin not in origins:
            origins.append(origin)

    return origins


ALLOWED_CORS_ORIGINS = _build_allowed_origins()

print("============================================================")
print("🌾 AgriSaathi CORS")
print("============================================================")

for origin in ALLOWED_CORS_ORIGINS:
    print(f"  ✓ {origin}")

print("============================================================")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AGRISAATHI CORS
# ============================================================
#
# Production frontend:
#   https://agrisaathi-ashy.vercel.app
#
# Local development:
#   http://localhost:5173
#   http://127.0.0.1:5173
#
# Do NOT use allow_origins=["*"] because the application
# uses authenticated requests / Authorization headers.
# ============================================================

def _build_allowed_origins():
    configured = getattr(settings, "allowed_origins", "") or ""

    origins = [
        origin.strip().rstrip("/")
        for origin in configured.split(",")
        if origin.strip()
    ]

    required_origins = [
        "https://agrisaathi-ashy.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    for origin in required_origins:
        if origin not in origins:
            origins.append(origin)

    return origins


ALLOWED_CORS_ORIGINS = _build_allowed_origins()

print("============================================================")
print("🌾 AgriSaathi CORS")
print("============================================================")

for origin in ALLOWED_CORS_ORIGINS:
    print(f"  ✓ {origin}")

print("============================================================")
origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]


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
app.include_router(lots.router, dependencies=_auth_dep)
app.include_router(base44_entities_router.router, dependencies=_auth_dep)
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
app.include_router(email_otp_router)
# Public QR verification endpoint.
# Buyers can scan a lot QR and inspect its persisted verification data.
# Operational actions such as offers/pickup remain protected by their own auth.

app.include_router(
    quality_reports_router,
    dependencies=_auth_dep,
)
app.include_router(grievances_router)


@app.get("/")
def root():
    return {"service": "AgriSaathi API", "version": "1.0.0", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

# ============================================================
# AGRISAATHI PUBLIC LOT QR VERIFICATION
# ============================================================
#
# QR verification is intentionally public.
#
# The physical QR code must work for buyers without requiring
# Firebase authentication.
#
# All operational APIs such as offers, pickup, logistics,
# storage, payments and other protected actions remain behind
# their normal authentication dependencies.
#
# The QR router itself exists in:
#     app.api.routes.lot_verification
#
# We attach the router handlers directly here as a final safety
# measure because the application must expose these two public
# endpoints reliably in every deployment environment.
# ============================================================

try:
    _qr_routes = {
        getattr(_route, "path", ""): _route
        for _route in lot_verification_router.routes
    }

    _qr_by_lot_route = _qr_routes.get(
        "/api/lot-verification/by-lot/{lot_id}"
    )

    _qr_verify_route = _qr_routes.get(
        "/api/lot-verification/{qr_token}"
    )

    if _qr_by_lot_route is not None:
        app.add_api_route(
            "/api/lot-verification/by-lot/{lot_id}",
            _qr_by_lot_route.endpoint,
            methods=["GET"],
            response_model=_qr_by_lot_route.response_model,
            tags=["lot-verification"],
            include_in_schema=True,
        )

    if _qr_verify_route is not None:
        app.add_api_route(
            "/api/lot-verification/{qr_token}",
            _qr_verify_route.endpoint,
            methods=["GET"],
            response_model=_qr_verify_route.response_model,
            tags=["lot-verification"],
            include_in_schema=True,
        )

except Exception as _qr_registration_error:
    print(
        "⚠️ QR direct registration warning:",
        repr(_qr_registration_error),
    )

