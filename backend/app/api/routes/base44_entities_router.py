"""
Generic CRUD for the 19 Base44-ported entities, mirroring the pattern
in the original Base44 export's routers/entities.py (list/filter/get/
create/update/delete at /api/entities/{EntityName}), but using this
project's existing Firebase auth instead of a separate JWT system.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.firebase_auth import get_current_user
from app.models.base44_entities import ENTITY_REGISTRY

router = APIRouter(prefix="/api/entities", tags=["entities"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _model_for(entity_name: str):
    model = ENTITY_REGISTRY.get(entity_name)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown entity '{entity_name}'. Registered: {list(ENTITY_REGISTRY.keys())}",
        )
    return model


def _row_to_dict(row):
    return {c.name: getattr(row, c.name) for c in row.__table__.columns}


@router.get("/{entity_name}")
def list_entities(
    entity_name: str,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    rows = db.query(model).offset(offset).limit(limit).all()
    return [_row_to_dict(r) for r in rows]


@router.get("/{entity_name}/{item_id}")
def get_entity(
    entity_name: str,
    item_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    row = db.query(model).filter(model.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} {item_id} not found")
    return _row_to_dict(row)


@router.post("/{entity_name}")
def create_entity(
    entity_name: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    valid_columns = {c.name for c in model.__table__.columns}
    data = {k: v for k, v in payload.items() if k in valid_columns}
    data["id"] = data.get("id") or str(uuid.uuid4())
    data["created_by"] = user.get("uid")
    row = model(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


@router.put("/{entity_name}/{item_id}")
def update_entity(
    entity_name: str,
    item_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    row = db.query(model).filter(model.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} {item_id} not found")
    valid_columns = {c.name for c in model.__table__.columns}
    for k, v in payload.items():
        if k in valid_columns and k not in ("id", "created_by", "created_at"):
            setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


@router.delete("/{entity_name}/{item_id}")
def delete_entity(
    entity_name: str,
    item_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)
    row = db.query(model).filter(model.id == item_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} {item_id} not found")
    db.delete(row)
    db.commit()
    return {"success": True, "id": item_id}
