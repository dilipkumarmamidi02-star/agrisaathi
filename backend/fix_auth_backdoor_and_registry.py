auth_path = "app/core/auth.py"
safe_auth = '''"""
app/core/auth.py

DEPRECATED SHIM. This file used to contain its own JWT auth with a
hardcoded admin email/password AND a fallback that granted admin access
to any request with an invalid or missing token. That was a severe
auth-bypass bug and has been removed entirely -- nothing in this file
grants access on its own anymore.

The real, correct auth system is app/core/firebase_auth.py (verifies a
real Firebase ID token via firebase_admin). Every route in this project
should import get_current_user from there, not from here.

This shim only exists so that if any other file still does
`from app.core.auth import get_current_user`, it keeps working -- but
now it's the SAME secure function, not a bypass.
"""
from app.core.firebase_auth import get_current_user, get_current_uid  # noqa: F401
'''
with open(auth_path, "w", encoding="utf-8") as f:
    f.write(safe_auth)
print("app/core/auth.py: backdoor removed, now re-exports the real firebase_auth.get_current_user")

registry_path = "app/models/base44_entities.py"
with open(registry_path, encoding="utf-8") as f:
    content = f.read()

if "ENTITY_REGISTRY" not in content:
    registry_block = '''

ENTITY_REGISTRY = {
    "QualityReport": QualityReport,
    "QualitySession": QualitySession,
    "QualitySample": QualitySample,
    "Grievance": Grievance,
    "Notification": Notification,
    "Offer": Offer,
    "Order": Order,
    "PriceAlert": PriceAlert,
    "StorageFacility": StorageFacility,
    "LogisticsTrip": LogisticsTrip,
    "AuditLog": AuditLog,
}
'''
    content = content.rstrip("\n") + "\n" + registry_block
    with open(registry_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("base44_entities.py: ENTITY_REGISTRY added (11 entities)")
else:
    print("base44_entities.py: ENTITY_REGISTRY already present, skipped")

lot_model_path = "app/models/lot.py"
with open(lot_model_path, encoding="utf-8") as f:
    content = f.read()

old = '    blockchain_status = Column(String, default="pending")\n    created_at = Column(DateTime, server_default=func.now())'
new = (
    '    blockchain_status = Column(String, default="pending")\n'
    '    quality_report_id = Column(String, nullable=True)\n'
    '    quality_grade = Column(String, nullable=True)\n'
    '    quality_score = Column(Float, nullable=True)\n'
    '    created_at = Column(DateTime, server_default=func.now())'
)
if old in content:
    content = content.replace(old, new, 1)
    with open(lot_model_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("lot.py: added quality_report_id / quality_grade / quality_score columns")
else:
    print("lot.py: anchor not found, skipped -- check manually")

import sqlite3
conn = sqlite3.connect("agrisaathi.db")
cur = conn.cursor()
cur.execute("PRAGMA table_info(lots)")
existing_cols = {row[1] for row in cur.fetchall()}
for col, coltype in [("quality_report_id", "VARCHAR"), ("quality_grade", "VARCHAR"), ("quality_score", "FLOAT")]:
    if col not in existing_cols:
        cur.execute(f"ALTER TABLE lots ADD COLUMN {col} {coltype}")
        print(f"lots table: added column {col}")
    else:
        print(f"lots table: column {col} already exists, skipped")
conn.commit()
conn.close()
