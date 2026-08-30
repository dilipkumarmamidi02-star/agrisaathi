import asyncio
import httpx
from app.core.config import settings
from app.core.datagov_registry import RESOURCE_BY_KEY as DATAGOV_RESOURCES

BASE_URL = "https://api.data.gov.in/resource"

DEFAULT_HEADERS = {
    "User-Agent": "AgriSaathi/1.0",
    "Accept": "application/json",
}

RETRY_STATUS_CODES = {429, 500, 502, 503, 504}


async def fetch_resource(
    resource_key: str,
    filters: dict | None = None,
    limit: int = 50,
    offset: int = 0,
):
    if resource_key not in DATAGOV_RESOURCES:
        raise ValueError(f"Unknown data.gov.in resource key: {resource_key}")

    if not settings.data_gov_api_key:
        raise RuntimeError("DATA_GOV_API_KEY is not configured on the backend")

    meta = DATAGOV_RESOURCES[resource_key]

    params = {
        "api-key": settings.data_gov_api_key,
        "format": "json",
        "limit": min(max(limit, 1), 100),
        "offset": max(offset, 0),
    }

    # Different Data.gov.in resources use different raw field names
    # for the same logical concept (e.g. soil_moisture uses "State" /
    # "District", mandi_prices uses "state.keyword" / "district").
    # Sending the wrong field name silently returns unfiltered or
    # empty results rather than erroring, so this must be per-resource,
    # not a single hardcoded set.
    #
    # Generic filter key (from the API route) -> actual Data.gov.in
    # field name for this specific resource. Falls back to the
    # mandi-style field names for any resource not listed here.
    DEFAULT_FIELD_MAP = {
        "state.keyword": "state.keyword",
        "district": "district",
        "market": "market",
        "commodity": "commodity",
        "variety": "variety",
        "grade": "grade",
        "pincode": "pincode",
    }

    RESOURCE_FIELD_MAP_OVERRIDES = {
        "soil_moisture": {
            "state.keyword": "State",
            "district": "District",
        },
        "variety_market_prices": {
            "state.keyword": "State",
            "district": "District",
        },
        "kcc_farmer_queries": {
            "state.keyword": "StateName",
        },
    }

    field_map = {
        **DEFAULT_FIELD_MAP,
        **RESOURCE_FIELD_MAP_OVERRIDES.get(resource_key, {}),
    }

    if filters:
        for field, value in filters.items():
            if value is None:
                continue

            value = str(value).strip()

            if not value:
                continue

            actual_field = field_map.get(field)

            if actual_field:
                params[f"filters[{actual_field}]"] = value

    url = f"{BASE_URL}/{meta['resource_id']}"

    last_error = None

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=10.0),
        headers=DEFAULT_HEADERS,
        follow_redirects=True,
    ) as client:
        for attempt in range(4):
            try:
                response = await client.get(url, params=params)

                if response.status_code in RETRY_STATUS_CODES:
                    last_error = f"HTTP {response.status_code}"
                    if attempt < 3:
                        await asyncio.sleep(2 ** attempt)
                        continue

                response.raise_for_status()

                data = response.json()

                return {
                    "resource_key": resource_key,
                    "resource_id": meta["resource_id"],
                    "title": meta["resource_name"],
                    "primary_feature": meta.get("primary_feature"),
                    "secondary_features": meta.get("secondary_features", []),
                    "temporal_status": meta.get("temporal_status", "UNKNOWN"),
                    "total": data.get("total"),
                    "count": data.get("count"),
                    "records": data.get("records", []),
                }

            except (httpx.HTTPError, ValueError) as exc:
                last_error = str(exc)
                if attempt < 3:
                    await asyncio.sleep(2 ** attempt)
                    continue

    raise RuntimeError(
        f"data.gov.in request failed for {resource_key}: {last_error}"
    )
