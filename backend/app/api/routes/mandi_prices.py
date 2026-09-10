from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.core.access_control import get_verified_user
from app.models.user import User
from app.services.mandi_service import get_mandi_prices

router = APIRouter(prefix="/api/mandi-prices", tags=["mandi-prices"])


@router.get("")
async def mandi_prices(
    state: Optional[str] = Query(None),
    commodity: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    user: User = Depends(get_verified_user),
):
    try:
        return await get_mandi_prices(state=state, commodity=commodity, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Mandi price fetch failed: {e}")
