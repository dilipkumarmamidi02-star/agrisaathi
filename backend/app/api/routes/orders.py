from datetime import datetime
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.base44_entities import Order

router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"],
)


def _serialize(order):
    return {
        "id": order.id,
        "order_id": order.order_id,
        "lot_id": order.lot_id,
        "farmer_id": order.farmer_id,
        "buyer_id": order.buyer_id,
        "commodity": order.commodity,
        "variety": getattr(order, "variety", None),
        "quantity": order.quantity,
        "quantity_unit": getattr(order, "quantity_unit", None),
        "gross_amount": order.gross_amount,
        "net_amount": order.net_amount,
        "transport_cost": getattr(order, "transport_cost", 0) or 0,
        "payment_terms": getattr(order, "payment_terms", None),
        "status": order.status,
        "created_at": (
            order.created_at.isoformat()
            if order.created_at else None
        ),
    }


@router.get("")
@router.get("/")
def list_my_orders(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = current_user.get("uid")

    orders = (
        db.query(Order)
        .filter(
            (Order.farmer_id == uid) |
            (Order.buyer_id == uid)
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(orders),
        "orders": [_serialize(o) for o in orders],
    }
