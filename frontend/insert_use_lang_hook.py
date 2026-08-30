#!/usr/bin/env python3
"""
Run from ~/Downloads/agrisaathi/frontend AFTER patch_i18n_batch1.py:
    python3 insert_use_lang_hook.py

For each file listed below, finds the component's function declaration
(matched by filename) and inserts `const { t } = useLang();` as the first
line inside its body, if not already present.
"""
import re

FILES = [
    "src/components/Layout.jsx",
    "src/components/LocationFields.jsx",
    "src/components/PincodeLocationFields.jsx",
    "src/components/YieldEstimator.jsx",
    "src/components/ProfitCalculator.jsx",
    "src/components/AgriHelperWidget.jsx",
    "src/pages/FarmLedger.jsx",
    "src/pages/Placeholder.jsx",
    "src/pages/SpeakToAgriSaathi.jsx",
    "src/pages/NearMe.jsx",
    "src/pages/SensorLab.jsx",
    "src/pages/InventoryTracker.jsx",
    "src/pages/EquipmentRegistry.jsx",
    "src/pages/VendorContacts.jsx",
    "src/pages/Fertilize.jsx",
    "src/pages/Login.jsx",
    "src/pages/CropPlanner.jsx",
    "src/pages/SupportTickets.jsx",
    "src/pages/CropPassport.jsx",
    "src/pages/SuccessStories.jsx",
    "src/pages/GovernmentSchemes.jsx",
    "src/pages/FarmNotifications.jsx",
    "src/pages/PestLibrary.jsx",
    "src/pages/Home.jsx",
    "src/pages/YieldBenchmarks.jsx",
    "src/pages/AlertsCenter.jsx",
    "src/pages/ExportData.jsx",
    "src/pages/SustainabilityScore.jsx",
    "src/pages/WeatherAnalytics.jsx",
    "src/pages/ExpertDirectory.jsx",
    "src/pages/InsuranceVault.jsx",
    "src/pages/TrainingAcademy.jsx",
    "src/pages/ResourceMarketplace.jsx",
    "src/pages/FeedbackCorner.jsx",
    "src/pages/Livestock.jsx",
    "src/pages/SoilPassport.jsx",
]

HOOK_LINE = "  const {{ t }} = useLang();"

auto_done, already_had, manual_needed = [], [], []

for relpath in FILES:
    try:
        with open(relpath) as f:
            content = f.read()
    except FileNotFoundError:
        manual_needed.append((relpath, "file not found"))
        continue

    if re.search(r"\bconst\s*{\s*t\s*}\s*=\s*useLang\(\)", content) or \
       re.search(r"\bconst\s*{\s*[\w,\s]*\bt\b[\w,\s]*}\s*=\s*useLang\(\)", content):
        already_had.append(relpath)
        continue

    basename = relpath.split("/")[-1].replace(".jsx", "")

    patterns = [
        # export default function Name(...) {
        rf"(export\s+default\s+function\s+{basename}\s*\([^)]*\)\s*{{)",
        # function Name(...) {   (with export default Name elsewhere)
        rf"(function\s+{basename}\s*\([^)]*\)\s*{{)",
        # const Name = (...) => {
        rf"(const\s+{basename}\s*=\s*\([^)]*\)\s*=>\s*{{)",
        # export default function(...) {  (anonymous, only if basename matches file convention loosely)
    ]

    matched = False
    for pat in patterns:
        m = re.search(pat, content)
        if m:
            insert_at = m.end()
            content = content[:insert_at] + "\n" + HOOK_LINE.format() + content[insert_at:]
            with open(relpath, "w") as f:
                f.write(content)
            auto_done.append(relpath)
            matched = True
            break

    if not matched:
        manual_needed.append((relpath, "no matching component declaration pattern found"))

print(f"\nAuto-inserted hook: {len(auto_done)} files")
for f in auto_done:
    print(f"  + {f}")

print(f"\nAlready had it: {len(already_had)} files")
for f in already_had:
    print(f"  = {f}")

print(f"\nNeeds manual fix: {len(manual_needed)} files")
for f, reason in manual_needed:
    print(f"  ! {f}  ({reason})")

print("\nRun `npm run dev` now and click through pages / switch language.")
print("If it builds clean, you're done with batch 1.")
