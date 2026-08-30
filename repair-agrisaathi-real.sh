#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
PYTHON="$BACKEND/venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
    PYTHON="$(command -v python3)"
fi

export PYTHONPATH="$BACKEND"

echo "============================================================"
echo " AGRISAATHI — EXISTING FASTAPI ROUTER RECOVERY"
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

if [[ ! -d "$BACKEND/app" ]]; then
    echo "ERROR: Existing backend/app directory not found."
    exit 1
fi

if [[ ! -f "$BACKEND/app/main.py" ]]; then
    echo "ERROR: backend/app/main.py not found."
    exit 1
fi

# ------------------------------------------------------------
# 1. BACKUP
# ------------------------------------------------------------

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/agrisaathi-router-recovery-backup-$STAMP"

mkdir -p "$BACKUP"

cp "$BACKEND/app/main.py" "$BACKUP/main.py"
cp "$BACKEND/api/index.py" "$BACKUP/index.py" 2>/dev/null || true
cp "$BACKEND/vercel.json" "$BACKUP/vercel.json" 2>/dev/null || true

echo "PASS: Backup created:"
echo "  $BACKUP"
echo

# ------------------------------------------------------------
# 2. SHOW CURRENT MAIN.PY
# ------------------------------------------------------------

echo "============================================================"
echo " 2. CURRENT EXISTING MAIN.PY"
echo "============================================================"

sed -n '1,220p' "$BACKEND/app/main.py"

echo

# ------------------------------------------------------------
# 3. AUTHORITATIVE 72 RESOURCE CHECK
# ------------------------------------------------------------

echo "============================================================"
echo " 3. DATA.GOV.IN 72 RESOURCE CHECK"
echo "============================================================"

REGISTRY="$BACKEND/app/core/datagov_registry.py"

if [[ ! -f "$REGISTRY" ]]; then
    echo "ERROR: Registry missing:"
    echo "  $REGISTRY"
    exit 1
fi

REGISTRY="$REGISTRY" "$PYTHON" <<'PY'
import importlib.util
import os
import sys

path = os.environ["REGISTRY"]

spec = importlib.util.spec_from_file_location("datagov_registry", path)

if spec is None or spec.loader is None:
    print("ERROR: Cannot load registry.", file=sys.stderr)
    sys.exit(1)

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

registry = module.DATAGOV_REGISTRY

assert isinstance(registry, list), "DATAGOV_REGISTRY must be a list"
assert len(registry) == 72, f"Expected 72 resources, got {len(registry)}"

ids = [r["id"] for r in registry]
keys = [r["resource_key"] for r in registry]
resource_ids = [r["resource_id"] for r in registry]

assert ids == list(range(1, 73)), "Resource IDs are not exactly 1-72"
assert len(set(keys)) == 72, "Duplicate resource_key detected"
assert len(set(resource_ids)) == 72, "Duplicate resource_id detected"

r26 = next(r for r in registry if r["id"] == 26)

assert r26["resource_id"] == "cef25fe2-9231-4128-8aec-2c948fedd43f"

livestock = [r for r in registry if 34 <= r["id"] <= 68]

assert len(livestock) == 35

print("Resource count      : 72 PASS")
print("Resource IDs        : 1-72 PASS")
print("Unique resource IDs : PASS")
print("Unique resource keys: PASS")
print("Resource #26 KCC    : PASS")
print("Livestock 34-68     : 35 PASS")
PY

echo

# ------------------------------------------------------------
# 4. IMPORT EVERY EXISTING ROUTER
# ------------------------------------------------------------

echo "============================================================"
echo " 4. EXISTING ROUTER IMPORT CHECK"
echo "============================================================"

"$PYTHON" <<'PY'
import importlib

modules = [
    "app.api.routes.data_gov",
    "app.api.routes.crop",
    "app.api.routes.fertilizer",
    "app.api.routes.diagnosis",
    "app.api.routes.health",
    "app.api.routes.weather",
    "app.api.routes.helper",
    "app.api.routes.ledger",
    "app.api.routes.animal_encyclopedia",
    "app.api.routes.livestock",
    "app.api.routes.crop_planner",
    "app.api.routes.crop_passport",
    "app.api.routes.livestock_encyclopedia",
    "app.api.routes.soil_profiles",
    "app.api.routes.kvk",
    "app.api.routes.gov_markets",
    "app.api.routes.mandi_prices",
    "app.api.routes.pest_library",
    "app.api.routes.livestock_details",
    "app.api.routes.sensor",
    "app.api.routes.translate",
    "app.api.routes.price_alerts",
    "app.api.routes.scheme",
    "app.api.routes.livestock_types",
    "app.api.routes.soil_records",
]

failed = []

for name in modules:
    try:
        module = importlib.import_module(name)

        router = getattr(module, "router", None)

        if router is None:
            print(f"FAIL {name}: no router object")
            failed.append(name)
            continue

        print(f"PASS {name}")

    except Exception as exc:
        print(f"FAIL {name}: {type(exc).__name__}: {exc}")
        failed.append(name)

if failed:
    raise SystemExit(1)

print()
print("PASS: All existing route modules imported.")
PY

echo

# ------------------------------------------------------------
# 5. INSPECT EVERY ROUTER'S ACTUAL ROUTES
# ------------------------------------------------------------

echo "============================================================"
echo " 5. EXISTING ROUTER ROUTE TABLE"
echo "============================================================"

"$PYTHON" <<'PY'
import importlib

modules = [
    "app.api.routes.data_gov",
    "app.api.routes.crop",
    "app.api.routes.fertilizer",
    "app.api.routes.diagnosis",
    "app.api.routes.health",
    "app.api.routes.weather",
    "app.api.routes.helper",
    "app.api.routes.ledger",
    "app.api.routes.animal_encyclopedia",
    "app.api.routes.livestock",
    "app.api.routes.crop_planner",
    "app.api.routes.crop_passport",
    "app.api.routes.livestock_encyclopedia",
    "app.api.routes.soil_profiles",
    "app.api.routes.kvk",
    "app.api.routes.gov_markets",
    "app.api.routes.mandi_prices",
    "app.api.routes.pest_library",
    "app.api.routes.livestock_details",
    "app.api.routes.sensor",
    "app.api.routes.translate",
    "app.api.routes.price_alerts",
    "app.api.routes.scheme",
    "app.api.routes.livestock_types",
    "app.api.routes.soil_records",
]

total = 0

for name in modules:
    module = importlib.import_module(name)
    router = module.router

    routes = getattr(router, "routes", [])

    print()
    print(name)
    print("-" * len(name))

    if not routes:
        print("  NO ROUTES")

    for route in routes:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None)

        print(
            f"  {','.join(sorted(methods or [])):8} "
            f"{path}"
        )

        total += 1

print()
print(f"TOTAL ROUTER ROUTES: {total}")

if total == 0:
    raise SystemExit(
        "ERROR: Existing router modules contain zero routes."
    )
PY

echo

# ------------------------------------------------------------
# 6. INSPECT ACTUAL FASTAPI APP
# ------------------------------------------------------------

echo "============================================================"
echo " 6. CURRENT FASTAPI APPLICATION"
echo "============================================================"

"$PYTHON" <<'PY'
from app.main import app
from fastapi.routing import APIRoute

print("FastAPI app imported successfully.")
print()
print("APP ROUTES:")
print("-----------")

count = 0

for route in app.routes:
    path = getattr(route, "path", None)
    methods = getattr(route, "methods", None)

    if path is not None:
        print(
            f"{','.join(sorted(methods or [])):8} "
            f"{path}"
        )
        count += 1

print()
print(f"APIRoute count: {count}")

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

    for route in app.routes:
        if getattr(route, "path", None) != path:
            continue

        methods = getattr(route, "methods", set()) or set()

        if method in methods:
            found = True
            break

    print(
        ("PASS" if found else "FAIL"),
        method,
        path
    )

    if not found:
        missing.append((method, path))

if missing:
    print()
    print("WARNING: Required routes are not mounted in app.main.")
    print("The existing router modules will now be wired into the")
    print("existing FastAPI application.")
else:
    print()
    print("PASS: All required routes already mounted.")
PY

echo

# ------------------------------------------------------------
# 7. REPAIR ONLY ROUTER WIRING IF REQUIRED
# ------------------------------------------------------------

echo "============================================================"
echo " 7. REPAIR EXISTING MAIN.PY ROUTER WIRING"
echo "============================================================"

"$PYTHON" <<'PY'
from pathlib import Path
import ast

path = Path("backend/app/main.py")
text = path.read_text(encoding="utf-8")

module_names = [
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

# Parse existing main.py.
tree = ast.parse(text)

# Find existing imports from app.api.routes.
existing_imports = set()

for node in ast.walk(tree):
    if isinstance(node, ast.ImportFrom):
        if node.module == "app.api.routes":
            for alias in node.names:
                existing_imports.add(alias.name)

missing_imports = [
    name for name in module_names
    if name not in existing_imports
]

# Find existing include_router calls.
existing_includes = set()

for node in ast.walk(tree):
    if isinstance(node, ast.Call):
        if isinstance(node.func, ast.Attribute):
            if node.func.attr == "include_router" and node.args:
                arg = node.args[0]

                if isinstance(arg, ast.Attribute):
                    if isinstance(arg.value, ast.Name):
                        existing_includes.add(arg.value.id)

missing_includes = [
    name for name in module_names
    if name not in existing_includes
]

print("Existing imports:")
print(" ", ", ".join(sorted(existing_imports)) or "(none)")

print()
print("Existing include_router calls:")
print(" ", ", ".join(sorted(existing_includes)) or "(none)")

print()
print("Missing imports:")
print(" ", ", ".join(missing_imports) or "(none)")

print()
print("Missing router mounts:")
print(" ", ", ".join(missing_includes) or "(none)")

if not missing_imports and not missing_includes:
    print()
    print("PASS: Existing main.py already contains all router wiring.")
    raise SystemExit(0)

# We intentionally DO NOT create another FastAPI application.
# We only repair the existing app.main module.

lines = text.splitlines()

# ------------------------------------------------------------
# Add missing router imports to an existing app.api.routes import.
# ------------------------------------------------------------

if missing_imports:
    import_line_index = None

    for i, line in enumerate(lines):
        if "from app.api.routes import" in line:
            import_line_index = i
            break

    if import_line_index is not None:
        line = lines[import_line_index]

        # Keep the existing import style and append only missing modules.
        additions = ", " + ", ".join(missing_imports)

        if not line.rstrip().endswith(","):
            line = line.rstrip()

        lines[import_line_index] = line + additions

    else:
        # No existing route import. Add one after FastAPI import.
        insert_at = 0

        for i, line in enumerate(lines):
            if line.startswith("from fastapi"):
                insert_at = i + 1
                break

        lines.insert(
            insert_at,
            "from app.api.routes import " + ", ".join(module_names)
        )

# ------------------------------------------------------------
# Find app = FastAPI(...)
# and add missing include_router calls immediately after it.
# ------------------------------------------------------------

new_text = "\n".join(lines) + "\n"
tree = ast.parse(new_text)

app_assignment_end = None

for node in tree.body:
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id == "app":
                if isinstance(node.value, ast.Call):
                    if isinstance(node.value.func, ast.Name):
                        if node.value.func.id == "FastAPI":
                            app_assignment_end = node.end_lineno

if app_assignment_end is None:
    raise SystemExit(
        "ERROR: Could not find existing `app = FastAPI(...)`."
    )

lines = new_text.splitlines()

mount_lines = [
    f"app.include_router({name}.router)"
    for name in missing_includes
]

if mount_lines:
    insertion_index = app_assignment_end

    lines[insertion_index:insertion_index] = [
        "",
        "# Existing AgriSaathi route wiring.",
        "# These routers belong to the existing application.",
        *mount_lines,
    ]

final_text = "\n".join(lines) + "\n"

# Syntax check before writing.
ast.parse(final_text)

path.write_text(final_text, encoding="utf-8")

print()
print("FIXED: Existing app.main router wiring.")
print()
print("Added imports:")
for name in missing_imports:
    print(" ", name)

print()
print("Added mounts:")
for name in missing_includes:
    print(" ", f"app.include_router({name}.router)")
PY

echo

# ------------------------------------------------------------
# 8. COMPILE
# ------------------------------------------------------------

echo "============================================================"
echo " 8. PYTHON COMPILE CHECK"
echo "============================================================"

"$PYTHON" -m compileall -q "$BACKEND/app"

echo "PASS: Backend Python compilation succeeded."
echo

# ------------------------------------------------------------
# 9. FINAL ROUTE VALIDATION
# ------------------------------------------------------------

echo "============================================================"
echo " 9. FINAL FASTAPI ROUTE VALIDATION"
echo "============================================================"

"$PYTHON" <<'PY'
from app.main import app

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

routes = []

for route in app.routes:
    path = getattr(route, "path", None)
    methods = getattr(route, "methods", set()) or set()

    if path is not None:
        routes.append((path, methods))

print(f"APIRoute count: {len(routes)}")
print()

missing = []

for method, path in required:
    found = any(
        route_path == path and method in methods
        for route_path, methods in routes
    )

    print(
        f"{'PASS' if found else 'FAIL'} "
        f"{method:5} {path}"
    )

    if not found:
        missing.append((method, path))

print()

if missing:
    print("ERROR: Required routes are still missing.")
    print()
    for method, path in missing:
        print(f"  {method} {path}")
    raise SystemExit(1)

print("PASS: All required production routes are mounted.")
PY

echo

# ------------------------------------------------------------
# 10. LOCAL HTTP TEST WITH TESTCLIENT
# ------------------------------------------------------------

echo "============================================================"
echo " 10. LOCAL FASTAPI HTTP TEST"
echo "============================================================"

"$PYTHON" <<'PY'
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

tests = [
    ("GET", "/health"),
    ("GET", "/api/data-gov/resources"),
    ("GET", "/api/livestock-types"),
    ("GET", "/api/livestock/encyclopedia/categories"),
    ("GET", "/api/schemes"),
]

failed = []

for method, path in tests:
    response = client.request(method, path)

    print(
        f"{response.status_code:3} "
        f"{method:5} "
        f"{path}"
    )

    # 404 means route is absent.
    # 500 means route exists but has an application/runtime problem.
    if response.status_code == 404:
        failed.append((method, path, "404"))

    if response.status_code >= 500:
        failed.append((method, path, str(response.status_code)))

print()

if failed:
    print("LOCAL API TEST FAILURES:")
    for item in failed:
        print(" ", item)
    raise SystemExit(1)

print("PASS: Required local endpoints are reachable.")
PY

echo

# ------------------------------------------------------------
# 11. VERCEL ENTRYPOINT
# ------------------------------------------------------------

echo "============================================================"
echo " 11. VERCEL ENTRYPOINT CHECK"
echo "============================================================"

mkdir -p "$BACKEND/api"

cat > "$BACKEND/api/index.py" <<'PY'
from app.main import app
PY

echo "PASS: backend/api/index.py points to existing app.main:app."

cat > "$BACKEND/vercel.json" <<'JSON'
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ]
}
JSON

echo "PASS: Vercel configuration uses existing FastAPI app."
echo

# ------------------------------------------------------------
# 12. CORS CHECK
# ------------------------------------------------------------

echo "============================================================"
echo " 12. CORS CHECK"
echo "============================================================"

"$PYTHON" <<'PY'
from app.main import app

cors = None

for middleware in app.user_middleware:
    cls = middleware.cls

    if cls.__name__ == "CORSMiddleware":
        cors = middleware
        break

if cors is None:
    print("ERROR: CORSMiddleware is not installed.")
    raise SystemExit(1)

print("PASS: CORSMiddleware exists.")

print()
print("Configured CORS options:")

for key, value in cors.kwargs.items():
    print(f"  {key}: {value}")

allowed = cors.kwargs.get("allow_origins", [])

required_origin = "https://agrisaathi-ashy.vercel.app"

if "*" in allowed or required_origin in allowed:
    print()
    print("PASS: Production frontend origin is allowed.")
else:
    print()
    print("WARNING: Production frontend origin is NOT explicitly allowed:")
    print(" ", required_origin)
    print()
    print("The existing CORS configuration must be checked before deployment.")
PY

echo

# ------------------------------------------------------------
# 13. GIT DIFF
# ------------------------------------------------------------

echo "============================================================"
echo " 13. CHANGES MADE"
echo "============================================================"

cd "$ROOT"

git diff -- backend/app/main.py backend/api/index.py backend/vercel.json

echo

echo "============================================================"
echo " REPAIR COMPLETE — DO NOT DEPLOY YET"
echo "============================================================"
echo
echo "Next command:"
echo
echo "  ./verify-agrisaathi-production.sh"
echo
echo "If that script does not exist, run the route checks above again."
echo
echo "IMPORTANT:"
echo "  Do NOT run the old deploy script yet."
echo "  Do NOT create another FastAPI app."
echo "  Do NOT paste Python code directly into zsh."
echo
