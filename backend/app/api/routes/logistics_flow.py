import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.access_control import get_verified_user
from app.models.user import User
from app.models.base44_entities import (
    LogisticsRequest,
    LogisticsOffer,
    LogisticsTrip,
    Notification,
)
from app.services.geo_utils import nearest_first
from app.services.blockchain_ledger import log_event
from app.schemas.ledger import LedgerLogRequest

router = APIRouter(prefix="/api/logistics", tags=["logistics"])


class LogisticsRequestCreate(BaseModel):
    lot_id: str
    offer_id: str | None = None
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float


class LogisticsOfferCreate(BaseModel):
    cost: float


@router.get("/requests")
def list_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    query = db.query(LogisticsRequest)

    if user.role == "admin":
        requests = query.all()
    else:
        requests = query.filter(
            LogisticsRequest.requested_by == user.id
        ).all()

    result = []

    for r in requests:
        offers = (
            db.query(LogisticsOffer)
            .filter(LogisticsOffer.request_id == r.id)
            .order_by(LogisticsOffer.created_at.desc())
            .all()
        )

        result.append(
            {
                "request_id": r.id,
                "lot_id": r.lot_id,
                "offer_id": r.offer_id,
                "requested_by": r.requested_by,
                "pickup": {
                    "lat": r.pickup_lat,
                    "lng": r.pickup_lng,
                },
                "dropoff": {
                    "lat": r.dropoff_lat,
                    "lng": r.dropoff_lng,
                },
                "status": r.status,
                "accepted_offer_id": r.accepted_offer_id,
                "offers": [
                    {
                        "offer_id": offer.id,
                        "provider_id": offer.provider_id,
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
    payload: LogisticsRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    req = LogisticsRequest(
        id=str(uuid.uuid4()),
        lot_id=payload.lot_id,
        offer_id=payload.offer_id,
        requested_by=user.id,
        pickup_lat=payload.pickup_lat,
        pickup_lng=payload.pickup_lng,
        dropoff_lat=payload.dropoff_lat,
        dropoff_lng=payload.dropoff_lng,
        status="open",
    )

    db.add(req)
    db.commit()

    log_event(
        LedgerLogRequest(
            entity_type="lot",
            entity_id=payload.lot_id,
            event_type="logistics_requested",
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
    if provider.supporter_type != "logistics_provider":
        raise HTTPException(
            status_code=403,
            detail="Logistics providers only",
        )

    open_reqs = (
        db.query(LogisticsRequest)
        .filter(LogisticsRequest.status == "open")
        .all()
    )

    ranked = nearest_first(
        provider.latitude,
        provider.longitude,
        open_reqs,
        "pickup_lat",
        "pickup_lng",
    )

    return [
        {
            "request_id": r.id,
            "lot_id": r.lot_id,
            "distance_km": km,
            "pickup": {
                "lat": r.pickup_lat,
                "lng": r.pickup_lng,
            },
            "dropoff": {
                "lat": r.dropoff_lat,
                "lng": r.dropoff_lng,
            },
        }
        for r, km in ranked
    ]


@router.post("/requests/{request_id}/offers")
def submit_offer(
    request_id: str,
    payload: LogisticsOfferCreate,
    db: Session = Depends(get_db),
    provider: User = Depends(get_verified_user),
):
    if provider.supporter_type != "logistics_provider":
        raise HTTPException(
            status_code=403,
            detail="Logistics providers only",
        )

    req = (
        db.query(LogisticsRequest)
        .filter(LogisticsRequest.id == request_id)
        .first()
    )

    if not req:
        raise HTTPException(
            status_code=404,
            detail="Logistics request not found",
        )

    if req.status != "open":
        raise HTTPException(
            status_code=400,
            detail="Logistics request is not open",
        )

    if req.requested_by == provider.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot quote your own logistics request",
        )

    existing = (
        db.query(LogisticsOffer)
        .filter(
            LogisticsOffer.request_id == request_id,
            LogisticsOffer.provider_id == provider.id,
            LogisticsOffer.status == "pending",
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="You already have a pending quote for this request",
        )

    offer = LogisticsOffer(
        id=str(uuid.uuid4()),
        request_id=request_id,
        provider_id=provider.id,
        cost=payload.cost,
    )

    db.add(offer)

    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=req.requested_by,
            type="logistics_offer",
            title="New logistics quote",
            message=f"₹{payload.cost} offered for your pickup request.",
        )
    )

    db.commit()

    return {
        "logistics_offer_id": offer.id,
    }


@router.post("/offers/{offer_id}/accept")
def accept_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    logi_offer = (
        db.query(LogisticsOffer)
        .filter(LogisticsOffer.id == offer_id)
        .first()
    )

    if not logi_offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found",
        )

    req = (
        db.query(LogisticsRequest)
        .filter(LogisticsRequest.id == logi_offer.request_id)
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

    # req.offer_id is a marketplace Offer ID.
    # LogisticsTrip.order_id must contain the actual confirmed Order ID.
    if not req.offer_id:
        raise HTTPException(
            status_code=409,
            detail="This logistics request is not linked to a marketplace offer.",
        )

    # Import the marketplace entities locally to avoid changing the
    # existing module import structure unnecessarily.
    from app.models.base44_entities import Offer, Order

    marketplace_offer = (
        db.query(Offer)
        .filter(Offer.id == req.offer_id)
        .first()
    )

    if not marketplace_offer:
        raise HTTPException(
            status_code=409,
            detail="The marketplace offer linked to this logistics request was not found.",
        )

    if marketplace_offer.status != "accepted":
        raise HTTPException(
            status_code=409,
            detail="The linked marketplace offer is not accepted.",
        )

    # Find the real confirmed order generated from the accepted offer.
    order = (
        db.query(Order)
        .filter(
            Order.lot_id == marketplace_offer.lot_id,
            Order.buyer_id == marketplace_offer.buyer_id,
            Order.farmer_id == marketplace_offer.farmer_id,
            Order.status == "confirmed",
        )
        .order_by(Order.created_at.desc())
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=409,
            detail="A confirmed order could not be found for this logistics request.",
        )

    # Accept this provider's quote and reject competing quotes.
    logi_offer.status = "accepted"
    req.status = "accepted"
    req.accepted_offer_id = logi_offer.id

    db.query(LogisticsOffer).filter(
        LogisticsOffer.request_id == req.id,
        LogisticsOffer.id != offer_id,
    ).update(
        {"status": "rejected"},
        synchronize_session=False,
    )

    # Create the logistics trip against the REAL Order.
    trip = LogisticsTrip(
        id=str(uuid.uuid4()),
        trip_id=str(uuid.uuid4())[:8],
        order_id=order.id,
        farmer_id=order.farmer_id,
        provider_id=logi_offer.provider_id,
        commodity=order.commodity,
        quantity=order.quantity,
        status="assigned",
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    log_event(
        LedgerLogRequest(
            entity_type="lot",
            entity_id=req.lot_id,
            event_type="logistics_accepted",
            payload={
                "request_id": req.id,
                "offer_id": req.offer_id,
                "order_id": order.id,
                "provider_id": logi_offer.provider_id,
                "trip_id": trip.id,
            },
            actor=user.id,
        )
    )

    return {
        "status": "accepted",
        "trip_id": trip.id,
        "order_id": order.id,
    }
