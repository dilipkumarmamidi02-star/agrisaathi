#!/bin/zsh

set -u

ROOT="/Users/mamididilipkumar/Downloads/agrisaathi"

echo
echo "AGRISAATHI AGRI HELPER CONTRACT TEST"
echo "ROOT: $ROOT"
echo

PASS=0
FAIL=0

check_file() {
  if [ -f "$1" ]; then
    echo "PASS  file: $1"
    PASS=$((PASS + 1))
  else
    echo "FAIL  missing file: $1"
    FAIL=$((FAIL + 1))
  fi
}

check_text() {
  FILE="$1"
  TEXT="$2"

  if [ -f "$FILE" ] && grep -Fq "$TEXT" "$FILE"; then
    echo "PASS  $TEXT"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $TEXT"
    FAIL=$((FAIL + 1))
  fi
}

check_file "$ROOT/frontend/src/lib/agriHelperFeatures.js"
check_file "$ROOT/frontend/src/lib/agriHelperContext.js"

check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "marketPrices"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "fertilizer"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "soilPassport"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "diagnose"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "speakToAgriSaathi"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "incurance"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "notifications"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "successStories"
check_text "$ROOT/frontend/src/lib/agriHelperFeatures.js" "allTools"

check_text "$ROOT/frontend/src/lib/agriHelperContext.js" "resolveNavigationTarget"
check_text "$ROOT/frontend/src/lib/agriHelperContext.js" "resolveFollowUp"
check_text "$ROOT/frontend/src/lib/agriHelperContext.js" "getCurrentFeatureFromPath"

echo
echo "PASS COUNT: $PASS"
echo "FAIL COUNT: $FAIL"

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "CONTRACT TEST FAILED"
  exit 1
fi

echo
echo "CONTRACT TEST PASSED"
