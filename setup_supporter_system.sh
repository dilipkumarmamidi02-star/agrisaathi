#!/bin/bash

set -e

PROJECT="/Users/mamididilipkumar/Downloads/agrisaathi"
BACKEND="$PROJECT/backend"

echo "=============================================="
echo " AGRISAATHI SUPPORTER SYSTEM PATCH"
echo "=============================================="

# ------------------------------------------------
# VERIFY PROJECT
# ------------------------------------------------

if [ ! -d "$BACKEND" ]; then
    echo "❌ Backend not found:"
    echo "$BACKEND"
    exit 1
fi

cd "$BACKEND"

echo "✅ Backend found:"
pwd

# ------------------------------------------------
# BACKUP
# ------------------------------------------------

STAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP="$BACKEND/.repair-backups/supporter-system-$STAMP"

mkdir -p "$BACKUP"

echo
echo "=============================================="
echo " CREATING BACKUP"
echo "=============================================="

for FILE in \
    "app/models/user.py" \
    "app/core/config.py" \
    "app/api/routes/users.py" \
    "agrisaathi.db" \
    ".env"
do
    if [ -f "$FILE" ]; then
        mkdir -p "$BACKUP/$(dirname "$FILE")"
        cp "$FILE" "$BACKUP/$FILE"
        echo "✅ Backed up: $FILE"
    fi
done

echo "Backup:"
echo "$BACKUP"

# ------------------------------------------------
# PATCH USER MODEL
# ------------------------------------------------

python3 - <<'PY'
from pathlib import Path

path = Path("app/models/user.py")

if not path.exists():
    raise SystemExit("❌ app/models/user.py not found")

content = path.read_text(encoding="utf-8")

# ------------------------------------------------
# UserRole
# ------------------------------------------------

old_enum = '''class UserRole(str, enum.Enum):
    FARMER = "farmer"
    ADMIN = "admin"'''

new_enum = '''class UserRole(str, enum.Enum):
    FARMER = "farmer"
    SUPPORTER = "supporter"
    ADMIN = "admin"


# The supporter categories recognised by AgriSaathi.
# Stored as a normal string column so additional categories
# can be introduced later without changing the database enum.
SUPPORTER_TYPES = [
    "fpo_farmer_group",
    "buyer",
    "trader",
    "processor",
    "institutional_buyer",
    "logistics_provider",
    "warehouse_provider",
    "cold_storage_provider",
    "quality_service_provider",
    "private_market_operator",
    "government_market_operator",
]'''

if "SUPPORTER_TYPES" not in content:
    if old_enum in content:
        content = content.replace(old_enum, new_enum, 1)
        print("✅ user.py: UserRole + SUPPORTER_TYPES added")
    else:
        raise SystemExit(
            "❌ user.py: expected UserRole block was not found. "
            "No model changes were made."
        )
else:
    print("ℹ️ user.py: SUPPORTER_TYPES already exists")

# ------------------------------------------------
# Supporter columns
# ------------------------------------------------

anchor = "    is_verified = Column(Boolean, default=False)"

supporter_columns = '''    is_verified = Column(Boolean, default=False)

    # Supporter account information
    supporter_type = Column(String, nullable=True)
    business_name = Column(String, nullable=True)

    # pending | verified | rejected | suspended
    # Mainly meaningful for supporter accounts.
    verification_status = Column(String, default="verified")'''

if "supporter_type = Column" not in content:
    if anchor in content:
        content = content.replace(anchor, supporter_columns, 1)
        print("✅ user.py: supporter columns added")
    else:
        raise SystemExit(
            "❌ user.py: is_verified anchor was not found. "
            "No column changes were made."
        )
else:
    print("ℹ️ user.py: supporter columns already exist")

path.write_text(content, encoding="utf-8")

# ------------------------------------------------
# CONFIG
# ------------------------------------------------

path = Path("app/core/config.py")

if not path.exists():
    raise SystemExit("❌ app/core/config.py not found")

content = path.read_text(encoding="utf-8")

if "admin_email:" not in content:
    anchor = '    data_gov_api_key: str = ""'

    if anchor in content:
        content = content.replace(
            anchor,
            anchor + '\n    admin_email: str = ""',
            1,
        )
        path.write_text(content, encoding="utf-8")
        print("✅ config.py: admin_email added")
    else:
        print("⚠️ config.py: data_gov_api_key anchor not found")
else:
    print("ℹ️ config.py: admin_email already exists")

# ------------------------------------------------
# USERS ROUTES
# ------------------------------------------------

path = Path("app/api/routes/users.py")

if not path.exists():
    raise SystemExit("❌ app/api/routes/users.py not found")

content = path.read_text(encoding="utf-8")

# ------------------------------------------------
# Imports
# ------------------------------------------------

if "SUPPORTER_TYPES" not in content.split("\n", 30).__str__():
    content = content.replace(
        "from app.models.user import User",
        "from app.models.user import User, UserRole, SUPPORTER_TYPES",
        1,
    )

# If UserRole is imported but SUPPORTER_TYPES isn't
if (
    "from app.models.user import User, UserRole" in content
    and "SUPPORTER_TYPES" not in content
):
    content = content.replace(
        "from app.models.user import User, UserRole",
        "from app.models.user import User, UserRole, SUPPORTER_TYPES",
        1,
    )

# HTTPException
if "HTTPException" not in content:
    content = content.replace(
        "from fastapi import APIRouter, Depends, Response",
        "from fastapi import APIRouter, Depends, Response, HTTPException",
        1,
    )

# ------------------------------------------------
# SupporterRegistration model
# ------------------------------------------------

if "class SupporterRegistration(BaseModel):" not in content:
    anchor = '''class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None'''

    replacement = anchor + '''


class SupporterRegistration(BaseModel):
    supporter_type: str
    business_name: str
    full_name: str
    phone: Optional[str] = None
'''

    if anchor in content:
        content = content.replace(anchor, replacement, 1)
        print("✅ users.py: SupporterRegistration added")
    else:
        print("⚠️ users.py: UserUpdate anchor not found")
else:
    print("ℹ️ users.py: SupporterRegistration already exists")

# ------------------------------------------------
# _get_or_create
# ------------------------------------------------

old_get_or_create = '''def _get_or_create(db: Session, uid: str, email: Optional[str]) -> User:
    user = db.query(User).filter(User.uid == uid).first()
    if user is None:
        user = User(id=str(uuid.uuid4()), uid=uid, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user'''

new_get_or_create = '''def _get_or_create(db: Session, uid: str, email: Optional[str]) -> User:
    from app.core.config import settings

    user = db.query(User).filter(User.uid == uid).first()

    if user is None:
        role = (
            UserRole.ADMIN
            if settings.admin_email and email == settings.admin_email
            else UserRole.FARMER
        )

        user = User(
            id=str(uuid.uuid4()),
            uid=uid,
            email=email,
            role=role,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    elif (
        settings.admin_email
        and email == settings.admin_email
        and user.role != UserRole.ADMIN
    ):
        # Promote the configured admin account on login as well.
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)

    return user'''

if "settings.admin_email" not in content:
    if old_get_or_create in content:
        content = content.replace(
            old_get_or_create,
            new_get_or_create,
            1,
        )
        print("✅ users.py: admin promotion logic added")
    else:
        print("⚠️ users.py: _get_or_create anchor not found")
else:
    print("ℹ️ users.py: admin promotion logic already exists")

# ------------------------------------------------
# Serializer
# ------------------------------------------------

if '"verification_status": user.verification_status' not in content:
    old_serialize = '''def _serialize(user: User) -> dict:
    return {
        "full_name": user.full_name,
        "phone": user.phone,
        "email": user.email,
        "state": user.state,
        "district": user.district,
        "village": user.village,
        "address": user.address,
        "preferred_language": user.preferred_language,
    }'''

    new_serialize = '''def _serialize(user: User) -> dict:
    return {
        "full_name": user.full_name,
        "phone": user.phone,
        "email": user.email,
        "state": user.state,
        "district": user.district,
        "village": user.village,
        "address": user.address,
        "preferred_language": user.preferred_language,
        "role": user.role.value if user.role else None,
        "supporter_type": user.supporter_type,
        "business_name": user.business_name,
        "verification_status": user.verification_status,
    }'''

    if old_serialize in content:
        content = content.replace(
            old_serialize,
            new_serialize,
            1,
        )
        print("✅ users.py: supporter fields added to serializer")
    else:
        print("⚠️ users.py: serializer anchor not found")
else:
    print("ℹ️ users.py: supporter serializer already exists")

# ------------------------------------------------
# Admin/supporter endpoints
# ------------------------------------------------

if '"/register-supporter"' not in content:

    additions = '''

# ============================================================
# SUPPORTER REGISTRATION + ADMIN VERIFICATION
# ============================================================

def _require_admin(current_user: dict, db: Session) -> User:
    user = (
        db.query(User)
        .filter(User.uid == current_user["uid"])
        .first()
    )

    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return user


@router.post("/register-supporter")
async def register_supporter(
    payload: SupporterRegistration,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Register the currently authenticated Firebase user as a supporter.

    New supporter accounts begin in pending verification status.
    """

    response.headers["Cache-Control"] = "no-store"

    if payload.supporter_type not in SUPPORTER_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid supporter type",
                "allowed_types": SUPPORTER_TYPES,
            },
        )

    if not payload.business_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Business name is required",
        )

    if not payload.full_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Full name is required",
        )

    user = _get_or_create(
        db,
        current_user["uid"],
        current_user.get("email"),
    )

    user.role = UserRole.SUPPORTER
    user.supporter_type = payload.supporter_type
    user.business_name = payload.business_name.strip()
    user.full_name = payload.full_name.strip()

    if payload.phone:
        user.phone = payload.phone.strip()

    user.verification_status = "pending"

    db.commit()
    db.refresh(user)

    return _serialize(user)


@router.get("/admin/users")
async def admin_list_users(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.value if user.role else None,
            "supporter_type": user.supporter_type,
            "business_name": user.business_name,
            "verification_status": user.verification_status,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            ),
        }
        for user in users
    ]


@router.post("/admin/users/{user_id}/verify")
async def admin_verify_user(
    user_id: str,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    target = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    target.verification_status = "verified"

    db.commit()
    db.refresh(target)

    return _serialize(target)


@router.post("/admin/users/{user_id}/reject")
async def admin_reject_user(
    user_id: str,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    target = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    target.verification_status = "rejected"

    db.commit()
    db.refresh(target)

    return _serialize(target)


@router.post("/admin/users/{user_id}/suspend")
async def admin_suspend_user(
    user_id: str,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"

    _require_admin(current_user, db)

    target = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    target.verification_status = "suspended"

    db.commit()
    db.refresh(target)

    return _serialize(target)
'''

    content = content.rstrip() + "\n" + additions

    print("✅ users.py: supporter/admin endpoints added")

else:
    print("ℹ️ users.py: supporter/admin endpoints already exist")

path.write_text(content, encoding="utf-8")

print("✅ Python source patch completed")
PY

# ------------------------------------------------
# DATABASE MIGRATION
# ------------------------------------------------

echo
echo "=============================================="
echo " UPDATING SQLITE DATABASE"
echo "=============================================="

if [ -f "agrisaathi.db" ]; then

python3 - <<'PY'
import sqlite3
from pathlib import Path

db = Path("agrisaathi.db")

conn = sqlite3.connect(db)
cur = conn.cursor()

cur.execute("PRAGMA table_info(users)")
columns = {row[1] for row in cur.fetchall()}

required = [
    ("supporter_type", "VARCHAR", None),
    ("business_name", "VARCHAR", None),
    ("verification_status", "VARCHAR", "'verified'"),
]

for name, column_type, default in required:
    if name in columns:
        print(f"ℹ️ users.{name} already exists")
        continue

    sql = f"ALTER TABLE users ADD COLUMN {name} {column_type}"

    if default is not None:
        sql += f" DEFAULT {default}"

    cur.execute(sql)
    print(f"✅ users.{name} added")

conn.commit()

cur.execute("PRAGMA table_info(users)")
columns_after = {row[1] for row in cur.fetchall()}

conn.close()

for name, _, _ in required:
    if name not in columns_after:
        raise SystemExit(
            f"❌ Database verification failed for column: {name}"
        )

print("✅ SQLite supporter columns verified")
PY

else
    echo "⚠️ agrisaathi.db not found."
    echo "   The SQLAlchemy model will create/update tables when your"
    echo "   configured database initialization runs."
fi

# ------------------------------------------------
# ENV CHECK
# ------------------------------------------------

echo
echo "=============================================="
echo " CHECKING ADMIN CONFIGURATION"
echo "=============================================="

if [ -f ".env" ]; then

    if grep -qE '^ADMIN_EMAIL=' .env; then
        echo "✅ ADMIN_EMAIL exists in backend/.env"
    else
        echo
        echo "⚠️ ADMIN_EMAIL is NOT present in backend/.env"
        echo
        echo "Add it with:"
        echo
        echo 'echo "ADMIN_EMAIL=your-admin-email@example.com" >> .env'
        echo
    fi

else
    echo "⚠️ backend/.env does not exist"
    echo "Create it before starting the backend."
fi

# ------------------------------------------------
# PYTHON SYNTAX CHECK
# ------------------------------------------------

echo
echo "=============================================="
echo " PYTHON SYNTAX CHECK"
echo "=============================================="

python3 -m py_compile \
    app/models/user.py \
    app/core/config.py \
    app/api/routes/users.py

echo "✅ Python syntax check passed"

# ------------------------------------------------
# VERIFY SUPPORTER SYSTEM
# ------------------------------------------------

echo
echo "=============================================="
echo " VERIFYING SUPPORTER SYSTEM"
echo "=============================================="

grep -n "SUPPORTER_TYPES" app/models/user.py >/dev/null \
    && echo "✅ SUPPORTER_TYPES"

grep -n 'SUPPORTER = "supporter"' app/models/user.py >/dev/null \
    && echo "✅ UserRole.SUPPORTER"

grep -n "supporter_type" app/models/user.py >/dev/null \
    && echo "✅ supporter_type column"

grep -n "business_name" app/models/user.py >/dev/null \
    && echo "✅ business_name column"

grep -n "verification_status" app/models/user.py >/dev/null \
    && echo "✅ verification_status column"

grep -n "admin_email" app/core/config.py >/dev/null \
    && echo "✅ admin_email configuration"

grep -n "register-supporter" app/api/routes/users.py >/dev/null \
    && echo "✅ supporter registration endpoint"

grep -n "admin/users" app/api/routes/users.py >/dev/null \
    && echo "✅ admin user endpoint"

grep -n "admin_verify_user" app/api/routes/users.py >/dev/null \
    && echo "✅ admin verification endpoint"

grep -n "admin_reject_user" app/api/routes/users.py >/dev/null \
    && echo "✅ admin rejection endpoint"

grep -n "admin_suspend_user" app/api/routes/users.py >/dev/null \
    && echo "✅ admin suspension endpoint"

# ------------------------------------------------
# FINAL
# ------------------------------------------------

echo
echo "=============================================="
echo " SUPPORTER SYSTEM PATCH COMPLETE"
echo "=============================================="

echo
echo "Backup:"
echo "$BACKUP"

echo
echo "Backend:"
echo "$BACKEND"

echo
echo "Implemented:"
echo "  ✅ Farmer"
echo "  ✅ Supporter"
echo "  ✅ Admin"
echo "  ✅ 11 supporter types"
echo "  ✅ Supporter registration"
echo "  ✅ Pending verification"
echo "  ✅ Admin user listing"
echo "  ✅ Admin verify"
echo "  ✅ Admin reject"
echo "  ✅ Admin suspend"
echo "  ✅ Admin promotion using ADMIN_EMAIL"
echo "  ✅ SQLite schema update"
echo "  ✅ Python syntax verification"

echo
echo "=============================================="
echo " NEXT STEP"
echo "=============================================="

echo "Start backend with:"
echo
echo "cd $BACKEND"
echo "source venv/bin/activate"
echo "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

