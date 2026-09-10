"""
AgriSaathi real marketplace offer flow.

POST /api/offers
GET  /api/offers/{offer_id}/qr-detail
POST /api/offers/{offer_id}/respond

Only verified buyer/trader/institutional-buyer supporters can create offers.
Farmers can view/respond to their own offers.
"""

import hashlib
import json
import smtplib
import uuid
from email.message import EmailMessage
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.core.access_control import get_verified_user
from app.core.config import settings
from app.models.base44_entities import Offer, Notification, Order
from app.models.lot import Lot
from app.models.user import User, UserRole

router = APIRouter(
    prefix="/api/offers",
    tags=["Marketplace Offers"],
)


BUYER_TYPES = {
    "buyer",
    "trader",
    "institutional_buyer",
}


class OfferCreate(BaseModel):
    lot_id: str
    price: float
    quantity: Optional[float] = None
    wants_own_logistics: bool = False


class OfferResponse(BaseModel):
    decision: str


def _distance_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None

    from math import radians, sin, cos, asin, sqrt

    r = 6371.0088

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(dlon / 2) ** 2
    )

    return round(2 * r * asin(sqrt(a)), 2)


def _notify_farmer(farmer: User, buyer: User, lot: Lot, offer: Offer, db: Session):
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=farmer.uid,
        type="new_offer",
        title="New offer received",
        message=(
            f"{buyer.full_name or buyer.email or 'A buyer'} "
            f"offered ₹{offer.price_per_unit:,.2f}/quintal "
            f"for your lot {lot.lot_id or lot.id}."
        ),
        is_read=False,
    )

    db.add(notification)

    # Email is best-effort. The offer itself must NOT fail just because SMTP
    # is unavailable.
    if not farmer.email:
        return

    try:
        smtp_host = getattr(settings, "smtp_host", "")
        smtp_port = getattr(settings, "smtp_port", 587)
        smtp_user = getattr(settings, "smtp_username", "")
        smtp_password = getattr(settings, "smtp_password", "")
        smtp_from = (
            getattr(settings, "smtp_from_email", "")
            or smtp_user
        )
        smtp_name = getattr(
            settings,
            "smtp_from_name",
            "AgriSaathi",
        )

        if not smtp_host:
            return

        message = EmailMessage()
        message["Subject"] = f"AgriSaathi — New offer for {lot.lot_id or lot.id}"
        message["From"] = f"{smtp_name} <{smtp_from}>"
        message["To"] = farmer.email

        message.set_content(
            f"""Hello {farmer.full_name or 'Farmer'},

You received a new offer on AgriSaathi.

Lot: {lot.lot_id or lot.id}
Crop: {lot.crop}
Variety: {lot.variety or '—'}

Offer price: ₹{offer.price_per_unit:,.2f}/quintal
Quantity: {offer.quantity or lot.quantity_quintal or '—'} quintal

Buyer:
Name: {buyer.full_name or '—'}
Phone: {buyer.phone or '—'}
Email: {buyer.email or '—'}

Open AgriSaathi to review the offer, buyer details,
distance and logistics options.

AgriSaathi
"""
        )

        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            server.starttls()
            if smtp_user:
                server.login(smtp_user, smtp_password)
            server.send_message(message)

    except Exception as exc:
        print(f"Offer email warning: {exc}")


@router.post("")
async def create_offer(
    payload: OfferCreate,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.SUPPORTER:
        raise HTTPException(
            status_code=403,
            detail="Only verified buyer/trader supporters can make marketplace offers.",
        )

    if current_user.supporter_type not in BUYER_TYPES:
        raise HTTPException(
            status_code=403,
            detail="Your supporter account is not authorised to make marketplace offers.",
        )

    if payload.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Offer price must be greater than zero.",
        )

    lot = (
        db.query(Lot)
        .filter(Lot.id == payload.lot_id)
        .first()
    )

    if not lot:
        raise HTTPException(
            status_code=404,
            detail="Lot not found.",
        )

    if lot.status != "active":
        raise HTTPException(
            status_code=409,
            detail="This lot is not currently available for offers.",
        )

    farmer = (
        db.query(User)
        .filter(User.uid == lot.farmer_id)
        .first()
    )

    if not farmer:
        raise HTTPException(
            status_code=404,
            detail="Farmer account could not be found for this lot.",
        )

    if farmer.uid == current_user.uid:
        raise HTTPException(
            status_code=400,
            detail="You cannot make an offer on your own lot.",
        )

    quantity = payload.quantity or lot.quantity_quintal or 0
    total = float(payload.price) * float(quantity)

    offer = Offer(
        id=str(uuid.uuid4()),
        lot_id=lot.id,
        buyer_id=current_user.uid,
        farmer_id=farmer.uid,
        quantity=quantity,
        price_per_unit=float(payload.price),
        total_price=total,
        status="pending",
        created_at=None,
    )

    db.add(offer)

    _notify_farmer(
        farmer,
        current_user,
        lot,
        offer,
        db,
    )

    # Keep the existing append-only ledger integration.
    try:
        from app.blockchain_ledger import BlockchainLedger

        BlockchainLedger().add_block(
            {
                "event": "offer_created",
                "lot_id": lot.id,
                "offer_id": offer.id,
                "buyer_id": current_user.uid,
                "farmer_id": farmer.uid,
                "price": offer.price_per_unit,
            }
        )
    except Exception as exc:
        print(f"Offer ledger warning: {exc}")

    db.commit()
    db.refresh(offer)

    return {
        "success": True,
        "offer_id": offer.id,
        "status": offer.status,
        "lot_id": lot.id,
        "farmer": {
            "name": farmer.full_name,
            "phone": farmer.phone,
            "email": farmer.email,
        },
    }




@router.get("/farmer")
async def list_farmer_offers(
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    """
    Return real marketplace offers received by the
    authenticated farmer.

    Source of truth:
        offers.farmer_id == current_user.uid
    """

    if current_user.role != UserRole.FARMER:
        raise HTTPException(
            status_code=403,
            detail="Only farmers can access received marketplace offers.",
        )

    offers = (
        db.query(Offer)
        .filter(Offer.farmer_id == current_user.uid)
        .order_by(Offer.created_at.desc())
        .all()
    )

    result = []

    for offer in offers:
        lot = (
            db.query(Lot)
            .filter(Lot.id == offer.lot_id)
            .first()
        )

        buyer = (
            db.query(User)
            .filter(User.uid == offer.buyer_id)
            .first()
        )

        result.append({
            "id": offer.id,
            "offer_id": offer.id,
            "lot_id": offer.lot_id,
            "status": offer.status,
            "price_per_unit": offer.price_per_unit,
            "quantity": offer.quantity,
            "quantity_unit": offer.quantity_unit,
            "total_price": offer.total_price,
            "created_at": offer.created_at,
            "updated_at": offer.updated_at,
            "wants_own_logistics": bool(
                offer.wants_own_logistics
            ),

            "lot": {
                "id": lot.id if lot else offer.lot_id,
                "lot_id": (
                    lot.lot_id
                    if lot
                    else offer.lot_id
                ),
                "crop": lot.crop if lot else None,
                "variety": lot.variety if lot else None,
                "quantity_quintal": (
                    lot.quantity_quintal
                    if lot
                    else None
                ),
                "price_per_quintal": (
                    lot.price_per_quintal
                    if lot
                    else None
                ),
                "quality_grade": (
                    lot.quality_grade
                    if lot
                    else None
                ),
                "quality_score": (
                    lot.quality_score
                    if lot
                    else None
                ),
                "quality_report_id": (
                    lot.quality_report_id
                    if lot
                    else None
                ),
            },

            "buyer": {
                "uid": (
                    buyer.uid
                    if buyer
                    else offer.buyer_id
                ),
                "name": (
                    buyer.full_name
                    if buyer
                    else None
                ),
                "phone": (
                    buyer.phone
                    if buyer
                    else None
                ),
                "email": (
                    buyer.email
                    if buyer
                    else None
                ),
                "business_name": (
                    buyer.business_name
                    if buyer
                    else None
                ),
                "supporter_type": (
                    buyer.supporter_type
                    if buyer
                    else None
                ),
                "latitude": (
                    buyer.latitude
                    if buyer
                    else None
                ),
                "longitude": (
                    buyer.longitude
                    if buyer
                    else None
                ),
            },
        })

    return {
        "success": True,
        "count": len(result),
        "offers": result,
    }


@router.get("/buyer")
async def list_buyer_offers(
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    """
    Return real marketplace offers created by the
    authenticated supporter/buyer.

    Source of truth:
        offers.buyer_id == current_user.uid
    """

    if current_user.role != UserRole.SUPPORTER:
        raise HTTPException(
            status_code=403,
            detail="Only supporter accounts can access sent marketplace offers.",
        )

    offers = (
        db.query(Offer)
        .filter(Offer.buyer_id == current_user.uid)
        .order_by(Offer.created_at.desc())
        .all()
    )

    result = []

    for offer in offers:
        lot = (
            db.query(Lot)
            .filter(Lot.id == offer.lot_id)
            .first()
        )

        farmer = (
            db.query(User)
            .filter(User.uid == offer.farmer_id)
            .first()
        )

        result.append({
            "id": offer.id,
            "offer_id": offer.id,
            "lot_id": offer.lot_id,
            "status": offer.status,
            "price_per_unit": offer.price_per_unit,
            "quantity": offer.quantity,
            "quantity_unit": offer.quantity_unit,
            "total_price": offer.total_price,
            "created_at": offer.created_at,
            "updated_at": offer.updated_at,
            "distance_km": offer.distance_km,
            "wants_own_logistics": bool(
                offer.wants_own_logistics
            ),

            "lot": {
                "id": lot.id if lot else offer.lot_id,
                "lot_id": (
                    lot.lot_id
                    if lot
                    else offer.lot_id
                ),
                "crop": lot.crop if lot else None,
                "variety": lot.variety if lot else None,
                "quantity_quintal": (
                    lot.quantity_quintal
                    if lot
                    else None
                ),
                "price_per_quintal": (
                    lot.price_per_quintal
                    if lot
                    else None
                ),
                "quality_grade": (
                    lot.quality_grade
                    if lot
                    else None
                ),
                "quality_score": (
                    lot.quality_score
                    if lot
                    else None
                ),
                "quality_report_id": (
                    lot.quality_report_id
                    if lot
                    else None
                ),
            },

            "farmer": {
                "uid": (
                    farmer.uid
                    if farmer
                    else offer.farmer_id
                ),
                "name": (
                    farmer.full_name
                    if farmer
                    else None
                ),
                "phone": (
                    farmer.phone
                    if farmer
                    else None
                ),
                "email": (
                    farmer.email
                    if farmer
                    else None
                ),
                "village": (
                    farmer.village
                    if farmer
                    else None
                ),
                "district": (
                    farmer.district
                    if farmer
                    else None
                ),
                "state": (
                    farmer.state
                    if farmer
                    else None
                ),
            },
        })

    return {
        "success": True,
        "count": len(result),
        "offers": result,
    }

@router.get("/{offer_id}/qr-detail")
async def offer_qr_detail(
    offer_id: str,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    offer = (
        db.query(Offer)
        .filter(Offer.id == offer_id)
        .first()
    )

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found.",
        )

    if current_user.uid not in {
        offer.farmer_id,
        offer.buyer_id,
    } and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="You are not authorised to view this offer.",
        )

    lot = db.query(Lot).filter(Lot.id == offer.lot_id).first()
    buyer = db.query(User).filter(User.uid == offer.buyer_id).first()
    farmer = db.query(User).filter(User.uid == offer.farmer_id).first()

    if not lot or not buyer or not farmer:
        raise HTTPException(
            status_code=404,
            detail="Offer relationship data is incomplete.",
        )

    distance = _distance_km(
        farmer.latitude,
        farmer.longitude,
        buyer.latitude,
        buyer.longitude,
    )

    return {
        "offer_id": offer.id,
        "status": offer.status,
        "price_per_unit": offer.price_per_unit,
        "quantity": offer.quantity,
        "total_price": offer.total_price,
        "lot": {
            "id": lot.id,
            "lot_id": lot.lot_id,
            "crop": lot.crop,
            "variety": lot.variety,
            "quantity_quintal": lot.quantity_quintal,
            "price_per_quintal": lot.price_per_quintal,
        },
        "buyer": {
            "name": buyer.full_name,
            "phone": buyer.phone,
            "email": buyer.email,
            "latitude": buyer.latitude,
            "longitude": buyer.longitude,
        },
        "farmer": {
            "name": farmer.full_name,
            "phone": farmer.phone,
            "email": farmer.email,
            "latitude": farmer.latitude,
            "longitude": farmer.longitude,
        },
        "distance_km": distance,
        "wants_own_logistics": False,
    }


@router.post("/{offer_id}/respond")
async def respond_to_offer(
    offer_id: str,
    payload: OfferResponse,
    current_user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    if payload.decision not in {"accept", "reject"}:
        raise HTTPException(
            status_code=400,
            detail="Decision must be accept or reject.",
        )

    offer = (
        db.query(Offer)
        .filter(Offer.id == offer_id)
        .first()
    )

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found.",
        )

    if offer.farmer_id != current_user.uid:
        raise HTTPException(
            status_code=403,
            detail="Only the farmer who owns the lot can respond.",
        )

    if offer.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This offer has already been processed.",
        )

    offer.status = (
        "accepted"
        if payload.decision == "accept"
        else "rejected"
    )

    
    # ---------------------------------------------------------------
    # ORDER-AUTO-CREATED-FROM-OFFER
    #
    # Accepted offers become real orders. The duplicate check is
    # intentionally based on lot + buyer + farmer + accepted status,
    # because an order may already have been created by an earlier
    # repair/manual migration.
    # ---------------------------------------------------------------
    if payload.decision == "accept":
        existing_order = (
            db.query(Order)
            .filter(
                Order.lot_id == offer.lot_id,
                Order.buyer_id == offer.buyer_id,
                Order.farmer_id == offer.farmer_id,
            )
            .first()
        )

        if not existing_order:
            lot = None

            try:
                from app.models.lot import Lot

                lot = (
                    db.query(Lot)
                    .filter(Lot.id == offer.lot_id)
                    .first()
                )
            except Exception:
                lot = None

            commodity = (
                getattr(lot, "crop", None)
                or getattr(lot, "commodity", None)
                or "Unknown"
            )

            order_id = (
                "ORDER-"
                + str(offer.id)
            )

            # Guard once more against the exact generated primary key.
            existing_by_id = (
                db.query(Order)
                .filter(Order.id == order_id)
                .first()
            )

            if not existing_by_id:
                order = Order(
                    id=order_id,
                    order_id=(
                        "ORD-"
                        + datetime.utcnow().strftime("%Y%m%d")
                        + "-"
                        + uuid.uuid4().hex[:8].upper()
                    ),
                    lot_id=offer.lot_id,
                    farmer_id=offer.farmer_id,
                    buyer_id=offer.buyer_id,
                    commodity=commodity,
                    quantity=offer.quantity,
                    gross_amount=offer.total_price,
                    net_amount=offer.total_price,
                    status="confirmed",
                )

                db.add(order)

    try:
        from app.blockchain_ledger import BlockchainLedger

        BlockchainLedger().add_block(
            {
                "event": f"offer_{offer.status}",
                "offer_id": offer.id,
                "lot_id": offer.lot_id,
            }
        )
    except Exception as exc:
        print(f"Offer ledger warning: {exc}")

    db.commit()
    db.refresh(offer)

    return {
        "success": True,
        "offer_id": offer.id,
        "status": offer.status,
    }
