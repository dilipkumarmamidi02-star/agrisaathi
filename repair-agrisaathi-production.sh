#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
BACKEND_URL="https://agrisaathi-backend.vercel.app"
FRONTEND_URL="https://agrisaathi-ashy.vercel.app"

echo
echo "============================================================"
echo " AGRISAATHI — PRODUCTION BACKEND REPAIR"
echo "============================================================"
echo
echo "Root:"
echo "  $ROOT"
echo
echo "Backend:"
echo "  $BACKEND"
echo
echo "Frontend:"
echo "  $FRONTEND"
echo

fail() {
    echo
    echo "ERROR: $1"
    echo
    exit 1
}

trap 'echo; echo "ERROR: repair script stopped at line $LINENO"; exit 1' ERR

[[ -d "$BACKEND" ]] || fail "Backend directory not found."
[[ -d "$FRONTEND" ]] || fail "Frontend directory not found."

cd "$ROOT"

echo "============================================================"
echo " 1. REPOSITORY SAFETY"
echo "============================================================"

git rev-parse --show-toplevel >/dev/null 2>&1 \
    || fail "Not inside a Git repository."

echo "PASS: Existing Git repository detected."

git branch --show-current
git rev-parse --short HEAD

echo
echo "============================================================"
echo " 2. PYTHON ENVIRONMENT"
echo "============================================================"

if [[ -x "$BACKEND/venv/bin/python" ]]; then
    PYTHON="$BACKEND/venv/bin/python"
else
    PYTHON="$(command -v python3 || true)"
fi

[[ -n "$PYTHON" ]] || fail "Python 3 was not found."

echo "Python:"
echo "  $PYTHON"

"$PYTHON" --version

echo
echo "============================================================"
echo " 3. BACKUP EXISTING BACKEND FILES"
echo "============================================================"

BACKUP="$ROOT/backend-production-repair-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"

cp -a "$BACKEND/app" "$BACKUP/app"

if [[ -f "$BACKEND/api/index.py" ]]; then
    mkdir -p "$BACKUP/api"
    cp "$BACKEND/api/index.py" "$BACKUP/api/index.py"
fi

if [[ -f "$BACKEND/vercel.json" ]]; then
    cp "$BACKEND/vercel.json" "$BACKUP/vercel.json"
fi

if [[ -f "$BACKEND/requirements.txt" ]]; then
    cp "$BACKEND/requirements.txt" "$BACKUP/requirements.txt"
fi

echo "PASS: Backup created:"
echo "  $BACKUP"

echo
echo "============================================================"
echo " 4. DEPENDENCY CHECK"
echo "============================================================"

REQ="$BACKEND/requirements.txt"

[[ -f "$REQ" ]] || fail "backend/requirements.txt not found."

grep -Eq '^filelock([<>=!~]|$)' "$REQ" \
    || echo "filelock==3.32.3" >> "$REQ"

grep -Eq '^uvicorn([<>=!~]|$)' "$REQ" \
    || echo "uvicorn>=0.34,<1" >> "$REQ"

echo "PASS: Runtime dependencies declared."

"$PYTHON" -m pip install -q -r "$REQ"

echo "PASS: Backend requirements installed locally."

echo
echo "============================================================"
echo " 5. REPAIR VERCEL PYTHON ENTRYPOINT"
echo "============================================================"

mkdir -p "$BACKEND/api"

cat > "$BACKEND/api/index.py" <<'PYTHON'
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: F401
PYTHON

echo "PASS: backend/api/index.py now exposes existing app.main:app."

echo
echo "============================================================"
echo " 6. REMOVE LEGACY VERCEL BUILDS CONFIG"
echo "============================================================"

cat > "$BACKEND/vercel.json" <<'JSON'
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.py"
    }
  ]
}
JSON

echo "PASS: backend/vercel.json now uses the existing FastAPI entrypoint."
echo
echo "IMPORTANT:"
echo "  This does NOT create a second application."
echo "  All requests continue to the existing FastAPI app."

echo
echo "============================================================"
echo " 7. REPAIR MISSING EXISTING FASTAPI ROUTERS"
echo "============================================================"

MAIN="$BACKEND/app/main.py"

[[ -f "$MAIN" ]] || fail "backend/app/main.py not found."

MAIN_PATH="$MAIN" BACKEND_PATH="$BACKEND" "$PYTHON" <<'PYTHON'
import importlib
import os
import re
from pathlib import Path

main_path = Path(os.environ["MAIN_PATH"])
backend_path = Path(os.environ["BACKEND_PATH"])

text = main_path.read_text(encoding="utf-8")

# Find the existing route-module import.
match = re.search(
    r"from\s+app\.api\.routes\s+import\s+([^\n]+)",
    text
)

if not match:
    raise SystemExit(
        "ERROR: Could not find existing 'from app.api.routes import ...' line."
    )

modules = [
    item.strip()
    for item in match.group(1).split(",")
    if item.strip()
]

missing = []

for module_name in modules:
    try:
        module = importlib.import_module(
            f"app.api.routes.{module_name}"
        )
    except Exception as exc:
        print(
            f"WARNING: Could not import route module "
            f"{module_name}: {exc}"
        )
        continue

    if not hasattr(module, "router"):
        continue

    include_pattern = (
        rf"app\.include_router\(\s*"
        rf"{re.escape(module_name)}\.router"
    )

    if not re.search(include_pattern, text):
        missing.append(module_name)

if missing:
    with main_path.open("a", encoding="utf-8") as f:
        f.write("\n\n# Existing route modules repaired by production validator.\n")
        for module_name in missing:
            f.write(
                f"app.include_router({module_name}.router)\n"
            )

    print("Added missing existing routers:")
    for module_name in missing:
        print(f"  {module_name}.router")
else:
    print("No missing existing routers detected.")

print("Route wiring repair complete.")
PYTHON

echo
echo "============================================================"
echo " 8. PYTHON COMPILE CHECK"
echo "============================================================"

"$PYTHON" -m compileall -q "$BACKEND/app" "$BACKEND/api"

echo "PASS: Python compilation succeeded."

echo
echo "============================================================"
echo " 9. AUTHORITATIVE 72 RESOURCE VALIDATION"
echo "============================================================"

PYTHONPATH="$BACKEND" "$PYTHON" <<'PYTHON'
from app.core.datagov_registry import (
    DATAGOV_REGISTRY,
    RESOURCE_BY_KEY,
    RESOURCE_BY_ID,
    LIVESTOCK_RESOURCE_KEYS,
    validate_registry,
)

validate_registry()

assert isinstance(DATAGOV_REGISTRY, list)
assert len(DATAGOV_REGISTRY) == 72
assert len(RESOURCE_BY_KEY) == 72
assert len(RESOURCE_BY_ID) == 72
assert len(LIVESTOCK_RESOURCE_KEYS) == 35

ids = [r["id"] for r in DATAGOV_REGISTRY]

assert ids == list(range(1, 73))
assert len({r["resource_id"] for r in DATAGOV_REGISTRY}) == 72
assert len({r["resource_key"] for r in DATAGOV_REGISTRY}) == 72

r26 = next(r for r in DATAGOV_REGISTRY if r["id"] == 26)

assert r26["resource_id"] == (
    "cef25fe2-9231-4128-8aec-2c948fedd43f"
)

assert r26["primary_feature"] == "Speak to AgriSaathi"

livestock = [
    r for r in DATAGOV_REGISTRY
    if 34 <= r["id"] <= 68
]

assert len(livestock) == 35

print("Resource count      : 72")
print("Resource IDs        : 1-72 PASS")
print("Unique resource IDs : PASS")
print("Unique resource keys: PASS")
print("Resource #26 KCC    : PASS")
print("Livestock 34-68     : 35 PASS")
print()
print("PASS: AUTHORITATIVE DATA.GOV.IN REGISTRY VALID.")
PYTHON

echo
echo "============================================================"
echo " 10. FASTAPI IMPORT + REAL ROUTE VALIDATION"
echo "============================================================"

PYTHONPATH="$BACKEND" "$PYTHON" <<'PYTHON'
from app.main import app
from fastapi.routing import APIRoute

routes = []

for route in app.routes:
    if isinstance(route, APIRoute):
        for method in sorted(route.methods or []):
            routes.append((method, route.path))

print(f"FastAPI application imported successfully.")
print(f"APIRoute count: {len(routes)}")

required = {
    ("GET", "/health"),
    ("GET", "/api/livestock-types"),
    ("GET", "/api/livestock/encyclopedia/categories"),
    ("GET", "/api/weather/current"),
    ("GET", "/api/gov-markets"),
    ("GET", "/api/kvk"),
    ("GET", "/api/schemes"),
    ("GET", "/api/data-gov/resources"),
}

available = set(routes)

print()
print("Required route validation:")

missing = []

for item in sorted(required):
    if item in available:
        print(f"  PASS {item[0]:6} {item[1]}")
    else:
        print(f"  FAIL {item[0]:6} {item[1]}")
        missing.append(item)

if missing:
    print()
    print("Missing routes:")
    for method, path in missing:
        print(f"  {method} {path}")
    raise SystemExit(10)

print()
print("PASS: Required FastAPI routes are registered.")

cors = any(
    "CORSMiddleware" in type(m).__name__
    for m in getattr(app, "user_middleware", [])
)

print(f"CORS middleware configured: {cors}")

if not cors:
    raise SystemExit("ERROR: CORSMiddleware is not configured.")
PYTHON

echo
echo "============================================================"
echo " 11. LOCAL BACKEND HTTP TEST"
echo "============================================================"

PORT=8010

if lsof -ti :"$PORT" >/dev/null 2>&1; then
    kill "$(lsof -ti :"$PORT")" || true
    sleep 1
fi

cd "$BACKEND"

PYTHONPATH="$BACKEND" "$PYTHON" -m uvicorn \
    app.main:app \
    --host 127.0.0.1 \
    --port "$PORT" \
    > "$BACKUP/local-uvicorn.log" 2>&1 &

UVICORN_PID=$!

cleanup() {
    kill "$UVICORN_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "Waiting for local FastAPI..."

for i in {1..30}; do
    if curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
        break
    fi

    if ! kill -0 "$UVICORN_PID" >/dev/null 2>&1; then
        echo
        cat "$BACKUP/local-uvicorn.log"
        fail "Local FastAPI process crashed."
    fi

    sleep 1
done

curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null \
    || {
        cat "$BACKUP/local-uvicorn.log"
        fail "Local /health failed."
    }

curl -fsS \
    "http://127.0.0.1:$PORT/api/livestock-types" \
    >/dev/null \
    || fail "Local /api/livestock-types failed."

curl -fsS \
    "http://127.0.0.1:$PORT/api/livestock/encyclopedia/categories" \
    >/dev/null \
    || fail "Local livestock encyclopedia categories failed."

curl -fsS \
    "http://127.0.0.1:$PORT/api/data-gov/resources" \
    >/dev/null \
    || fail "Local Data.gov registry endpoint failed."

echo "PASS: Local FastAPI HTTP tests succeeded."

cleanup
trap - EXIT

echo
echo "============================================================"
echo " 12. VERCEL AUTHENTICATION"
echo "============================================================"

command -v vercel >/dev/null 2>&1 \
    || fail "Vercel CLI not found."

echo "Vercel:"
vercel --version

vercel whoami >/dev/null 2>&1 \
    || fail "Vercel CLI is not authenticated. Run: vercel login"

echo "PASS: Vercel CLI authenticated."

echo
echo "============================================================"
echo " 13. VERCEL PRODUCTION ENVIRONMENT"
echo "============================================================"

cd "$BACKEND"

echo "Production environment variables currently configured:"
vercel env ls production || true

echo
echo "Synchronizing backend production variables."
echo "Values are NOT printed."

ENV_FILE="$BACKEND/.env"

[[ -f "$ENV_FILE" ]] \
    || fail "backend/.env not found. Cannot safely synchronize production keys."

ENV_FILE="$ENV_FILE" BACKEND_PATH="$BACKEND" "$PYTHON" <<'PYTHON'
import os
import subprocess
from pathlib import Path

env_file = Path(os.environ["ENV_FILE"])
backend = Path(os.environ["BACKEND_PATH"])

try:
    from dotenv import dotenv_values
    values = {
        k: v
        for k, v in dotenv_values(env_file).items()
        if k and v is not None
    }
except Exception:
    values = {}

if not values:
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()

        if not line or line.startswith("#"):
            continue

        if line.startswith("export "):
            line = line[7:].strip()

        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if (
            len(value) >= 2
            and value[0] == value[-1]
            and value[0] in {"'", '"'}
        ):
            value = value[1:-1]

        values[key] = value

required_secret_keys = [
    "GROQ_API_KEY",
    "GEMINI_API_KEY",
    "CEREBRAS_API_KEY",
    "DATA_GOV_API_KEY",
    "WEATHER_API_KEY",
    "HF_API_TOKEN",
]

optional_runtime_keys = [
    "HF_CONFIDENCE_THRESHOLD",
    "HF_DISEASE_MODEL",
    "GROQ_VLM_MODEL",
    "FIREBASE_PROJECT_ID",
    "ENVIRONMENT",
]

def is_bad(value):
    if value is None:
        return True

    v = str(value).strip().lower()

    return (
        not v
        or v in {
            "your_key_here",
            "your-api-key",
            "changeme",
            "replace_me",
            "xxx",
        }
        or "your_" in v
        or "replace_" in v
    )

missing = [
    key for key in required_secret_keys
    if is_bad(values.get(key))
]

if missing:
    raise SystemExit(
        "Missing/placeholder local credentials: "
        + ", ".join(missing)
    )

# Production CORS is deliberately explicit.
production_origins = (
    "https://agrisaathi-ashy.vercel.app,"
    "https://agrisaathi.vercel.app,"
    "http://localhost:5173,"
    "http://localhost:3000"
)

values["ALLOWED_ORIGINS"] = production_origins

secret_keys = set(required_secret_keys + [
    "FIREBASE_PROJECT_ID",
])

keys_to_sync = (
    required_secret_keys
    + optional_runtime_keys
    + ["ALLOWED_ORIGINS"]
)

for key in keys_to_sync:
    value = values.get(key)

    if value is None:
        continue

    if is_bad(value):
        continue

    command = [
        "vercel",
        "env",
        "add",
        key,
        "production",
        "--value",
        str(value),
        "--force",
    ]

    if key in secret_keys:
        command.append("--sensitive")

    result = subprocess.run(
        command,
        cwd=backend,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )

    if result.returncode != 0:
        raise SystemExit(
            f"Failed to synchronize Vercel variable {key}.\n"
            f"{result.stderr.strip()}"
        )

    print(f"  PASS {key}")

print()
print("Production environment synchronization completed.")

firebase_path = values.get("FIREBASE_SERVICE_ACCOUNT_PATH")

if firebase_path:
    print()
    print("WARNING:")
    print("  FIREBASE_SERVICE_ACCOUNT_PATH was intentionally NOT uploaded.")
    print("  A Mac/local filesystem path is not valid inside Vercel.")
    print("  Firebase endpoints that require a service-account file")
    print("  need a Vercel-compatible credential implementation.")
PYTHON

echo
echo "============================================================"
echo " 14. PULL PRODUCTION SETTINGS INTO LOCAL VERCEL STATE"
echo "============================================================"

vercel pull --yes --environment=production

echo "PASS: Production Vercel settings pulled."

echo
echo "============================================================"
echo " 15. VERCEL BUILD CHECK"
echo "============================================================"

vercel build --prod --yes

echo "PASS: Vercel production build completed locally."

echo
echo "============================================================"
echo " 16. DEPLOY BACKEND TO PRODUCTION"
echo "============================================================"

DEPLOY_LOG="$BACKUP/vercel-deploy.log"

if ! vercel deploy --prod --logs 2>&1 | tee "$DEPLOY_LOG"; then
    echo
    echo "Vercel deployment failed."
    echo
    echo "Recent production errors:"
    vercel logs \
        --environment production \
        --level error \
        --since 10m \
        2>/dev/null || true

    fail "Backend production deployment failed."
fi

echo
echo "PASS: Backend production deployment completed."

echo
echo "============================================================"
echo " 17. PRODUCTION HEALTH"
echo "============================================================"

check_url() {
    local name="$1"
    local url="$2"

    echo
    echo "---- $name ----"
    echo "$url"

    HTTP_CODE="$(
        curl \
            -sS \
            -o "$BACKUP/response.tmp" \
            -w "%{http_code}" \
            "$url" \
            || true
    )"

    echo "HTTP: $HTTP_CODE"

    if [[ "$HTTP_CODE" != "200" ]]; then
        echo
        cat "$BACKUP/response.tmp" 2>/dev/null || true
        return 1
    fi

    return 0
}

check_url \
    "Backend health" \
    "$BACKEND_URL/health" \
    || {
        echo
        echo "Production runtime errors:"
        vercel logs \
            --environment production \
            --level error \
            --since 10m \
            2>/dev/null || true

        fail "Backend /health is not healthy."
    }

check_url \
    "Livestock types" \
    "$BACKEND_URL/api/livestock-types" \
    || fail "Livestock types API failed."

check_url \
    "Livestock encyclopedia categories" \
    "$BACKEND_URL/api/livestock/encyclopedia/categories" \
    || fail "Livestock encyclopedia API failed."

check_url \
    "Government markets" \
    "$BACKEND_URL/api/gov-markets" \
    || fail "Government markets API failed."

check_url \
    "KVK" \
    "$BACKEND_URL/api/kvk" \
    || fail "KVK API failed."

check_url \
    "Government schemes" \
    "$BACKEND_URL/api/schemes" \
    || fail "Government schemes API failed."

check_url \
    "Data.gov registry" \
    "$BACKEND_URL/api/data-gov/resources" \
    || fail "Data.gov registry API failed."

echo
echo "============================================================"
echo " 18. PRODUCTION CORS CHECK"
echo "============================================================"

CORS_HEADERS="$(
    curl \
        -sS \
        -D - \
        -o /dev/null \
        -H "Origin: $FRONTEND_URL" \
        "$BACKEND_URL/health"
)"

echo "$CORS_HEADERS" | grep -i \
    "access-control-allow-origin: $FRONTEND_URL" \
    >/dev/null \
    || {
        echo
        echo "CORS headers returned:"
        echo "$CORS_HEADERS"
        fail "Production CORS does not allow $FRONTEND_URL."
    }

echo "PASS: Production CORS allows:"
echo "  $FRONTEND_URL"

echo
echo "============================================================"
echo " 19. PRODUCTION PREFLIGHT CHECK"
echo "============================================================"

PREFLIGHT_CODE="$(
    curl \
        -sS \
        -o "$BACKUP/preflight.tmp" \
        -w "%{http_code}" \
        -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: content-type,authorization" \
        "$BACKEND_URL/api/livestock-types" \
        || true
)"

echo "OPTIONS HTTP: $PREFLIGHT_CODE"

if [[ "$PREFLIGHT_CODE" != "200" && "$PREFLIGHT_CODE" != "204" ]]; then
    cat "$BACKUP/preflight.tmp" 2>/dev/null || true
    fail "CORS preflight failed."
fi

echo "PASS: CORS preflight succeeded."

echo
echo "============================================================"
echo " 20. FINAL PRODUCTION ERROR SCAN"
echo "============================================================"

ERROR_LOG="$BACKUP/production-errors.log"

vercel logs \
    --environment production \
    --level error \
    --since 10m \
    > "$ERROR_LOG" 2>&1 || true

if grep -Eq \
    "FUNCTION_INVOCATION_FAILED|Traceback|ImportError|ModuleNotFoundError|KeyError|TypeError" \
    "$ERROR_LOG"; then

    echo
    echo "WARNING: Recent production error logs contain runtime errors:"
    cat "$ERROR_LOG"

    fail "Production error scan failed."
fi

echo "PASS: No recent fatal backend runtime errors detected."

echo
echo "============================================================"
echo " AGRISAATHI BACKEND REPAIR COMPLETE"
echo "============================================================"
echo
echo "Backend:"
echo "  $BACKEND_URL"
echo
echo "Frontend:"
echo "  $FRONTEND_URL"
echo
echo "Validated:"
echo "  72 Data.gov resources"
echo "  FastAPI import"
echo "  Existing route wiring"
echo "  /health"
echo "  livestock-types"
echo "  livestock encyclopedia"
echo "  government markets"
echo "  KVK"
echo "  government schemes"
echo "  Data.gov registry"
echo "  CORS"
echo "  CORS preflight"
echo "  Vercel production runtime"
echo
echo "Backup:"
echo "  $BACKUP"
echo
echo "IMPORTANT:"
echo "  Frontend deployment was intentionally NOT changed."
echo "  Existing AgriSaathi application was repaired in place."
echo
