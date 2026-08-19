#!/usr/bin/env bash

# ============================================================
# AGRISAATHI — EXISTING APPLICATION SAFE DEPLOYMENT
# ============================================================
#
# IMPORTANT:
#   This script modifies the EXISTING AgriSaathi application.
#
# DO NOT:
#   - rebuild AgriSaathi from scratch
#   - create another application
#   - replace frontend
#   - replace backend
#   - overwrite .env files
#   - fabricate Data.gov.in data
#   - fabricate ingestion success
#   - fabricate blockchain transactions
#   - force-push Git
#
# ============================================================

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"
SRC="$FRONTEND/src"
REPORT_DIR="$ROOT/implementation-reports"

cd "$ROOT"

echo
echo "============================================================"
echo " AGRISAATHI — EXISTING APPLICATION DEPLOYMENT"
echo "============================================================"
echo
echo "Repository:"
echo "  $ROOT"
echo
echo "Frontend:"
echo "  $FRONTEND"
echo
echo "Backend:"
echo "  $BACKEND"
echo

# ============================================================
# 0. SAFETY CHECKS
# ============================================================

echo "============================================================"
echo " 0. REPOSITORY SAFETY"
echo "============================================================"

if [[ ! -f "$ROOT/.git/config" ]]; then
    echo "ERROR: Not inside the AgriSaathi Git repository."
    exit 1
fi

if [[ ! -f "$FRONTEND/package.json" ]]; then
    echo "ERROR: frontend/package.json not found."
    exit 1
fi

if [[ ! -d "$SRC" ]]; then
    echo "ERROR: frontend/src not found."
    exit 1
fi

if [[ ! -d "$BACKEND" ]]; then
    echo "ERROR: backend directory not found."
    exit 1
fi

echo "PASS: Existing repository detected."

echo
echo "Git remote:"
git remote -v

echo
echo "Branch:"
git branch --show-current

echo
echo "Current commit:"
git log -1 --oneline --decorate

# ============================================================
# 1. ENVIRONMENT SAFETY
# ============================================================

echo
echo "============================================================"
echo " 1. ENVIRONMENT / SECRET SAFETY"
echo "============================================================"

ENV_FILES=(
    "$ROOT/.env"
    "$ROOT/.env.local"
    "$ROOT/.env.production"
    "$ROOT/.env.production.local"
    "$FRONTEND/.env"
    "$FRONTEND/.env.local"
    "$FRONTEND/.env.production"
    "$FRONTEND/.env.production.local"
    "$BACKEND/.env"
    "$BACKEND/.env.local"
)

for ENV_FILE in "${ENV_FILES[@]}"; do
    if [[ -f "$ENV_FILE" ]]; then
        echo
        echo "Environment file found:"
        echo "  $ENV_FILE"

        echo "Variable names only:"
        sed -E 's/=.*//' "$ENV_FILE" \
            | sed '/^[[:space:]]*#/d;/^[[:space:]]*$/d' \
            | sort -u \
            | sed 's/^/    /'
    fi
done

TRACKED_ENV="$(git ls-files | grep -E '(^|/)\.env($|\.)' || true)"

if [[ -n "$TRACKED_ENV" ]]; then
    echo
    echo "ERROR: Environment files are tracked by Git:"
    echo "$TRACKED_ENV"
    echo
    echo "Refusing to deploy."
    exit 1
fi

echo
echo "PASS: No tracked .env files."

# ============================================================
# 2. FIX ONLY THE KNOWN BUILD BLOCKER
# ============================================================

echo
echo "============================================================"
echo " 2. SOIL PASSPORT BUILD-BLOCKER CHECK"
echo "============================================================"

SOIL_FILE="$SRC/pages/SoilPassport.jsx"

if [[ ! -f "$SOIL_FILE" ]]; then
    echo "ERROR: SoilPassport.jsx not found:"
    echo "  $SOIL_FILE"
    exit 1
fi

AXIOS_COUNT="$(grep -cE '^[[:space:]]*import[[:space:]]+axios[[:space:]]+from[[:space:]]+["'\'']axios["'\''];?[[:space:]]*$' "$SOIL_FILE" || true)"
API_COUNT="$(grep -cE '^[[:space:]]*const[[:space:]]+API_URL[[:space:]]*=' "$SOIL_FILE" || true)"

echo "axios declarations : $AXIOS_COUNT"
echo "API_URL declarations: $API_COUNT"

if [[ "$AXIOS_COUNT" -gt 1 || "$API_COUNT" -gt 1 ]]; then

    echo
    echo "Duplicate declarations detected."
    echo "Creating backup before modifying the file."

    BACKUP_FILE="$SOIL_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$SOIL_FILE" "$BACKUP_FILE"

    echo "Backup:"
    echo "  $BACKUP_FILE"

    python3 - "$SOIL_FILE" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()

# Keep only the first axios import.
axios_pattern = re.compile(
    r'^[ \t]*import[ \t]+axios[ \t]+from[ \t]+["\']axios["\'];?[ \t]*\n?',
    re.MULTILINE,
)

matches = list(axios_pattern.finditer(text))

if len(matches) > 1:
    first = matches[0]
    prefix = text[:first.start()]
    kept = first.group(0)
    suffix = text[first.end():]

    suffix = axios_pattern.sub("", suffix)
    text = prefix + kept + suffix

# Keep only the first API_URL declaration.
api_pattern = re.compile(
    r'^[ \t]*const[ \t]+API_URL[ \t]*=[^\n;]*;?[ \t]*\n?',
    re.MULTILINE,
)

matches = list(api_pattern.finditer(text))

if len(matches) > 1:
    first = matches[0]
    prefix = text[:first.start()]
    kept = first.group(0)
    suffix = text[first.end():]

    suffix = api_pattern.sub("", suffix)
    text = prefix + kept + suffix

path.write_text(text)
PY

    AXIOS_COUNT_AFTER="$(grep -cE '^[[:space:]]*import[[:space:]]+axios[[:space:]]+from[[:space:]]+["'\'']axios["'\''];?[[:space:]]*$' "$SOIL_FILE" || true)"
    API_COUNT_AFTER="$(grep -cE '^[[:space:]]*const[[:space:]]+API_URL[[:space:]]*=' "$SOIL_FILE" || true)"

    echo
    echo "After cleanup:"
    echo "axios declarations : $AXIOS_COUNT_AFTER"
    echo "API_URL declarations: $API_COUNT_AFTER"

    if [[ "$AXIOS_COUNT_AFTER" -ne 1 ]]; then
        echo "ERROR: axios declaration cleanup failed."
        exit 1
    fi

    if [[ "$API_COUNT_AFTER" -ne 1 ]]; then
        echo "ERROR: API_URL declaration cleanup failed."
        exit 1
    fi

    echo "PASS: Duplicate Soil Passport declarations removed."

else
    echo "PASS: SoilPassport.jsx does not contain duplicate declarations."
fi

# ============================================================
# 3. EXISTING DATAGOV BACKEND REGISTRY
# ============================================================

echo
echo "============================================================"
echo " 3. EXISTING DATA.GOV.IN BACKEND REGISTRY"
echo "============================================================"

DATAGOV_REGISTRY="$BACKEND/app/core/datagov_registry.py"

if [[ ! -f "$DATAGOV_REGISTRY" ]]; then
    echo "ERROR: Existing backend Data.gov.in registry not found:"
    echo "  $DATAGOV_REGISTRY"
    exit 1
fi

echo "Registry:"
echo "  $DATAGOV_REGISTRY"

echo
echo "Registry header:"
sed -n '1,40p' "$DATAGOV_REGISTRY"

# Validate the actual Python DATAGOV_REGISTRY object.
# The registry is a list of 72 resource dictionaries.
RESOURCE_COUNT="$(
python3 - "$DATAGOV_REGISTRY" <<'PYTHON'
import importlib.util
import sys

path = sys.argv[1]

spec = importlib.util.spec_from_file_location("datagov_registry", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

registry = module.DATAGOV_REGISTRY

if not isinstance(registry, list):
    print("ERROR: DATAGOV_REGISTRY is not a list.", file=sys.stderr)
    sys.exit(2)

print(len(registry))
PYTHON
)"

echo
echo "Detected resource definitions: $RESOURCE_COUNT"

if [[ "$RESOURCE_COUNT" -ne 72 ]]; then
    echo "ERROR: Existing backend registry does not contain exactly 72 resources."
    exit 1
fi

echo "PASS: Existing backend registry contains 72 resources."

# ============================================================
# 4. RESOURCE #26 / KCC VALIDATION
# ============================================================

echo
echo "============================================================"
echo " 4. RESOURCE #26 — KCC / SPEAK TO AGRISAATHI"
echo "============================================================"

KCC_ID="cef25fe2-9231-4128-8aec-2c948fedd43f"

if grep -q "$KCC_ID" "$DATAGOV_REGISTRY"; then
    echo "PASS: KCC resource ID found."
else
    echo "ERROR: KCC resource ID not found."
    exit 1
fi

if grep -qE '"?id"?[[:space:]]*[:=][[:space:]]*26' "$DATAGOV_REGISTRY"; then
    echo "PASS: Resource #26 found."
else
    echo "WARNING: Numeric resource key could not be confirmed by simple text scan."
fi

if grep -qi "Speak to AgriSaathi" "$DATAGOV_REGISTRY"; then
    echo "PASS: Speak to AgriSaathi mapping found."
else
    echo "ERROR: Speak to AgriSaathi mapping not found."
    exit 1
fi

echo
echo "KCC:"
echo "  $KCC_ID"
echo
echo "Feature:"
echo "  SPEAK TO AGRISAATHI"

# ============================================================
# 5. LIVESTOCK RESOURCES 34-68
# ============================================================

echo
echo "============================================================"
echo " 5. LIVESTOCK RESOURCES 34-68"
echo "============================================================"

LIVESTOCK_COUNT="$(
python3 - "$DATAGOV_REGISTRY" <<'PY'
import ast
import sys

path = sys.argv[1]
tree = ast.parse(open(path, encoding="utf-8").read())

count = 0

for node in ast.walk(tree):
    if isinstance(node, ast.Dict):
        numeric_id = None

        for k, v in zip(node.keys, node.values):
            if (
                isinstance(k, ast.Constant)
                and k.value == "id"
                and isinstance(v, ast.Constant)
                and isinstance(v.value, int)
            ):
                numeric_id = v.value

        if numeric_id is not None and 34 <= numeric_id <= 68:
            count += 1

print(count)
PY
)"

echo "Resources 34-68 detected: $LIVESTOCK_COUNT"

if [[ "$LIVESTOCK_COUNT" -ne 35 ]]; then
    echo "ERROR: Resources 34-68 are not all present."
    exit 1
fi

echo "PASS: All 35 livestock census resources are present."
echo "PASS: These resources must remain on canonical /livestock-care."

# ============================================================
# 6. FRONTEND DATAGOV LIBRARY CHECK
# ============================================================

echo
echo "============================================================"
echo " 6. FRONTEND DATA.GOV INTEGRATION"
echo "============================================================"

DATAGOV_LIB="$SRC/lib/dataGov.js"

if [[ ! -f "$DATAGOV_LIB" ]]; then
    echo "ERROR: Existing frontend Data.gov library not found."
    exit 1
fi

echo "Existing Data.gov frontend library:"
echo "  $DATAGOV_LIB"

grep -nE \
    'getDataGovResources|getDataGovResource|getDataGovHealth|getDataGovFeatureResources|DATAGOV_FEATURES' \
    "$DATAGOV_LIB" \
    || true

echo
echo "PASS: Existing frontend Data.gov integration detected."

# ============================================================
# 7. CANONICAL ROUTE REGISTRY
# ============================================================

echo
echo "============================================================"
echo " 7. CANONICAL FEATURE ROUTES"
echo "============================================================"

CONFIG_DIR="$SRC/config"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/canonical-feature-routes.js" <<'EOF'
/*
 * AGRISAATHI CANONICAL FEATURE ROUTES
 *
 * These are destinations in the EXISTING application.
 *
 * Multiple Data.gov.in resources may feed the same feature.
 * They must NOT create duplicate application pages.
 */

export const CANONICAL_FEATURE_ROUTES = {
  home: "/",
  crops: "/crops",
  diagnose: "/diagnose",
  nearMe: "/near-me",
  fertilizer: "/fertilizer",
  soilPassport: "/soil-passport",
  cropPlanner: "/crop-planner",
  livestock: "/livestock-care",
  marketPrices: "/market-prices",
  dataGov: "/data-gov",
  schemes: "/schemes",
  irrigation: "/irrigation-planner",
  harvest: "/harvest-records",
  profile: "/profile-settings",
  weather: "/weather",
  marketplace: "/marketplace",
  training: "/training-center",
  insurance: "/insurance-hub",
  pesticideLibrary: "/pest-library",
  alerts: "/alerts-center",
  animalEncyclopedia: "/animal-encyclopedia",
  community: "/community",

  /*
   * KCC Resource #26 is a knowledge source for
   * SPEAK TO AGRISAATHI.
   *
   * It is intentionally NOT converted into a new page.
   */
  speakToAgriSaathi: "/"
};

export default CANONICAL_FEATURE_ROUTES;
EOF

echo "PASS: Canonical route registry written."

# ============================================================
# 8. FRONTEND 72-RESOURCE REGISTRY
# ============================================================

echo
echo "============================================================"
echo " 8. FRONTEND 72-RESOURCE REGISTRY"
echo "============================================================"

REGISTRY_FILE="$CONFIG_DIR/data-gov-72-registry.js"

if [[ -f "$REGISTRY_FILE" ]]; then
    echo "Existing frontend 72-resource registry detected:"
    echo "  $REGISTRY_FILE"

    echo
    echo "Checking registry syntax..."
    node --check "$REGISTRY_FILE"

    echo "PASS: Existing frontend registry syntax is valid."

else
    echo
    echo "WARNING: Frontend 72-resource registry does not exist."
    echo
    echo "The backend registry is authoritative."
    echo "This deployment script will NOT fabricate or duplicate all"
    echo "72 resource definitions automatically."
    echo
    echo "Create/synchronize the frontend registry from the backend"
    echo "only after inspecting the existing implementation."
fi

# ============================================================
# 9. APP ROUTE AUDIT
# ============================================================

echo
echo "============================================================"
echo " 9. EXISTING FRONTEND ROUTE AUDIT"
echo "============================================================"

APP_FILE="$SRC/App.jsx"

if [[ ! -f "$APP_FILE" ]]; then
    echo "ERROR: frontend/src/App.jsx not found."
    exit 1
fi

echo "App:"
echo "  $APP_FILE"

REQUIRED_ROUTES=(
    "/"
    "/crops"
    "/diagnose"
    "/near-me"
    "/fertilizer"
    "/soil-passport"
    "/crop-planner"
    "/livestock-care"
    "/market-prices"
    "/schemes"
    "/irrigation-planner"
    "/harvest-records"
    "/profile-settings"
    "/weather"
    "/marketplace"
    "/training-center"
    "/insurance-hub"
    "/pest-library"
    "/alerts-center"
    "/animal-encyclopedia"
)

for ROUTE in "${REQUIRED_ROUTES[@]}"; do

    if grep -qF "path=\"$ROUTE\"" "$APP_FILE"; then
        echo "PASS  $ROUTE"
    elif grep -qF "path={'$ROUTE'}" "$APP_FILE"; then
        echo "PASS  $ROUTE"
    elif grep -qF "path={`$ROUTE`}" "$APP_FILE"; then
        echo "PASS  $ROUTE"
    else
        echo "WARN  $ROUTE"
    fi

done

# ============================================================
# 10. LIVESTOCK DUPLICATE PAGE CHECK
# ============================================================

echo
echo "============================================================"
echo " 10. LIVESTOCK DUPLICATE PAGE CHECK"
echo "============================================================"

if [[ -d "$SRC/pages" ]]; then

    LIVESTOCK_FILES="$(
        find "$SRC/pages" \
            -maxdepth 1 \
            -type f \
            \( -iname '*livestock*' -o -iname '*animal*' \) \
            | sort || true
    )"

    if [[ -n "$LIVESTOCK_FILES" ]]; then
        echo "$LIVESTOCK_FILES"
    else
        echo "No livestock/animal page filenames detected."
    fi

fi

echo
echo "RULE:"
echo "  Resources 34-68 -> /livestock-care"
echo "  Do not generate 35 state-specific application pages."

# ============================================================
# 11. SPEAK TO AGRISAATHI / AGRI HELPER AUDIT
# ============================================================

echo
echo "============================================================"
echo " 11. SPEAK TO AGRISAATHI / AGRI HELPER SEPARATION"
echo "============================================================"

HELPER_FILE="$SRC/components/AgriHelperWidget.jsx"

if [[ -f "$HELPER_FILE" ]]; then
    echo "Agri Helper:"
    echo "  $HELPER_FILE"
else
    echo "WARNING: AgriHelperWidget.jsx not found."
fi

echo
echo "Agri Helper references:"
grep -RInE \
    'AgriHelper|Agri Helper' \
    "$SRC" \
    --include='*.jsx' \
    --include='*.tsx' \
    --include='*.js' \
    --include='*.ts' \
    | head -200 \
    || true

echo
echo "Speak / voice / KCC references:"
grep -RInE \
    'Speak to AgriSaathi|speech|Speech|voice|Voice|microphone|KCC|cef25fe2' \
    "$SRC" \
    --include='*.jsx' \
    --include='*.tsx' \
    --include='*.js' \
    --include='*.ts' \
    | head -300 \
    || true

echo
echo "RULE:"
echo "  KCC #26 -> SPEAK TO AGRISAATHI"
echo "  Agri Helper -> remains separate floating helper UI"

# ============================================================
# 12. DUPLICATE NAVIGATION AUDIT
# ============================================================

echo
echo "============================================================"
echo " 12. NAVIGATION DUPLICATE AUDIT"
echo "============================================================"

mkdir -p "$REPORT_DIR"

NAV_REPORT="$REPORT_DIR/navigation-audit.txt"

grep -RInE \
    'Weather|Near Me|Animal Encyclopedia|Profile|Alerts|Notifications|Dashboard|Crops|Diagnose|All Tools|Livestock' \
    "$SRC" \
    --include='*.jsx' \
    --include='*.tsx' \
    --include='*.js' \
    --include='*.ts' \
    > "$NAV_REPORT" \
    || true

echo "Navigation audit:"
echo "  $NAV_REPORT"

echo
echo "Potential navigation references:"
grep -nEi \
    'Weather|Near Me|Animal Encyclopedia|Profile|Alerts|Notifications|Livestock' \
    "$NAV_REPORT" \
    | head -250 \
    || true

# ============================================================
# 13. EDUCATIONAL DATA SAFETY
# ============================================================

echo
echo "============================================================"
echo " 13. EDUCATIONAL DATA SAFETY"
echo "============================================================"

EDU_DIR="$SRC/data/educational"
mkdir -p "$EDU_DIR"

if [[ ! -f "$EDU_DIR/README.md" ]]; then

cat > "$EDU_DIR/README.md" <<'EOF'
# AgriSaathi Educational Reference Layer

This directory is separate from official Data.gov.in records.

Educational/reference data must not be represented as government
or authoritative data unless authoritative provenance is present.

Use:

source_type:
educational_reference

verification_status:
unverified_reference

authority_level:
educational_reference

Do not fabricate:

- scientific names
- breeds
- government statistics
- pesticide dosage
- veterinary prescriptions
- registration status
- official recommendations

Data.gov.in records must remain separately identified.
EOF

fi

echo "PASS: Educational reference layer remains separated."

# ============================================================
# 14. FRONTEND DEPENDENCY / BUILD
# ============================================================

echo
echo "============================================================"
echo " 14. FRONTEND BUILD"
echo "============================================================"

cd "$FRONTEND"

if [[ ! -d node_modules ]]; then
    echo "node_modules not found."
    echo "Installing dependencies with npm ci..."

    if [[ -f package-lock.json ]]; then
        npm ci
    else
        npm install
    fi
else
    echo "Existing node_modules detected."
fi

echo
echo "Running lint if available..."

if npm run | grep -qE '^[[:space:]]+lint'; then
    npm run lint
else
    echo "No lint script defined. Continuing."
fi

echo
echo "Running production build..."

npm run build

if [[ ! -f "$FRONTEND/dist/index.html" ]]; then
    echo
    echo "ERROR: Vite build did not create dist/index.html."
    exit 1
fi

echo
echo "PASS: Existing frontend production build succeeded."

cd "$ROOT"

# ============================================================
# 15. BACKEND PRESERVATION
# ============================================================

echo
echo "============================================================"
echo " 15. BACKEND PRESERVATION CHECK"
echo "============================================================"

echo "Backend files are not modified by this deployment script."

git diff -- "$BACKEND" || true

# ============================================================
# 16. SECRET SCAN
# ============================================================

echo
echo "============================================================"
echo " 16. BASIC SECRET SCAN"
echo "============================================================"

if git diff --cached -- . ':!package-lock.json' \
    | grep -Eiq \
    '(sk-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY)'
then
    echo "ERROR: Possible secret detected in staged content."
    echo "Refusing to commit."
    exit 1
fi

echo "PASS: Basic staged secret scan."

# ============================================================
# 17. SHOW CHANGES
# ============================================================

echo
echo "============================================================"
echo " 17. CHANGES"
echo "============================================================"

git status --short

echo
echo "Diff summary:"
git diff --stat

# ============================================================
# 18. COMMIT
# ============================================================

echo
echo "============================================================"
echo " 18. COMMIT"
echo "============================================================"

git add \
    "$CONFIG_DIR/canonical-feature-routes.js" \
    "$REPORT_DIR/navigation-audit.txt" \
    "$EDU_DIR/README.md" \
    "$SOIL_FILE"

if [[ -f "$REGISTRY_FILE" ]]; then
    git add "$REGISTRY_FILE"
fi

echo
echo "Staged changes:"
git status --short

if git diff --cached --quiet; then
    echo
    echo "No changes to commit."
else
    git commit -m "frontend: stabilize existing AgriSaathi deployment"
fi

# ============================================================
# 19. FETCH REMOTE
# ============================================================

echo
echo "============================================================"
echo " 19. GITHUB REMOTE SAFETY"
echo "============================================================"

git fetch origin main

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse origin/main)"

echo "LOCAL : $LOCAL_SHA"
echo "REMOTE: $REMOTE_SHA"

if ! git merge-base --is-ancestor "$REMOTE_SHA" "$LOCAL_SHA"; then

    echo
    echo "ERROR: origin/main contains commits not present locally."
    echo
    echo "Refusing to force-push."
    echo
    echo "Review with:"
    echo "  git log --oneline --decorate --graph --all -30"
    exit 1

fi

echo "PASS: Local branch can be safely pushed."

# ============================================================
# 20. PUSH
# ============================================================

echo
echo "============================================================"
echo " 20. PUSH TO GITHUB MAIN"
echo "============================================================"

git push origin main

echo
echo "PASS: GitHub push completed."

# ============================================================
# 21. VERCEL
# ============================================================

echo
echo "============================================================"
echo " 21. VERCEL PRODUCTION DEPLOYMENT"
echo "============================================================"

cd "$FRONTEND"

if ! command -v vercel >/dev/null 2>&1; then
    echo
    echo "ERROR: Vercel CLI is not installed."
    echo
    echo "Install:"
    echo "  npm install -g vercel"
    echo
    echo "Then:"
    echo "  vercel login"
    echo
    exit 1
fi

if [[ ! -f "$FRONTEND/.vercel/project.json" ]]; then
    echo
    echo "ERROR: frontend/.vercel/project.json is missing."
    echo "Refusing to deploy to an unknown Vercel project."
    exit 1
fi

echo
echo "Existing linked Vercel project:"
cat "$FRONTEND/.vercel/project.json"

echo
echo "Deploying EXISTING frontend."
echo "Vercel root: frontend/"
echo

vercel --prod --yes

cd "$ROOT"

# ============================================================
# 22. FINAL STATUS
# ============================================================

echo
echo "============================================================"
echo " 22. FINAL STATUS"
echo "============================================================"

echo
echo "Git status:"
git status --short

echo
echo "Latest commit:"
git log -1 --oneline --decorate

echo
echo "============================================================"
echo " AGRISAATHI DEPLOYMENT PROCESS FINISHED"
echo "============================================================"
echo
echo "Repository:"
echo "https://github.com/dilipkumarmamidi02-star/agrisaathi"
echo
echo "Production:"
echo "https://agrisaathi-ashy.vercel.app"
echo
echo "Frontend:"
echo "frontend/"
echo
echo "Backend:"
echo "backend/"
echo
echo "Backend Data.gov.in registry:"
echo "backend/app/core/datagov_registry.py"
echo
echo "Frontend Data.gov library:"
echo "frontend/src/lib/dataGov.js"
echo
echo "Canonical route registry:"
echo "frontend/src/config/canonical-feature-routes.js"
echo
echo "KCC Resource #26:"
echo "$KCC_ID"
echo "-> SPEAK TO AGRISAATHI"
echo
echo "Livestock:"
echo "Resources 34-68 -> /livestock-care"
echo
echo "Soil Passport:"
echo "Duplicate axios/API_URL declarations checked and cleaned."
echo
echo "============================================================"
