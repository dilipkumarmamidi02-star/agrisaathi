import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.access_control import get_verified_user
from app.models.user import User
from app.models.base44_entities import (
    StorageRequest,
    StorageOffer,
    Notification,
)
from app.services.geo_utils import nearest_first
from app.services.blockchain_ledger import log_event
from app.schemas.ledger import LedgerLogRequest

router = APIRouter(prefix="/api/storage", tags=["storage"])

VALID_FACILITY_TYPES = {
    "cold_storage_provider",
    "warehouse_provider",
}


class StorageRequestCreate(BaseModel):
    lot_id: str
    facility_type: str
    lot_lat: float
    lot_lng: float


class StorageOfferCreate(BaseModel):
    cost: float
    facility_id: str | None = None


@router.get("/requests")
def list_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    query = db.query(StorageRequest)

    if user.role == "admin":
        requests = query.all()
    else:
        requests = query.filter(
            StorageRequest.requested_by == user.id
        ).all()

    result = []

    for r in requests:
        offers = (
            db.query(StorageOffer)
            .filter(StorageOffer.request_id == r.id)
            .order_by(StorageOffer.created_at.desc())
            .all()
        )

        result.append(
            {
                "request_id": r.id,
                "lot_id": r.lot_id,
                "facility_type": r.facility_type,
                "lot_location": {
                    "lat": r.lot_lat,
                    "lng": r.lot_lng,
                },
                "status": r.status,
                "accepted_offer_id": r.accepted_offer_id,
                "offers": [
                    {
                        "offer_id": offer.id,
                        "provider_id": offer.provider_id,
                        "facility_id": offer.facility_id,
                        "cost": offer.cost,
                        "status": offer.status,
                        "created_at": offer.created_at.isoformat()
                        if offer.created_at
                        else None,
                    }
                    for offer in offers
                ],
            }
        )

    return result


@router.post("/requests")
def create_request(
    payload: StorageRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    if payload.facility_type not in VALID_FACILITY_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"facility_type must be one of {VALID_FACILITY_TYPES}",
        )

    req = StorageRequest(
        id=str(uuid.uuid4()),
        lot_id=payload.lot_id,
        requested_by=user.id,
        facility_type=payload.facility_type,
        lot_lat=payload.lot_lat,
        lot_lng=payload.lot_lng,
        status="open",
    )

    db.add(req)
    db.commit()

    log_event(
        LedgerLogRequest(
            entity_type="lot",
            entity_id=payload.lot_id,
            event_type=f"{payload.facility_type}_requested",
            payload={"request_id": req.id},
            actor=user.id,
        )
    )

    return {
        "request_id": req.id,
        "status": req.status,
    }


@router.get("/requests/feed")
def provider_feed(
    db: Session = Depends(get_db),
    provider: User = Depends(get_verified_user),
):
    if provider.supporter_type not in VALID_FACILITY_TYPES:
        raise HTTPException(
            status_code=403,
            detail="Cold storage / warehouse providers only",
        )

    open_reqs = (
        db.query(StorageRequest)
        .filter(
            StorageRequest.status == "open",
            StorageRequest.facility_type == provider.supporter_type,
        )
        .all()
    )

    ranked = nearest_first(
        provider.latitude,
        provider.longitude,
        open_reqs,
        "lot_lat",
        "lot_lng",
    )

    return [
        {
            "request_id": r.id,
            "lot_id": r.lot_id,
            "distance_km": km,
            "lot_location": {
                "lat": r.lot_lat,
                "lng": r.lot_lng,
            },
        }
        for r, km in ranked
    ]


@router.post("/requests/{request_id}/offers")
def submit_offer(
    request_id: str,
    payload: StorageOfferCreate,
    db: Session = Depends(get_db),
    provider: User = Depends(get_verified_user),
):
    if provider.supporter_type not in VALID_FACILITY_TYPES:
        raise HTTPException(
            status_code=403,
            detail="Cold storage / warehouse providers only",
        )

    req = (
        db.query(StorageRequest)
        .filter(StorageRequest.id == request_id)
        .first()
    )

    if not req:
        raise HTTPException(
            status_code=404,
            detail="Storage request not found",
        )

    if req.status != "open":
        raise HTTPException(
            status_code=400,
            detail="Storage request is not open",
        )

    if req.requested_by == provider.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot quote your own storage request",
        )

    if req.facility_type != provider.supporter_type:
        raise HTTPException(
            status_code=403,
            detail="Provider type does not match this request",
        )

    existing = (
        db.query(StorageOffer)
        .filter(
            StorageOffer.request_id == request_id,
            StorageOffer.provider_id == provider.id,
            StorageOffer.status == "pending",
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="You already have a pending quote for this request",
        )

    offer = StorageOffer(
        id=str(uuid.uuid4()),
        request_id=request_id,
        provider_id=provider.id,
        facility_id=payload.facility_id,
        cost=payload.cost,
    )

    db.add(offer)

    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=req.requested_by,
            type="storage_offer",
            title="New storage quote",
            message=f"₹{payload.cost} offered for your storage request.",
        )
    )

    db.commit()

    return {
        "storage_offer_id": offer.id,
    }


@router.post("/offers/{offer_id}/accept")
def accept_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    st_offer = (
        db.query(StorageOffer)
        .filter(StorageOffer.id == offer_id)
        .first()
    )

    if not st_offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found",
        )

    req = (
        db.query(StorageRequest)
        .filter(StorageRequest.id == st_offer.request_id)
        .first()
    )

    if not req or req.requested_by != user.id:
        raise HTTPException(
            status_code=403,
            detail="Not your request",
        )

    if req.status != "open":
        raise HTTPException(
            status_code=400,
            detail="Request is no longer open",
        )

    st_offer.status = "accepted"
    req.status = "accepted"
    req.accepted_offer_id = st_offer.id

    db.query(StorageOffer).filter(
        StorageOffer.request_id == req.id,
        StorageOffer.id != offer_id,
    ).update(
        {"status": "rejected"},
        synchronize_session=False,
    )

    db.commit()

    log_event(
        LedgerLogRequest(
            entity_type="lot",
            entity_id=req.lot_id,
            event_type=f"{req.facility_type}_accepted",
            payload={
                "request_id": req.id,
                "provider_id": st_offer.provider_id,
            },
            actor=user.id,
        )
    )

    return {
        "status": "accepted",
    }
