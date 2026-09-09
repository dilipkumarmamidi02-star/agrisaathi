import os

model_content = '''from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Lot(Base):
    """
    A farmer's produce listing. Replaces the old localStorage-only
    entities.Lots on the frontend -- this is a real, shared table so a
    supporter on a different device/browser can actually see lots a
    farmer created, and vice versa for offers/orders built on top of it.
    """
    __tablename__ = "lots"

    id = Column(String, primary_key=True)
    farmer_id = Column(String, index=True, nullable=False)
    farmer_name = Column(String, nullable=True)
    crop = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    quantity_quintal = Column(Float, nullable=False)
    price_per_quintal = Column(Float, nullable=False)
    min_price_per_quintal = Column(Float, nullable=True)
    harvest_date = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active | sold | cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
'''

schema_content = '''from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class LotBase(BaseModel):
    crop: str
    variety: Optional[str] = None
    quantity_quintal: float
    price_per_quintal: float
    min_price_per_quintal: Optional[float] = None
    harvest_date: Optional[datetime] = None
    notes: Optional[str] = None


class LotCreate(LotBase):
    pass


class LotUpdate(BaseModel):
    status: Optional[str] = None
    price_per_quintal: Optional[float] = None
    min_price_per_quintal: Optional[float] = None
    quantity_quintal: Optional[float] = None
    notes: Optional[str] = None


class LotResponse(LotBase):
    id: str
    farmer_id: str
    farmer_name: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
'''

routes_content = '''import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.firebase_auth import get_current_user
from app.models.lot import Lot
from app.schemas.lot import LotCreate, LotUpdate, LotResponse

router = APIRouter(prefix="/api/lots", tags=["lots"])


@router.get("", response_model=List[LotResponse])
def list_lots(
    status: Optional[str] = None,
    farmer_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    query = db.query(Lot)
    if status:
        query = query.filter(Lot.status == status)
    if farmer_id:
        query = query.filter(Lot.farmer_id == farmer_id)
    return query.order_by(Lot.created_at.desc()).limit(200).all()


@router.get("/{lot_id}", response_model=LotResponse)
def get_lot(
    lot_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    return lot


@router.post("", response_model=LotResponse)
def create_lot(
    payload: LotCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    lot = Lot(
        id=str(uuid.uuid4()),
        farmer_id=user["uid"],
        farmer_name=user.get("name") or user.get("email"),
        status="active",
        **payload.dict(),
    )
    db.add(lot)
    db.commit()
    db.refresh(lot)
    return lot


@router.patch("/{lot_id}", response_model=LotResponse)
def update_lot(
    lot_id: str,
    payload: LotUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    if lot.farmer_id != user["uid"]:
        raise HTTPException(status_code=403, detail="Not your lot")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(lot, field, value)
    db.commit()
    db.refresh(lot)
    return lot
'''

with open("backend/app/models/lot.py", "w", encoding="utf-8") as f:
    f.write(model_content)
print("created backend/app/models/lot.py")

with open("backend/app/schemas/lot.py", "w", encoding="utf-8") as f:
    f.write(schema_content)
print("created backend/app/schemas/lot.py")

with open("backend/app/api/routes/lots.py", "w", encoding="utf-8") as f:
    f.write(routes_content)
print("created backend/app/api/routes/lots.py")

main_path = "backend/app/main.py"
with open(main_path, encoding="utf-8") as f:
    main_content = f.read()

if "from app.api.routes import lots" not in main_content:
    import_anchor = "app.include_router(crop.router"
    idx = main_content.find(import_anchor)
    if idx == -1:
        print("WARNING: could not find crop.router include line to anchor near -- add lots router manually")
    else:
        # add an import for the new router module near the top, and the include line
        # right after crop.router's include, reusing the same _auth_dep list.
        first_import_idx = main_content.find("from app.api.routes import")
        if first_import_idx != -1:
            line_end = main_content.find("\n", first_import_idx)
            main_content = (
                main_content[:line_end]
                + "\nfrom app.api.routes import lots"
                + main_content[line_end:]
            )
        insert_at = main_content.find("\n", main_content.find(import_anchor)) + 1
        main_content = (
            main_content[:insert_at]
            + "app.include_router(lots.router, dependencies=_auth_dep)\n"
            + main_content[insert_at:]
        )
        with open(main_path, "w", encoding="utf-8") as f:
            f.write(main_content)
        print("main.py: lots router registered")
else:
    print("main.py: lots router already present, skipped")
