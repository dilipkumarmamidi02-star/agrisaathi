"""
near_me_kvk.py

GET /api/near-me/kvk?pincode=XXXXXX

Resolves a farmer's pincode to a district using the already-registered
Data.gov.in resource #9 (All India Pincode Directory), then looks up a
Krishi Vigyan Kendra contact for that district from a local seed table.

IMPORTANT — data honesty:
None of the 72 registered Data.gov.in resources contain live KVK contact
details (name/phone/address). This route does NOT fabricate that data.
- If the district resolves but has no seed entry -> 404 "unavailable"
- If the pincode doesn't resolve at all -> 404 "unavailable"
The frontend NextSteps.jsx already falls back to linking kvk.icar.gov.in
when this returns 404, so an "unavailable" result is a normal, expected
outcome — not an error to hide.

Seed the KVK_DIRECTORY table yourself from the official ICAR KVK list
(https://kvk.icar.gov.in/) for whichever districts you want live-covered
for your demo. You do not need all ~700 districts — a handful covering
your demo scenarios (e.g. Hyderabad/Rangareddy, Telangana) is enough.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import os
import httpx

router = APIRouter(prefix="/api/near-me", tags=["near-me"])

DATA_GOV_API_KEY = os.environ.get("DATA_GOV_API_KEY")
PINCODE_RESOURCE_ID = "5c2f62fe-5afa-4119-a499-fec9d604d5bd"  # resource #9
DATA_GOV_BASE = "https://api.data.gov.in/resource"


class KvkResponse(BaseModel):
    name: str
    district: str
    state: str
    phone: Optional[str] = None
    address: Optional[str] = None
    source: str = "seed_directory"  # never claim this came from Data.gov.in


# --- Seed table -------------------------------------------------------
# Fill this in from https://kvk.icar.gov.in/ for the districts you're
# demoing. Keys are (state, district) normalized to upper-case/stripped.
# This is intentionally small and explicit — no invented entries.
KVK_DIRECTORY = {
    # Example — replace phone/address with actual verified ICAR listing
    # before using in the demo, or remove if you haven't verified it:
    ("TELANGANA", "RANGAREDDY"): {
        "name": "Krishi Vigyan Kendra, Rangareddy",
        "phone": None,      # fill in verified number, or leave None
        "address": None,    # fill in verified address, or leave None
    },
    ("TELANGANA", "HYDERABAD"): {
        "name": "Krishi Vigyan Kendra, Hyderabad",
        "phone": None,
        "address": None,
    },
}


async def _resolve_district(pincode: str) -> Optional[dict]:
    """Look up district/state for a pincode via resource #9."""
    if not DATA_GOV_API_KEY:
        raise HTTPException(status_code=500, detail="DATA_GOV_API_KEY not configured")

    params = {
        "api-key": DATA_GOV_API_KEY,
        "format": "json",
        "filters[pincode]": pincode,
        "limit": 1,
    }
    url = f"{DATA_GOV_BASE}/{PINCODE_RESOURCE_ID}"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)

    if resp.status_code != 200:
        # Real failure state — do not fabricate a district
        return None

    body = resp.json()
    records = body.get("records", [])
    if not records:
        return None

    rec = records[0]
    return {
        "district": (rec.get("districtname") or rec.get("District") or "").strip().upper(),
        "state": (rec.get("statename") or rec.get("StateName") or "").strip().upper(),
    }


@router.get("/kvk", response_model=KvkResponse)
async def get_nearest_kvk(pincode: str = Query(..., min_length=6, max_length=6)):
    location = await _resolve_district(pincode)
    if not location or not location["district"]:
        raise HTTPException(
            status_code=404,
            detail="Could not resolve district for this pincode.",
        )

    key = (location["state"], location["district"])
    entry = KVK_DIRECTORY.get(key)

    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"No KVK contact seeded for {location['district']}, {location['state']}.",
        )

    return KvkResponse(
        name=entry["name"],
        district=location["district"].title(),
        state=location["state"].title(),
        phone=entry.get("phone"),
        address=entry.get("address"),
    )
