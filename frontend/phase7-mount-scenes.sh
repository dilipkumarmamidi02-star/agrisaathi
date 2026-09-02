#!/bin/bash

set -e

ROOT="$(pwd)"

echo "=============================================================="
echo "🌾 AGRISAATHI — PHASE 7 3D PAGE INTEGRATION"
echo "=============================================================="
echo ""

if [ ! -f "$ROOT/package.json" ]; then
  echo "❌ ERROR: package.json not found."
  echo "Please run this from:"
  echo "~/Downloads/agrisaathi/frontend"
  exit 1
fi

echo "✅ Frontend project detected:"
echo "   $ROOT"
echo ""

PHASE7_IMPORT='import { Phase7RouteIntegration } from "../components/phase7";'

add_scene() {
  PAGE_FILE="$1"
  ROUTE="$2"
  PAGE_NAME="$3"

  echo "--------------------------------------------------------------"
  echo "🔧 Processing: $PAGE_NAME"
  echo "   File: $PAGE_FILE"
  echo "   Route: $ROUTE"

  if [ ! -f "$PAGE_FILE" ]; then
    echo "⚠️  Page file does not exist."
    echo "   Skipping — existing application structure will NOT be changed."
    return
  fi

  BACKUP_FILE="${PAGE_FILE}.phase7-backup"

  if [ ! -f "$BACKUP_FILE" ]; then
    cp "$PAGE_FILE" "$BACKUP_FILE"
    echo "✅ Backup created:"
    echo "   $BACKUP_FILE"
  else
    echo "ℹ️  Backup already exists."
  fi

  if grep -q 'Phase7RouteIntegration' "$PAGE_FILE"; then
    echo "ℹ️  Phase 7 integration already exists."
    echo "   Skipping this page."
    return
  fi

  TMP_FILE="$(mktemp)"

  awk -v importLine="$PHASE7_IMPORT" '
    BEGIN { inserted=0 }

    {
      if (!inserted && $0 !~ /^[[:space:]]*$/) {
        print importLine
        print ""
        inserted=1
      }

      print
    }
  ' "$PAGE_FILE" > "$TMP_FILE"

  mv "$TMP_FILE" "$PAGE_FILE"

  TMP_FILE="$(mktemp)"

  awk -v route="$ROUTE" '
    BEGIN {
      inserted=0
      depth=0
      function countOpen(s,    x) {
        x=gsub(/[({[]/, "&", s)
        return x
      }
      function countClose(s,    x) {
        x=gsub(/[)}\]]/, "&", s)
        return x
      }
    }

    {
      print

      if (!inserted && $0 ~ /return[[:space:]]*\(/) {
        print ""
        print "      {/* ================================================== */}"
        print "      {/* PHASE 7 — 3D VISUALIZATION */}"
        print "      {/* ================================================== */}"
        print "      <Phase7RouteIntegration"
        print "        route=\"" route "\""
        print "        height={500}"
        print "      />"
        print ""
        inserted=1
      }
    }

    END {
      if (!inserted) {
        exit 2
      }
    }
  ' "$PAGE_FILE" > "$TMP_FILE" || {
    rm -f "$TMP_FILE"
    echo "⚠️  Could not automatically find the JSX return block."
    echo "   Import was added, but the scene was NOT inserted."
    echo "   This page needs manual placement."
    return
  }

  mv "$TMP_FILE" "$PAGE_FILE"

  echo "✅ 3D scene mounted successfully."
}

echo "[1/9] Sensor Hub"
add_scene \
  "$ROOT/src/pages/SensorHub.jsx" \
  "/sensor-hub" \
  "Sensor Hub"

echo "[2/9] Sensor Lab"
add_scene \
  "$ROOT/src/pages/SensorLab.jsx" \
  "/sensor-lab" \
  "Sensor Lab"

echo "[3/9] Irrigation Planner"
add_scene \
  "$ROOT/src/pages/IrrigationPlanner.jsx" \
  "/irrigation-planner" \
  "Irrigation Planner"

echo "[4/9] Farm Ledger"
add_scene \
  "$ROOT/src/pages/FarmLedger.jsx" \
  "/farm-ledger" \
  "Farm Ledger"

echo "[5/9] Expense Analytics"
add_scene \
  "$ROOT/src/pages/ExpenseAnalytics.jsx" \
  "/expense-analytics" \
  "Expense Analytics"

echo "[6/9] Yield Benchmarks"
add_scene \
  "$ROOT/src/pages/YieldBenchmarks.jsx" \
  "/yield-benchmarks" \
  "Yield Benchmarks"

echo "[7/9] Harvest Records"
add_scene \
  "$ROOT/src/pages/HarvestRecords.jsx" \
  "/harvest-records" \
  "Harvest Records"

echo "[8/9] Inventory Tracker"
add_scene \
  "$ROOT/src/pages/InventoryTracker.jsx" \
  "/inventory-tracker" \
  "Inventory Tracker"

echo "[9/9] Equipment Registry"
add_scene \
  "$ROOT/src/pages/EquipmentRegistry.jsx" \
  "/equipment-registry" \
  "Equipment Registry"

echo ""
echo "=============================================================="
echo "🔍 CHECKING PHASE 7 INTEGRATION"
echo "=============================================================="

echo ""
echo "Phase 7 integration files:"
echo ""

find "$ROOT/src/components/phase7" \
  -maxdepth 2 \
  -type f \
  -print

echo ""
echo "Checking mounted pages..."
echo ""

for FILE in \
  "$ROOT/src/pages/SensorHub.jsx" \
  "$ROOT/src/pages/SensorLab.jsx" \
  "$ROOT/src/pages/IrrigationPlanner.jsx" \
  "$ROOT/src/pages/FarmLedger.jsx" \
  "$ROOT/src/pages/ExpenseAnalytics.jsx" \
  "$ROOT/src/pages/YieldBenchmarks.jsx" \
  "$ROOT/src/pages/HarvestRecords.jsx" \
  "$ROOT/src/pages/InventoryTracker.jsx" \
  "$ROOT/src/pages/EquipmentRegistry.jsx"
do
  if [ -f "$FILE" ]; then
    if grep -q "Phase7RouteIntegration" "$FILE"; then
      echo "✅ $(basename "$FILE")"
    else
      echo "⚠️  $(basename "$FILE") — not mounted"
    fi
  else
    echo "⚪ $(basename "$FILE") — page does not exist"
  fi
done

echo ""
echo "=============================================================="
echo "🏗️  RUNNING BUILD"
echo "=============================================================="
echo ""

npm run build

echo ""
echo "=============================================================="
echo "✅ PHASE 7 INTEGRATION FINISHED"
echo "=============================================================="
echo ""
echo "The 3D component is now mounted into existing pages where"
echo "the corresponding page files and JSX return blocks existed."
echo ""
echo "Backups:"
echo "  *.phase7-backup"
echo ""
echo "Test with:"
echo "  npm run dev"
echo ""
echo "Then open the Phase 7 routes in your browser."
echo ""
echo "=============================================================="
