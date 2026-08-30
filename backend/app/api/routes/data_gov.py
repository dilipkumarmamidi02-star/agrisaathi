from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.datagov_registry import RESOURCE_BY_KEY as DATAGOV_RESOURCES
from app.services.datagov_client import fetch_resource

router = APIRouter(
    prefix="/api/data-gov",
    tags=["data-gov"],
)


@router.get("/resources")
async def list_resources():
    resources = []

    for key, meta in DATAGOV_RESOURCES.items():
        resources.append(
            {
                "resource_key": key,
                "resource_id": meta["resource_id"],
                "title": meta["resource_name"],
                "primary_feature": meta.get("primary_feature"),
                "secondary_features": meta.get("secondary_features", []),
                "temporal_status": meta.get("temporal_status", "UNKNOWN"),
            }
        )

    return {
        "count": len(resources),
        "resources": resources,
    }


@router.get("/resources/data")
async def get_resource(
    resource: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None),
    variety: Optional[str] = Query(None),
    grade: Optional[str] = Query(None),
):
    """
    Generic Data.gov resource endpoint.

    IMPORTANT:
    The public API route is:
        /api/data-gov/resources/data?resource=<resource_key>

    Supported agricultural location/market filters:
        state
        district
        market
        commodity
        variety
        grade
    """

    if resource not in DATAGOV_RESOURCES:
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Requested Data.gov resource is not registered",
                "resource_key": resource,
            },
        )

    filters = {}

    if state:
        filters["state.keyword"] = state.strip()

    if district:
        filters["district"] = district.strip()

    if market:
        filters["market"] = market.strip()

    if commodity:
        filters["commodity"] = commodity.strip()

    if variety:
        filters["variety"] = variety.strip()

    if grade:
        filters["grade"] = grade.strip()

    try:
        result = await fetch_resource(
            resource_key=resource,
            filters=filters,
            limit=limit,
            offset=offset,
        )

        return {
            "resource_key": resource,
            "resource_id": DATAGOV_RESOURCES[resource]["resource_id"],
            "filters": filters,
            **result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Data.gov resource request failed",
                "resource_key": resource,
                "error": str(exc),
            },
        )


@router.get("/location/pincode")
async def get_location_by_pincode(
    pincode: str = Query(..., min_length=6, max_length=6),
):
    """
    Resolve an Indian pincode using the authoritative
    Data.gov.in pincode_directory resource.

    This endpoint is intentionally separate from market filtering.
    It is used to establish location context:
        pincode -> state -> district -> village/post office
    """

    target = pincode.strip()

    if not target.isdigit() or len(target) != 6:
        raise HTTPException(
            status_code=422,
            detail="Pincode must contain exactly 6 digits.",
        )

    try:
        result = await fetch_resource(
            resource_key="pincode_directory",
            filters={},
            limit=100,
            offset=0,
        )

        records = result.get("records", [])

        def normalise(value):
            return str(value or "").strip().lower()

        def matches_pincode(record):
            for key, value in record.items():
                key_name = normalise(key)

                if (
                    "pincode" in key_name
                    or key_name == "pin"
                    or "pin_code" in key_name
                    or "postal" in key_name
                ):
                    if normalise(value) == target:
                        return True

            return False

        matches = [
            record
            for record in records
            if matches_pincode(record)
        ]

        return {
            "resource_key": "pincode_directory",
            "resource_id": DATAGOV_RESOURCES["pincode_directory"]["resource_id"],
            "pincode": target,
            "count": len(matches),
            "records": matches[:100],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Pincode directory lookup failed",
                "pincode": target,
                "error": str(exc),
            },
        )


@router.get("/health")
async def data_gov_health():
    from app.core.config import settings

    return {
        "configured": bool(settings.data_gov_api_key),
        "registered_resources": len(DATAGOV_RESOURCES),
    }
