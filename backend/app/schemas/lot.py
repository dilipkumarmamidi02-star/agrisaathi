from datetime import datetime
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
