#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT="$HOME/Downloads/agrisaathi"
FRONTEND="$PROJECT/frontend"
BACKEND="$PROJECT/backend"

FRONTEND_URL="https://agrisaathi-ashy.vercel.app"
BACKEND_URL="https://agrisaathi-backend.vercel.app"

REGISTRY="$BACKEND/app/core/datagov_registry.py"
MAIN="$BACKEND/app/main.py"
API_INDEX="$BACKEND/api/index.py"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$PROJECT/backup_deploy_repair_$STAMP"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() {
    echo -e "${GREEN}PASS:${NC} $1"
}

warn() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

fail() {
    echo -e "${RED}ERROR:${NC} $1"
    exit 1
}

section() {
    echo
    echo "============================================================"
    echo " $1"
    echo "============================================================"
}

cleanup() {
    true
}

trap cleanup EXIT

section "AGRISAATHI — LIVE DEPLOYMENT REPAIR"

echo "Project : $PROJECT"
echo "Frontend: $FRONTEND"
echo "Backend : $BACKEND"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL : $BACKEND_URL"

# ------------------------------------------------------------
# 0. PROJECT SAFETY
# ------------------------------------------------------------

section "0. PROJECT SAFETY"

[[ -d "$PROJECT" ]] || fail "Project directory does not exist."
[[ -d "$FRONTEND" ]] || fail "Frontend directory does not exist."
[[ -d "$BACKEND" ]] || fail "Backend directory does not exist."
[[ -f "$REGISTRY" ]] || fail "DATAGOV registry does not exist."
[[ -f "$MAIN" ]] || fail "backend/app/main.py does not exist."

cd "$PROJECT"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || fail "Not a Git repository."

pass "Existing AgriSaathi repository detected."

echo
echo "Git:"
git remote -v | sed -n '1,2p'
echo
git branch --show-current
git log -1 --oneline

# ------------------------------------------------------------
# 1. BACKUP
# ------------------------------------------------------------

section "1. SAFETY BACKUP"

mkdir -p "$BACKUP"

cp "$MAIN" "$BACKUP/main.py"
cp "$REGISTRY" "$BACKUP/datagov_registry.py"

if [[ -f "$API_INDEX" ]]; then
    cp "$API_INDEX" "$BACKUP/index.py"
fi

if [[ -f "$BACKEND/vercel.json" ]]; then
    cp "$BACKEND/vercel.json" "$BACKUP/backend-vercel.json"
fi

if [[ -f "$FRONTEND/vercel.json" ]]; then
    cp "$FRONTEND/vercel.json" "$BACKUP/frontend-vercel.json"
fi

pass "Backup created:"
echo "  $BACKUP"

# ------------------------------------------------------------
# 2. PYTHON / REGISTRY VALIDATION
# ------------------------------------------------------------

section "2. DATA.GOV.IN 72-RESOURCE REGISTRY"

cd "$PROJECT"

REGISTRY_COUNT="$(
python3 - "$REGISTRY" <<'PY'
import importlib.util
import sys

path = sys.argv[1]

spec = importlib.util.spec_from_file_location(
    "agrisaathi_datagov_registry",
    path
)

if spec is None or spec.loader is None:
    print("REGISTRY_IMPORT_ERROR")
    sys.exit(10)

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

registry = getattr(module, "DATAGOV_REGISTRY", None)

if not isinstance(registry, list):
    print("REGISTRY_NOT_LIST")
    sys.exit(11)

print(len(registry))
PY
)"

echo "Detected resource definitions: $REGISTRY_COUNT"

[[ "$REGISTRY_COUNT" == "72" ]] \
    || fail "DATAGOV_REGISTRY does not contain exactly 72 resources."

pass "DATAGOV_REGISTRY contains exactly 72 resources."

python3 - "$REGISTRY" <<'PY'
import importlib.util
import sys

path = sys.argv[1]

spec = importlib.util.spec_from_file_location(
    "agrisaathi_datagov_registry",
    path
)

if spec is None or spec.loader is None:
    raise SystemExit("Cannot import registry")

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

registry = module.DATAGOV_REGISTRY

ids = [r.get("id") for r in registry]

if ids != list(range(1, 73)):
    print("ERROR: Resource IDs are not exactly 1..72")
    print(ids)
    raise SystemExit(1)

resource_ids = [r.get("resource_id") for r in registry]

if len(set(resource_ids)) != 72:
    raise SystemExit("ERROR: Duplicate resource_id detected.")

keys = [r.get("resource_key") for r in registry]

if len(set(keys)) != 72:
    raise SystemExit("ERROR: Duplicate resource_key detected.")

required = {
    "id",
    "resource_key",
    "resource_name",
    "resource_id",
    "primary_feature",
    "secondary_features",
    "temporal_status",
}

for r in registry:
    missing = required - set(r.keys())
    if missing:
        raise SystemExit(
            f"ERROR: Resource {r.get('id')} missing fields: {sorted(missing)}"
        )

r26 = next(r for r in registry if r["id"] == 26)

if r26["resource_id"] != "cef25fe2-9231-4128-8aec-2c948fedd43f":
    raise SystemExit("ERROR: Resource #26 has incorrect ID.")

if r26["primary_feature"] != "Speak to AgriSaathi":
    raise SystemExit("ERROR: Resource #26 is not mapped to Speak to AgriSaathi.")

livestock = [
    r for r in registry
    if 34 <= r["id"] <= 68
]

if len(livestock) != 35:
    raise SystemExit(
        f"ERROR: Expected 35 livestock resources, found {len(livestock)}"
    )

print("Resource IDs        : PASS")
print("Unique resource IDs : PASS")
print("Unique resource keys: PASS")
print("Required fields     : PASS")
print("Resource #26 KCC    : PASS")
print("Livestock 34-68     : PASS")
PY

pass "72-resource registry validation passed."

# ------------------------------------------------------------
# 3. PYTHON IMPORT VALIDATION
# ------------------------------------------------------------

section "3. BACKEND PYTHON IMPORT VALIDATION"

cd "$BACKEND"

PYTHON_BIN="python3"

if [[ -x "$BACKEND/venv/bin/python" ]]; then
    PYTHON_BIN="$BACKEND/venv/bin/python"
elif [[ -x "$PROJECT/venv/bin/python" ]]; then
    PYTHON_BIN="$PROJECT/venv/bin/python"
fi

echo "Python:"
"$PYTHON_BIN" --version

"$PYTHON_BIN" - <<'PY'
import sys

print("Python executable:", sys.executable)

import fastapi
print("FastAPI:", fastapi.__version__)

try:
    import pydantic
    print("Pydantic:", pydantic.__version__)
except Exception as e:
    print("Pydantic import warning:", e)

try:
    import httpx
    print("httpx: OK")
except Exception as e:
    print("httpx warning:", e)
PY

pass "Backend Python imports are available."

# ------------------------------------------------------------
# 4. INSPECT MAIN APP
# ------------------------------------------------------------

section "4. FASTAPI APPLICATION INSPECTION"

echo
echo "FastAPI references in main.py:"
grep -nE \
    'FastAPI|CORSMiddleware|ALLOWED_ORIGINS|include_router' \
    "$MAIN" || true

echo
echo "Vercel API entrypoint:"
if [[ -f "$API_INDEX" ]]; then
    sed -n '1,180p' "$API_INDEX"
else
    warn "backend/api/index.py does not exist."
fi

# ------------------------------------------------------------
# 5. PATCH CORS SAFELY
# ------------------------------------------------------------

section "5. CORS REPAIR"

"$PYTHON_BIN" - "$MAIN" "$FRONTEND_URL" <<'PY'
from pathlib import Path
import sys
import re

path = Path(sys.argv[1])
frontend_url = sys.argv[2]

text = path.read_text()

original = text

# Ensure import exists.
if "from fastapi.middleware.cors import CORSMiddleware" not in text:
    matches = list(re.finditer(r"^from fastapi import .*$", text, re.M))

    if matches:
        pos = matches[0].end()
        text = (
            text[:pos]
            + "\nfrom fastapi.middleware.cors import CORSMiddleware"
            + text[pos:]
        )
    else:
        text = (
            "from fastapi.middleware.cors import CORSMiddleware\n"
            + text
        )

# Find existing CORSMiddleware block.
cors_pattern = re.compile(
    r"app\.add_middleware\(\s*CORSMiddleware,.*?\n\s*\)",
    re.S
)

cors_block = f'''app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "{frontend_url}",
        "https://www.agrisaathi.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)'''

if cors_pattern.search(text):
    text = cors_pattern.sub(cors_block, text, count=1)
else:
    # Put middleware immediately after app = FastAPI(...)
    app_match = re.search(
        r"^app\s*=\s*FastAPI\s*\([^\n]*\)\s*$",
        text,
        re.M
    )

    if not app_match:
        raise SystemExit(
            "ERROR: Could not find app = FastAPI(...) in main.py"
        )

    insert_at = app_match.end()

    text = (
        text[:insert_at]
        + "\n\n"
        + cors_block
        + text[insert_at:]
    )

if text != original:
    path.write_text(text)
    print("CORS middleware updated.")
else:
    print("CORS middleware already correct.")
PY

grep -n -A12 -B2 "CORSMiddleware" "$MAIN" || true

pass "CORS configuration patched/verified."

# ------------------------------------------------------------
# 6. VERIFY LOCAL ENV WITHOUT PRINTING SECRETS
# ------------------------------------------------------------

section "6. BACKEND ENVIRONMENT AUDIT"

ENV_FILE="$BACKEND/.env"

[[ -f "$ENV_FILE" ]] || fail "backend/.env does not exist."

REQUIRED_BACKEND_KEYS=(
    "ALLOWED_ORIGINS"
    "DATA_GOV_API_KEY"
    "WEATHER_API_KEY"
    "GROQ_API_KEY"
    "GEMINI_API_KEY"
    "CEREBRAS_API_KEY"
    "HF_API_TOKEN"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_SERVICE_ACCOUNT_PATH"
)

for key in "${REQUIRED_BACKEND_KEYS[@]}"; do
    if grep -qE "^${key}=" "$ENV_FILE"; then
        value="$(
            sed -n "s/^${key}=//p" "$ENV_FILE" | head -1
        )"

        if [[ -n "$value" && "$value" != "your_"* ]]; then
            pass "$key exists"
        else
            warn "$key exists but appears empty/placeholder"
        fi
    else
        warn "$key is missing from backend/.env"
    fi
done

# ------------------------------------------------------------
# 7. FORCE CORRECT LOCAL ALLOWED_ORIGINS
# ------------------------------------------------------------

section "7. ALLOWED_ORIGINS"

"$PYTHON_BIN" - "$ENV_FILE" "$FRONTEND_URL" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
frontend = sys.argv[2]

lines = path.read_text().splitlines()

new_value = (
    f"ALLOWED_ORIGINS="
    f"{frontend},"
    f"https://www.agrisaathi.com,"
    f"http://localhost:5173,"
    f"http://localhost:3000"
)

found = False
out = []

for line in lines:
    if line.startswith("ALLOWED_ORIGINS="):
        out.append(new_value)
        found = True
    else:
        out.append(line)

if not found:
    out.insert(0, new_value)

path.write_text("\n".join(out) + "\n")
PY

echo "Configured ALLOWED_ORIGINS:"
grep '^ALLOWED_ORIGINS=' "$ENV_FILE" | sed \
    's/,/\n  /g' | sed '1s/^/  /'

pass "ALLOWED_ORIGINS contains production frontend."

# ------------------------------------------------------------
# 8. VERIFY SETTINGS LOAD
# ------------------------------------------------------------

section "8. BACKEND SETTINGS LOAD"

"$PYTHON_BIN" - "$BACKEND" <<'PY'
import os
import sys

backend = sys.argv[1]
sys.path.insert(0, backend)

try:
    from app.core.config import settings
except Exception as e:
    print("Could not import app.core.config.settings")
    print(type(e).__name__, str(e))
    raise

checks = [
    ("data_gov_api_key", "DATA_GOV_API_KEY"),
    ("weather_api_key", "WEATHER_API_KEY"),
    ("groq_api_key", "GROQ_API_KEY"),
    ("gemini_api_key", "GEMINI_API_KEY"),
    ("cerebras_api_key", "CEREBRAS_API_KEY"),
    ("hf_api_token", "HF_API_TOKEN"),
]

for attr, env_name in checks:
    value = getattr(settings, attr, None)
    print(
        f"{env_name}: "
        + ("CONFIGURED" if value else "MISSING")
    )

origins = getattr(settings, "allowed_origins", None)

print("allowed_origins:", origins)
PY

# ------------------------------------------------------------
# 9. VERCEL CLI
# ------------------------------------------------------------

section "9. VERCEL CLI"

command -v vercel >/dev/null 2>&1 \
    || fail "Vercel CLI is not installed. Run: npm install -g vercel"

vercel --version

# ------------------------------------------------------------
# 10. LINKED BACKEND PROJECT
# ------------------------------------------------------------

section "10. BACKEND VERCEL PROJECT"

cd "$BACKEND"

if [[ ! -d ".vercel" ]]; then
    warn "Backend is not linked locally."
    echo
    echo "Run this manually first:"
    echo "  vercel link"
    echo
    fail "Backend Vercel project must be linked before automated env synchronization."
fi

pass "Backend Vercel project is linked."

# ------------------------------------------------------------
# 11. VERCEL ENVIRONMENT AUDIT
# ------------------------------------------------------------

section "11. VERCEL PRODUCTION ENVIRONMENT"

echo "Production variables currently configured:"
vercel env ls production || true

# ------------------------------------------------------------
# 12. COPY SAFE BACKEND ENV VARIABLES TO VERCEL
# ------------------------------------------------------------

section "12. SYNC BACKEND ENVIRONMENT VARIABLES"

sync_env_var() {
    local name="$1"

    local value

    value="$(
        python3 - "$ENV_FILE" "$name" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
wanted = sys.argv[2]

for line in path.read_text().splitlines():
    if line.startswith(wanted + "="):
        print(line.split("=", 1)[1])
        raise SystemExit(0)

raise SystemExit(2)
PY
    )"

    if [[ -z "$value" ]]; then
        warn "$name missing/empty locally; skipping."
        return 0
    fi

    printf '%s' "$value" | \
        vercel env add "$name" production --force --sensitive

    pass "$name -> Vercel Production"
}

# CORS is not a secret, so don't mark it sensitive.
ALLOWED_VALUE="$(
    sed -n 's/^ALLOWED_ORIGINS=//p' "$ENV_FILE" | head -1
)"

if [[ -n "$ALLOWED_VALUE" ]]; then
    printf '%s' "$ALLOWED_VALUE" | \
        vercel env add ALLOWED_ORIGINS production --force

    pass "ALLOWED_ORIGINS -> Vercel Production"
fi

for key in \
    DATA_GOV_API_KEY \
    WEATHER_API_KEY \
    GROQ_API_KEY \
    GEMINI_API_KEY \
    CEREBRAS_API_KEY \
    HF_API_TOKEN \
    FIREBASE_PROJECT_ID \
    GROQ_VLM_MODEL \
    HF_CONFIDENCE_THRESHOLD \
    HF_DISEASE_MODEL
do
    sync_env_var "$key"
done

# ------------------------------------------------------------
# 13. FIREBASE PATH WARNING
# ------------------------------------------------------------

section "13. FIREBASE DEPLOYMENT CHECK"

FIREBASE_PATH="$(
    sed -n 's/^FIREBASE_SERVICE_ACCOUNT_PATH=//p' "$ENV_FILE" | head -1
)"

if [[ -n "$FIREBASE_PATH" ]]; then
    echo "Local FIREBASE_SERVICE_ACCOUNT_PATH:"
    echo "  $FIREBASE_PATH"

    if [[ "$FIREBASE_PATH" == /* ]]; then
        warn "This is an absolute local filesystem path."
        warn "That path will NOT exist inside Vercel."
        warn "Firebase features requiring this file need a Vercel-compatible credential configuration."
    fi
fi

# Do NOT upload a service-account JSON automatically.
# Do NOT expose Firebase private keys.
# Do NOT put secrets in frontend VITE_* variables.

# ------------------------------------------------------------
# 14. BACKEND PYTHON COMPILE CHECK
# ------------------------------------------------------------

section "14. BACKEND COMPILE CHECK"

cd "$BACKEND"

"$PYTHON_BIN" -m compileall -q app api \
    || fail "Backend Python compilation failed."

pass "Backend Python compilation passed."

# ------------------------------------------------------------
# 15. LOCAL FASTAPI APP CHECK
# ------------------------------------------------------------

section "15. LOCAL FASTAPI APP CHECK"

"$PYTHON_BIN" - <<'PY'
import sys

sys.path.insert(0, ".")

try:
    from app.main import app
except Exception as e:
    print("ERROR importing app.main:")
    print(type(e).__name__, str(e))
    raise

print("FastAPI application imported.")
print("Route count:", len(app.routes))

paths = sorted(
    {
        getattr(route, "path", "")
        for route in app.routes
        if getattr(route, "path", None)
    }
)

for required in [
    "/api/livestock-types",
    "/api/livestock/encyclopedia/categories",
]:
    if required in paths:
        print(required, "PASS")
    else:
        print(required, "NOT FOUND")

print("CORS middleware:")
for middleware in getattr(app, "user_middleware", []):
    print(" ", middleware.cls)
PY

# ------------------------------------------------------------
# 16. DEPLOY BACKEND
# ------------------------------------------------------------

section "16. DEPLOY BACKEND TO VERCEL"

cd "$BACKEND"

vercel --prod

pass "Backend production deployment command completed."

# ------------------------------------------------------------
# 17. TEST BACKEND ROOT / HEALTH
# ------------------------------------------------------------

section "17. PRODUCTION BACKEND HEALTH"

test_url() {
    local label="$1"
    local url="$2"

    echo
    echo "---- $label ----"
    echo "$url"

    status="$(
        curl -L -sS \
            --max-time 30 \
            -o /tmp/agrisaathi_response.txt \
            -w '%{http_code}' \
            "$url" || true
    )"

    echo "HTTP: $status"

    if [[ "$status" == "000" ]]; then
        warn "$label could not be reached."
        return 1
    fi

    if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
        pass "$label"
        return 0
    fi

    warn "$label returned HTTP $status"
    head -c 1000 /tmp/agrisaathi_response.txt || true
    echo

    return 1
}

BACKEND_HEALTH_OK=0

if test_url "Backend root" "$BACKEND_URL/"; then
    BACKEND_HEALTH_OK=1
fi

if [[ "$BACKEND_HEALTH_OK" != "1" ]]; then
    warn "Backend root did not return a successful response."
    echo
    echo "Check Vercel production logs:"
    echo "  cd $BACKEND"
    echo "  vercel logs --level error"
    fail "Stopping before frontend deployment because backend is unhealthy."
fi

# ------------------------------------------------------------
# 18. CORS PREFLIGHT TEST
# ------------------------------------------------------------

section "18. PRODUCTION CORS TEST"

CORS_HEADERS="$(
    curl -i -L -sS \
        --max-time 30 \
        -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: content-type" \
        "$BACKEND_URL/api/livestock-types" \
        || true
)"

echo "$CORS_HEADERS" | sed -n '1,30p'

if echo "$CORS_HEADERS" | grep -qi \
    "access-control-allow-origin: $FRONTEND_URL"; then
    pass "Production CORS allows frontend origin."
else
    warn "Production response still does not expose the expected CORS header."
    echo
    echo "This usually means the deployed FastAPI application is not the app/main.py being modified,"
    echo "or Vercel is failing before FastAPI middleware executes."
fi

# ------------------------------------------------------------
# 19. LIVE API TESTS
# ------------------------------------------------------------

section "19. LIVE API TESTS"

LIVE_FAILURES=0

api_test() {
    local label="$1"
    local url="$2"

    echo
    echo "---- $label ----"
    echo "$url"

    status="$(
        curl -L -sS \
            --max-time 45 \
            -H "Origin: $FRONTEND_URL" \
            -o /tmp/agrisaathi_api_response.txt \
            -w '%{http_code}' \
            "$url" || true
    )"

    echo "HTTP: $status"

    head -c 700 /tmp/agrisaathi_api_response.txt || true
    echo

    if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
        pass "$label"
    else
        warn "$label failed"
        LIVE_FAILURES=$((LIVE_FAILURES + 1))
    fi
}

api_test \
    "Livestock types" \
    "$BACKEND_URL/api/livestock-types"

api_test \
    "Animal encyclopedia categories" \
    "$BACKEND_URL/api/livestock/encyclopedia/categories"

api_test \
    "Data.gov resources" \
    "$BACKEND_URL/api/data-gov/resources"

# ------------------------------------------------------------
# 20. VERIFY 72 RESOURCES LIVE
# ------------------------------------------------------------

section "20. VERIFY 72 RESOURCES LIVE"

LIVE_RESOURCE_COUNT="$(
curl -L -sS \
    --max-time 45 \
    -H "Origin: $FRONTEND_URL" \
    "$BACKEND_URL/api/data-gov/resources" \
    | "$PYTHON_BIN" -c '
import json
import sys

try:
    data = json.load(sys.stdin)
    print(data.get("count", len(data.get("resources", []))))
except Exception:
    print("0")
'
)"

echo "Production Data.gov resource count: $LIVE_RESOURCE_COUNT"

if [[ "$LIVE_RESOURCE_COUNT" == "72" ]]; then
    pass "Production backend exposes all 72 resources."
else
    warn "Production backend does not currently report 72 resources."
    LIVE_FAILURES=$((LIVE_FAILURES + 1))
fi

# ------------------------------------------------------------
# 21. FRONTEND ENVIRONMENT
# ------------------------------------------------------------

section "21. FRONTEND PRODUCTION API URL"

cd "$FRONTEND"

FRONTEND_ENV_PROD="$FRONTEND/.env.production.local"

touch "$FRONTEND_ENV_PROD"

if grep -q '^VITE_API_URL=' "$FRONTEND_ENV_PROD"; then
    sed -i '' \
        "s#^VITE_API_URL=.*#VITE_API_URL=$BACKEND_URL#" \
        "$FRONTEND_ENV_PROD"
else
    printf '\nVITE_API_URL=%s\n' "$BACKEND_URL" >> "$FRONTEND_ENV_PROD"
fi

echo "Production frontend API URL:"
grep '^VITE_API_URL=' "$FRONTEND_ENV_PROD"

# ------------------------------------------------------------
# 22. FRONTEND BUILD
# ------------------------------------------------------------

section "22. FRONTEND PRODUCTION BUILD"

cd "$FRONTEND"

npm install

VITE_API_URL="$BACKEND_URL" npm run build

pass "Frontend production build succeeded."

# ------------------------------------------------------------
# 23. FRONTEND VERCEL PROJECT
# ------------------------------------------------------------

section "23. FRONTEND VERCEL PROJECT"

if [[ ! -d ".vercel" ]]; then
    warn "Frontend is not linked to Vercel."
    echo
    echo "Run:"
    echo "  cd $FRONTEND"
    echo "  vercel link"
    echo
    fail "Frontend Vercel project must be linked before automated production env synchronization."
fi

pass "Frontend Vercel project is linked."

# ------------------------------------------------------------
# 24. FRONTEND VERCEL ENV
# ------------------------------------------------------------

section "24. FRONTEND VERCEL ENVIRONMENT"

printf '%s' "$BACKEND_URL" | \
    vercel env add VITE_API_URL production --force

pass "Frontend VITE_API_URL configured for Production."

# ------------------------------------------------------------
# 25. DEPLOY FRONTEND
# ------------------------------------------------------------

section "25. DEPLOY FRONTEND"

cd "$FRONTEND"

vercel --prod

pass "Frontend production deployment completed."

# ------------------------------------------------------------
# 26. FINAL LIVE CHECKS
# ------------------------------------------------------------

section "26. FINAL PRODUCTION VERIFICATION"

echo
echo "Frontend:"
echo "  $FRONTEND_URL"

echo
echo "Backend:"
echo "  $BACKEND_URL"

echo
echo "Expected frontend API:"
echo "  $BACKEND_URL"

echo

if [[ "$LIVE_FAILURES" -gt 0 ]]; then
    warn "$LIVE_FAILURES API verification test(s) reported failure."
else
    pass "All live API verification tests passed."
fi

echo
echo "============================================================"
echo " AGRISAATHI DEPLOYMENT REPAIR COMPLETE"
echo "============================================================"

echo
echo "Next browser test:"
echo "  $FRONTEND_URL"

echo
echo "If browser still reports CORS, immediately run:"
echo
echo "  cd $BACKEND"
echo "  vercel logs --level error"
echo
echo "Do NOT change the frontend API URL again unless the final"
echo "production URL above changes."

echo
echo "Backup:"
echo "  $BACKUP"

