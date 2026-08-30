"""
location.py

Local-CSV-backed pincode resolution and manual state/district/village
browsing, used by every page that needs location input. Replaces
per-request calls to the Data.gov.in pincode_directory resource
(data_gov.py's /location/pincode route), which is slow and sometimes
only covers a handful of states under load.

Source of truth: app/data/pincode_directory.csv (downloaded once,
refreshed occasionally — see app/services/pincode_lookup.py docstring).
"""

from fastapi import APIRouter, HTTPException, Query
from app.services.pincode_lookup import get_pincode_index

router = APIRouter(prefix="/api/location", tags=["location"])


@router.get("/pincode/{pincode}")
async def resolve_pincode(pincode: str):
    if not pincode.isdigit() or len(pincode) != 6:
        raise HTTPException(status_code=422, detail="Pincode must contain exactly 6 digits.")

    result = get_pincode_index().resolve(pincode)
    if not result:
        raise HTTPException(status_code=404, detail=f"No location data for pincode {pincode}.")

    return {**result, "source": "local_csv"}


@router.get("/states")
async def list_states():
    return {"states": get_pincode_index().get_states()}


@router.get("/districts")
async def list_districts(state: str = Query(..., min_length=1)):
    districts = get_pincode_index().get_districts(state)
    if not districts:
        raise HTTPException(status_code=404, detail=f"No districts found for state \"{state}\".")
    return {"state": state, "districts": districts}


@router.get("/villages")
async def list_villages(
    state: str = Query(..., min_length=1),
    district: str = Query(..., min_length=1),
):
    villages = get_pincode_index().get_villages(state, district)
    if not villages:
        raise HTTPException(
            status_code=404,
            detail=f"No villages found for \"{district}\", \"{state}\".",
        )
    return {"state": state, "district": district, "villages": villages}


@router.get("/health")
async def location_health():
    idx = get_pincode_index()
    return {"status": "ok", "pincodes_indexed": len(idx._index)}
