"""
location.py

Local-CSV-backed pincode resolution, used by every page that needs
state/district/mandal/village. Replaces per-request calls to the
Data.gov.in pincode_directory resource (data_gov.py's
/location/pincode route), which is slow and sometimes only covers a
handful of states under load.

Source of truth: app/data/pincode_directory.csv (downloaded once,
refreshed occasionally — see app/services/pincode_lookup.py docstring).
"""

from fastapi import APIRouter, HTTPException
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


@router.get("/health")
async def location_health():
    idx = get_pincode_index()
    return {"status": "ok", "pincodes_indexed": len(idx._index)}
