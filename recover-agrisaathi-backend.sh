#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
PYTHON="$BACKEND/venv/bin/python"

echo "============================================================"
echo " AGRISAATHI — EXISTING BACKEND FORENSIC RECOVERY"
echo "============================================================"
echo
echo "Root:"
echo "  $ROOT"
echo
echo "Backend:"
echo "  $BACKEND"
echo
echo "Python:"
echo "  $PYTHON"
echo

if [[ ! -d "$ROOT/.git" ]]; then
    echo "ERROR: Git repository not found."
    exit 1
fi

if [[ ! -d "$BACKEND" ]]; then
    echo "ERROR: backend directory not found."
    exit 1
fi

if [[ ! -x "$PYTHON" ]]; then
    echo "ERROR: backend virtualenv Python not found:"
    echo "  $PYTHON"
    exit 1
fi

# ------------------------------------------------------------
# 1. SAFETY BACKUP
# ------------------------------------------------------------

echo "============================================================"
echo " 1. SAFETY BACKUP"
echo "============================================================"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/agrisaathi-forensic-backup-$STAMP"

mkdir -p "$BACKUP"

cp "$BACKEND/app/main.py" "$BACKUP/main.py" 2>/dev/null || true
cp "$BACKEND/api/index.py" "$BACKUP/index.py" 2>/dev/null || true
cp "$BACKEND/vercel.json" "$BACKUP/vercel.json" 2>/dev/null || true

echo "PASS: Backup created:"
echo "  $BACKUP"

# ------------------------------------------------------------
# 2. GIT INFORMATION
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 2. GIT STATE"
echo "============================================================"

echo "Branch:"
git -C "$ROOT" branch --show-current

echo
echo "HEAD:"
git -C "$ROOT" rev-parse --short HEAD

echo
echo "Status:"
git -C "$ROOT" status --short

# ------------------------------------------------------------
# 3. AUTHORITATIVE 72 RESOURCE VALIDATION
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 3. AUTHORITATIVE 72 RESOURCE REGISTRY"
echo "============================================================"

PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
from app.core.datagov_registry import DATAGOV_REGISTRY

assert isinstance(DATAGOV_REGISTRY, list), \
    "DATAGOV_REGISTRY is not a list"

assert len(DATAGOV_REGISTRY) == 72, \
    f"Expected 72 resources, got {len(DATAGOV_REGISTRY)}"

ids = [r["id"] for r in DATAGOV_REGISTRY]
keys = [r["resource_key"] for r in DATAGOV_REGISTRY]
resource_ids = [r["resource_id"] for r in DATAGOV_REGISTRY]

assert ids == list(range(1, 73)), \
    f"Resource IDs are not exactly 1-72: {ids}"

assert len(set(keys)) == 72, \
    "Duplicate resource_key detected"

assert len(set(resource_ids)) == 72, \
    "Duplicate resource_id detected"

r26 = next(r for r in DATAGOV_REGISTRY if r["id"] == 26)

assert r26["resource_id"] == \
    "cef25fe2-9231-4128-8aec-2c948fedd43f"

livestock = [
    r for r in DATAGOV_REGISTRY
    if 34 <= r["id"] <= 68
]

assert len(livestock) == 35

print("Resource count      : 72 PASS")
print("Resource IDs        : 1-72 PASS")
print("Unique resource IDs : PASS")
print("Unique resource keys: PASS")
print("Resource #26 KCC    : PASS")
print("Livestock 34-68     : 35 PASS")
PYTHON

if [[ $? -ne 0 ]]; then
    echo "ERROR: 72-resource registry validation failed."
    exit 1
fi

# ------------------------------------------------------------
# 4. SHOW THE ACTUAL FILE PYTHON WILL LOAD
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 4. PYTHON MODULE IDENTITY"
echo "============================================================"

(
    cd "$BACKEND" || exit 1

    PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
import os
import sys
import fastapi

print("Python executable:")
print(" ", sys.executable)

print()
print("Python cwd:")
print(" ", os.getcwd())

print()
print("PYTHONPATH:")
print(" ", os.environ.get("PYTHONPATH"))

print()
print("FastAPI package:")
print(" ", fastapi.__file__)

import app
import app.main

print()
print("app package:")
print(" ", app.__file__)

print()
print("app.main module:")
print(" ", app.main.__file__)

print()
print("FastAPI application:")
print(" ", app.main.app)

print()
print("Application class:")
print(" ", type(app.main.app))

print()
print("Application module:")
print(" ", type(app.main.app).__module__)
PYTHON
)

# ------------------------------------------------------------
# 5. VERIFY EXISTING ROUTER MODULES
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 5. EXISTING ROUTER MODULE VALIDATION"
echo "============================================================"

(
    cd "$BACKEND" || exit 1

    PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
import importlib

modules = [
    "data_gov",
    "crop",
    "fertilizer",
    "diagnosis",
    "health",
    "weather",
    "helper",
    "ledger",
    "animal_encyclopedia",
    "livestock",
    "crop_planner",
    "crop_passport",
    "livestock_encyclopedia",
    "soil_profiles",
    "kvk",
    "gov_markets",
    "mandi_prices",
    "pest_library",
    "livestock_details",
    "sensor",
    "translate",
    "price_alerts",
    "scheme",
    "livestock_types",
    "soil_records",
]

failed = []

for name in modules:
    module_name = f"app.api.routes.{name}"

    try:
        module = importlib.import_module(module_name)

        if not hasattr(module, "router"):
            print(f"FAIL {module_name}: router missing")
            failed.append(module_name)
            continue

        routes = getattr(module.router, "routes", [])

        print(
            f"PASS {module_name} "
            f"({len(routes)} routes)"
        )

    except Exception as exc:
        print(f"FAIL {module_name}: {exc}")
        failed.append(module_name)

if failed:
    print()
    print("FAILED ROUTER MODULES:")
    for x in failed:
        print(" ", x)

    raise SystemExit(1)

print()
print("PASS: All existing router modules imported.")
PYTHON
)

if [[ $? -ne 0 ]]; then
    echo "ERROR: Existing router module validation failed."
    exit 1
fi

# ------------------------------------------------------------
# 6. VERIFY THE ACTUAL ROUTER TABLE
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 6. EXISTING ROUTER ROUTE TABLE"
echo "============================================================"

(
    cd "$BACKEND" || exit 1

    PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
import importlib

modules = [
    "data_gov",
    "crop",
    "fertilizer",
    "diagnosis",
    "health",
    "weather",
    "helper",
    "ledger",
    "animal_encyclopedia",
    "livestock",
    "crop_planner",
    "crop_passport",
    "livestock_encyclopedia",
    "soil_profiles",
    "kvk",
    "gov_markets",
    "mandi_prices",
    "pest_library",
    "livestock_details",
    "sensor",
    "translate",
    "price_alerts",
    "scheme",
    "livestock_types",
    "soil_records",
]

total = 0

for name in modules:
    module = importlib.import_module(f"app.api.routes.{name}")
    router = module.router

    print()
    print(f"app.api.routes.{name}")
    print("-" * 60)

    for route in router.routes:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None)

        if path is not None:
            method_text = ",".join(sorted(methods or []))
            print(f"  {method_text:<8} {path}")
            total += 1

print()
print(f"TOTAL EXISTING ROUTER ROUTES: {total}")

if total < 40:
    raise SystemExit(
        f"ERROR: Existing routers unexpectedly expose only {total} routes."
    )
PYTHON
)

# ------------------------------------------------------------
# 7. CRITICAL FASTAPI APP MOUNT TEST
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 7. CRITICAL FASTAPI APPLICATION MOUNT TEST"
echo "============================================================"

(
    cd "$BACKEND" || exit 1

    PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
import app.main

application = app.main.app

print("main.py loaded from:")
print(" ", app.main.__file__)

print()
print("Application object:")
print(" ", application)

print()
print("Application routes:")

api_routes = []

for route in application.routes:
    path = getattr(route, "path", None)
    methods = getattr(route, "methods", None)

    if path is not None:
        method_text = ",".join(sorted(methods or []))
        print(f"  {method_text:<8} {path}")

        if path.startswith("/api/") or path == "/health":
            api_routes.append((path, methods or set()))

print()
print("Mounted API route count:", len(api_routes))

required = [
    ("GET", "/health"),
    ("GET", "/api/data-gov/resources"),
    ("GET", "/api/gov-markets"),
    ("GET", "/api/kvk"),
    ("GET", "/api/livestock-types"),
    ("GET", "/api/livestock/encyclopedia/categories"),
    ("GET", "/api/schemes"),
    ("GET", "/api/weather/current"),
]

missing = []

for method, path in required:
    found = False

    for actual_path, methods in api_routes:
        if actual_path == path and method in methods:
            found = True
            break

    if found:
        print(f"PASS {method:<6} {path}")
    else:
        print(f"FAIL {method:<6} {path}")
        missing.append((method, path))

if missing:
    print()
    print("============================================================")
    print(" DIAGNOSTIC: ROUTERS EXIST BUT ARE NOT MOUNTED")
    print("============================================================")

    print()
    print("app.main.py:")
    print(app.main.__file__)

    print()
    print("app object:")
    print(application)

    print()
    print("This is the important failure.")
    print("The router modules contain routes, but the FastAPI")
    print("application object loaded by this Python process does not.")
    print()

    raise SystemExit(10)

print()
print("PASS: Required routes are mounted in the existing FastAPI app.")
PYTHON
)

APP_STATUS=$?

if [[ $APP_STATUS -eq 10 ]]; then
    echo
    echo "============================================================"
    echo " ROUTER MOUNT FAILURE — SAFE REPAIR"
    echo "============================================================"

    echo
    echo "The existing router modules are healthy."
    echo "The existing application is not mounting them."
    echo
    echo "Git version of main.py will be restored."
    echo "No new application will be created."

    git -C "$ROOT" show HEAD:backend/app/main.py > "$BACKEND/app/main.py"

    echo
    echo "PASS: Restored backend/app/main.py from Git HEAD."

    echo
    echo "Re-testing immediately..."

    (
        cd "$BACKEND" || exit 1
        PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
import app.main

print("Loaded:")
print(" ", app.main.__file__)

routes = []

for route in app.main.app.routes:
    path = getattr(route, "path", None)
    methods = getattr(route, "methods", None)

    if path is not None:
        routes.append((path, methods or set()))

print()
print("APIRoute-like routes:", len(routes))

required = [
    ("GET", "/health"),
    ("GET", "/api/data-gov/resources"),
    ("GET", "/api/gov-markets"),
    ("GET", "/api/kvk"),
    ("GET", "/api/livestock-types"),
    ("GET", "/api/livestock/encyclopedia/categories"),
    ("GET", "/api/schemes"),
    ("GET", "/api/weather/current"),
]

missing = [
    f"{method} {path}"
    for method, path in required
    if not any(
        p == path and method in methods
        for p, methods in routes
    )
]

if missing:
    print("MISSING:")
    for item in missing:
        print(" ", item)

    print()
    print("main.py content:")
    print(open("app/main.py", encoding="utf-8").read())

    raise SystemExit(1)

print("PASS: Required routes mounted after Git restoration.")
PYTHON
    )

    if [[ $? -ne 0 ]]; then
        echo
        echo "============================================================"
        echo " FATAL — DO NOT DEPLOY"
        echo "============================================================"
        echo
        echo "The existing router modules are valid, but the FastAPI"
        echo "application object still does not mount them."
        echo
        echo "No deployment was attempted."
        echo
        echo "This prevents another broken Vercel deployment."
        exit 1
    fi

elif [[ $APP_STATUS -ne 0 ]]; then
    echo
    echo "ERROR: FastAPI application validation failed."
    exit 1
fi

# ------------------------------------------------------------
# 8. CORS VALIDATION
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 8. CORS CONFIGURATION"
echo "============================================================"

(
    cd "$BACKEND" || exit 1

    PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
from app.core.config import settings

print("Configured ALLOWED_ORIGINS:")
print(settings.allowed_origins)

origins = [
    x.strip()
    for x in settings.allowed_origins.split(",")
    if x.strip()
]

required_origin = "https://agrisaathi-ashy.vercel.app"

if required_origin in origins:
    print()
    print("PASS: Production frontend origin is configured.")
else:
    print()
    print("WARNING: Production frontend origin is NOT configured:")
    print(" ", required_origin)
    print()
    print("Current origins:")
    for origin in origins:
        print(" ", origin)
PYTHON
)

# ------------------------------------------------------------
# 9. VERCEL ENTRYPOINT VALIDATION
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 9. VERCEL ENTRYPOINT"
echo "============================================================"

if [[ ! -f "$BACKEND/api/index.py" ]]; then
    echo "ERROR: backend/api/index.py does not exist."
    exit 1
fi

echo
echo "backend/api/index.py:"
cat "$BACKEND/api/index.py"

echo

if grep -q "app.main" "$BACKEND/api/index.py"; then
    echo "PASS: Vercel entrypoint references existing app.main."
else
    echo "ERROR: Vercel entrypoint does not reference app.main."
    exit 1
fi

# ------------------------------------------------------------
# 10. LOCAL ASGI ENTRYPOINT TEST
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 10. LOCAL ASGI ENTRYPOINT TEST"
echo "============================================================"

(
    cd "$BACKEND" || exit 1

    PYTHONPATH="$BACKEND" "$PYTHON" - <<'PYTHON'
import importlib.util
import pathlib

path = pathlib.Path("api/index.py").resolve()

spec = importlib.util.spec_from_file_location(
    "agrisaathi_vercel_index",
    path
)

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

if not hasattr(module, "app"):
    raise SystemExit(
        "ERROR: api/index.py does not expose 'app'."
    )

print("PASS: Vercel entrypoint exposes:")
print(" ", module.app)

print()
print("Entrypoint app type:")
print(" ", type(module.app))
PYTHON
)

if [[ $? -ne 0 ]]; then
    echo "ERROR: Vercel ASGI entrypoint test failed."
    exit 1
fi

# ------------------------------------------------------------
# 11. LOCAL HTTP TEST
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 11. LOCAL HTTP HEALTH TEST"
echo "============================================================"

PORT=18765

(
    cd "$BACKEND" || exit 1

    PYTHONPATH="$BACKEND" "$PYTHON" -m uvicorn app.main:app \
        --host 127.0.0.1 \
        --port "$PORT" \
        > "$ROOT/.agrisaathi-local-uvicorn.log" 2>&1
) &

UVICORN_PID=$!

cleanup() {
    kill "$UVICORN_PID" 2>/dev/null || true
}

trap cleanup EXIT

sleep 4

echo "Testing:"
echo "  http://127.0.0.1:$PORT/health"

HEALTH_CODE="$(
    curl -sS \
        -o "$ROOT/.agrisaathi-health-response.txt" \
        -w "%{http_code}" \
        "http://127.0.0.1:$PORT/health" \
        2>/dev/null || true
)"

echo "HTTP: $HEALTH_CODE"

if [[ "$HEALTH_CODE" != "200" ]]; then
    echo
    echo "ERROR: Local FastAPI /health failed."

    echo
    echo "Response:"
    cat "$ROOT/.agrisaathi-health-response.txt" 2>/dev/null || true

    echo
    echo "Uvicorn log:"
    cat "$ROOT/.agrisaathi-local-uvicorn.log" 2>/dev/null || true

    exit 1
fi

echo "PASS: Local /health returned HTTP 200."

# ------------------------------------------------------------
# 12. LOCAL CORS TEST
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 12. LOCAL CORS TEST"
echo "============================================================"

CORS_HEADERS="$(
    curl -sS -D - -o /dev/null \
        -H "Origin: https://agrisaathi-ashy.vercel.app" \
        "http://127.0.0.1:$PORT/health" \
        2>/dev/null || true
)"

echo "$CORS_HEADERS"

if echo "$CORS_HEADERS" | grep -qi \
    "access-control-allow-origin: https://agrisaathi-ashy.vercel.app"; then

    echo
    echo "PASS: CORS allows production frontend."
else
    echo
    echo "WARNING: CORS did not return the expected production origin."
    echo
    echo "Do not deploy until ALLOWED_ORIGINS is corrected."
    exit 1
fi

# ------------------------------------------------------------
# 13. CLEAN TEMP FILES
# ------------------------------------------------------------

rm -f \
    "$ROOT/.agrisaathi-local-uvicorn.log" \
    "$ROOT/.agrisaathi-health-response.txt"

# ------------------------------------------------------------
# 14. GIT DIFF REVIEW
# ------------------------------------------------------------

echo
echo "============================================================"
echo " 13. FINAL DIFF REVIEW"
echo "============================================================"

git -C "$ROOT" diff -- \
    backend/app/main.py \
    backend/api/index.py \
    backend/vercel.json \
    backend/requirements.txt

echo
echo "============================================================"
echo " BACKEND VALIDATION PASSED"
echo "============================================================"
echo
echo "The existing FastAPI application is healthy locally."
echo "The existing routers are mounted."
echo "The required API routes exist."
echo "The Vercel entrypoint exposes the existing app."
echo "Local /health works."
echo "Local production-origin CORS works."
echo
echo "IMPORTANT:"
echo "This script has NOT deployed anything."
echo
echo "Only after this point should you deploy the backend."
echo
echo "Run:"
echo
echo "  cd \"$BACKEND\""
echo "  vercel --prod"
echo
echo "Then test:"
echo
echo "  curl -i https://agrisaathi-backend.vercel.app/health"
echo
echo "Do NOT deploy the frontend until that returns HTTP 200."
echo
