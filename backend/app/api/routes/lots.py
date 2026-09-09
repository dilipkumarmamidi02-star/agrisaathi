from datetime import datetime
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.firebase_auth import get_current_user
from app.core.database import get_db
from app.models.lot import Lot

router = APIRouter(prefix="/api/lots", tags=["lots"])

def _new_lot_identifier():
    return "LOT-" + datetime.now().strftime('%Y%m%d') + "-" + uuid.uuid4().hex[:8].upper()

@router.get("/")
def get_lots(
    farmer_id: Optional[str] = Query(None, description="Filter by farmer ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    query = db.query(Lot)
    if farmer_id:
        query = query.filter(Lot.farmer_id == farmer_id)
    if status:
        query = query.filter(Lot.status == status)
    return query.order_by(Lot.created_at.desc()).all()

@router.post("/")
def create_lot(
    lot_data: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    crop = str(lot_data.get("crop") or "").strip()
    if not crop:
        raise HTTPException(status_code=400, detail="Commodity is required.")
    
    try:
        quantity = float(lot_data.get("quantityQuintal", 0))
    except:
        raise HTTPException(status_code=400, detail="Invalid quantity.")
    
    try:
        price = float(lot_data.get("pricePerQuintal", 0))
    except:
        raise HTTPException(status_code=400, detail="Invalid price.")
    
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0.")
    if price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0.")
    
    min_price = None
    if lot_data.get("minPricePerQuintal"):
        try:
            min_price = float(lot_data.get("minPricePerQuintal"))
        except:
            raise HTTPException(status_code=400, detail="Invalid minimum price.")
    
    lot_identifier = _new_lot_identifier()
    farmer_id = user.get("uid") or user.get("sub") or "unknown"
    farmer_name = user.get("name") or user.get("email") or "Farmer"
    
    lot = Lot(
        id=lot_identifier,
        lot_id=lot_identifier,
        farmer_id=farmer_id,
        farmer_name=farmer_name,
        crop=crop,
        variety=str(lot_data.get("variety") or "").strip(),
        quantity_quintal=quantity,
        price_per_quintal=price,
        min_price_per_quintal=min_price,
        harvest_date=lot_data.get("harvestDate"),
        status="active",
        qr_token=uuid.uuid4().hex + uuid.uuid4().hex[:16],
        blockchain_status="pending",
        quality_report_id=lot_data.get("qualityReportId"),
        quality_grade=lot_data.get("qualityGrade"),
        quality_score=lot_data.get("qualityScore")
    )
    
    db.add(lot)
    db.commit()
    db.refresh(lot)
    return lot

@router.get("/{lot_id}")
def get_lot(
    lot_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    return lot

@router.patch("/{lot_id}")
def update_lot(
    lot_id: str,
    lot_data: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    allowed_fields = {"status", "price_per_quintal", "min_price_per_quintal", "quantity_quintal", "quality_grade", "quality_score"}
    for key, value in lot_data.items():
        if key in allowed_fields and hasattr(lot, key):
            setattr(lot, key, value)
    db.commit()
    db.refresh(lot)
    return lot
