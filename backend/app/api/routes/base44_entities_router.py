"""
Generic CRUD for the 19 Base44-ported entities, mirroring the pattern
in the original Base44 export's routers/entities.py (list/filter/get/
create/update/delete at /api/entities/{EntityName}), but using this
project's existing Firebase auth instead of a separate JWT system.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.firebase_auth import get_current_user
from app.models.user import User
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
    data = {c.name: getattr(row, c.name) for c in row.__table__.columns}

    if row.__class__.__name__ == "LogisticsTrip":
        data["requestedBy"] = data.get("farmer_id")
        data["assignedTo"] = data.get("provider_id")
        data["cropType"] = data.get("commodity")
        data["quantityQuintal"] = data.get("quantity")
        data["created_date"] = data.get("created_at")

    return data


def _normalise_entity_payload(entity_name, payload):
    if entity_name != "LogisticsTrip":
        return dict(payload)

    aliases = {
        "requestedBy": "farmer_id",
        "assignedTo": "provider_id",
        "cropType": "commodity",
        "quantityQuintal": "quantity",
        "tripId": "trip_id",
        "orderId": "order_id",
        "created_date": "created_at",
    }

    data = {}

    for key, value in payload.items():
        target = aliases.get(key, key)
        data[target] = value

    return data


def _apply_entity_filters(query, model, entity_name, request):
    if entity_name != "LogisticsTrip":
        return query

    aliases = {
        "requestedBy": "farmer_id",
        "assignedTo": "provider_id",
        "cropType": "commodity",
        "quantityQuintal": "quantity",
        "tripId": "trip_id",
        "orderId": "order_id",
        "created_date": "created_at",
    }

    valid_columns = {c.name for c in model.__table__.columns}

    for key, value in request.query_params.multi_items():
        if key in {"limit", "offset", "sort", "order", "page"}:
            continue

        column_name = aliases.get(key, key)

        if column_name not in valid_columns:
            continue

        if value:
            query = query.filter(
                getattr(model, column_name) == value
            )

    sort_value = request.query_params.get("sort")

    if sort_value:
        descending = sort_value.startswith("-")
        raw_name = sort_value[1:] if descending else sort_value

        column_name = aliases.get(raw_name, raw_name)

        if column_name in valid_columns:
            column = getattr(model, column_name)

            query = query.order_by(
                column.desc() if descending else column.asc()
            )

    return query


@router.get("/{entity_name}")
def list_entities(
    entity_name: str,
    request: Request,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    model = _model_for(entity_name)

    query = db.query(model)

    if entity_name == "LogisticsTrip":
        db_user = db.query(User).filter(
            User.firebase_uid == user.get("uid")
        ).first()

        if not db_user:
            raise HTTPException(
                status_code=403,
                detail="User profile not found",
            )

        if db_user.role == "admin":
            pass
        elif db_user.role == "farmer":
            query = query.filter(
                model.farmer_id == db_user.id
            )
        elif (
            db_user.supporter_type == "logistics_provider"
            and db_user.verification_status == "verified"
        ):
            query = query.filter(
                model.provider_id == db_user.id
            )
        else:
            raise HTTPException(
                status_code=403,
                detail="Verified logistics access required",
            )

    query = _apply_entity_filters(query, model, entity_name, request)

    rows = query.offset(offset).limit(limit).all()

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

    payload = _normalise_entity_payload(entity_name, payload)

    valid_columns = {c.name for c in model.__table__.columns}
    data = {k: v for k, v in payload.items() if k in valid_columns}
    data["id"] = data.get("id") or str(uuid.uuid4())
    # Not every entity model has a created_by column (e.g. LogisticsTrip
    # tracks the actor via farmer_id/provider_id instead) — only stamp
    # it when the model actually supports it, so create_entity doesn't
    # 500 on models without that column.
    if "created_by" in valid_columns:
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

    payload = _normalise_entity_payload(entity_name, payload)

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
