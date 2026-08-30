#!/usr/bin/env python3
"""
Run from ~/Downloads/agrisaathi/frontend:
    python3 patch_i18n_batch2.py
"""
import re

NEW_LABELS = {
    "dosage": ("Dosage", "मात्रा", "మోతాదు"),
    "method": ("Method", "विधि", "పద్ధతి"),
    "timing": ("Timing", "समय", "సమయం"),
    "organic": ("Organic", "जैविक", "సేంద్రియ"),
    "organicFirst": ("Organic", "जैविक", "సేంద్రియ"),
    "chemical": ("Chemical", "रासायनिक", "రసాయనిక"),
    "precautions": ("Precautions", "सावधानियां", "జాగ్రత్తలు"),
    "assumptions": ("Assumptions", "मान्यताएं", "అంచనాలు"),
    "margin": ("Margin", "मार्जिन", "మార్జిన్"),
    "search": ("Search", "खोजें", "వెతకండి"),
    "avgPh": ("Avg pH", "औसत pH", "సగటు pH"),
    "range": ("Range", "सीमा", "పరిధి"),
    "variation": ("Variation", "बदलाव", "వైవిధ్యం"),
    "avgEc": ("Avg EC", "औसत EC", "సగటు EC"),
    "suitableCropsAtPh": ("Suitable crops at this pH:", "इस pH पर उपयुक्त फसलें:", "ఈ pH వద్ద అనుకూలమైన పంటలు:"),
    "waterSamplesLabel": ("Water samples — pH & EC (up to 5)", "पानी के नमूने — pH और EC (5 तक)", "నీటి నమూనాలు — pH & EC (5 వరకు)"),
    "preHarvestInterval": ("Pre-harvest interval", "कटाई-पूर्व अंतराल", "కోత ముందు విరామం"),
    "source": ("Source", "स्रोत", "మూలం"),
    "soilTestOptionalNote": (
        "Soil test values are optional — leave blank to use full recommended dosage.",
        "मिट्टी परीक्षण मान वैकल्पिक हैं — पूरी अनुशंसित मात्रा उपयोग करने के लिए खाली छोड़ें।",
        "నేల పరీక్ష విలువలు ఐచ్ఛికం — పూర్తి సిఫార్సు చేసిన మోతాదును ఉపయోగించడానికి ఖాళీగా వదిలేయండి.",
    ),
    "diseasePestIssueLabel": ("Disease / pest / issue", "बीमारी / कीट / समस्या", "వ్యాధి / తెగులు / సమస్య"),
    "organicCarbon": ("Organic carbon (%)", "जैविक कार्बन (%)", "సేంద్రియ కార్బన్ (%)"),
}

FILE_PATCHES = {
    "src/pages/Fertilize.jsx": [
        ('<p className="text-xs text-gray-400">Soil test values are optional — leave blank to use full recommended dosage.</p>',
         "<p className=\"text-xs text-gray-400\">{t('soilTestOptionalNote')}</p>"),
        ('<p className="text-xs font-semibold text-gray-500">Dosage</p>', "<p className=\"text-xs font-semibold text-gray-500\">{t('dosage')}</p>"),
        ('<p className="text-xs font-semibold text-gray-500">Method</p>', "<p className=\"text-xs font-semibold text-gray-500\">{t('method')}</p>"),
        ('<p className="text-xs font-semibold text-gray-500">Timing</p>', "<p className=\"text-xs font-semibold text-gray-500\">{t('timing')}</p>"),
        ('<Leaf className="h-3 w-3" />Organic</p>', "<Leaf className=\"h-3 w-3\" />{t('organic')}</p>"),
        ('<p className="text-xs font-semibold text-amber-700">Precautions</p>', "<p className=\"text-xs font-semibold text-amber-700\">{t('precautions')}</p>"),
        ('<p className="text-xs font-semibold text-gray-400">Assumptions</p>', "<p className=\"text-xs font-semibold text-gray-400\">{t('assumptions')}</p>"),
    ],
    "src/pages/Treatments.jsx": [
        ('<Label className="mb-1.5 block">Disease / pest / issue</Label>', "<Label className=\"mb-1.5 block\">{t('diseasePestIssueLabel')}</Label>"),
        ('<p className="text-xs font-semibold text-gray-500">Method</p>', "<p className=\"text-xs font-semibold text-gray-500\">{t('method')}</p>"),
        ('<p className="text-xs font-semibold text-gray-500">Timing</p>', "<p className=\"text-xs font-semibold text-gray-500\">{t('timing')}</p>"),
        ("Pre-harvest interval: {result.pre_harvest_interval}", "{t('preHarvestInterval')}: {result.pre_harvest_interval}"),
        ("Source: {result.source}", "{t('source')}: {result.source}"),
    ],
    "src/pages/CropPlanner.jsx": [
        ('<div className="text-gray-400">Cost</div>', "<div className=\"text-gray-400\">{t('cost')}</div>"),
        ('<div className="text-gray-400">Revenue</div>', "<div className=\"text-gray-400\">{t('revenue')}</div>"),
        ('<div className="text-gray-400">Margin</div>', "<div className=\"text-gray-400\">{t('margin')}</div>"),
    ],
    "src/pages/SensorLab.jsx": [
        ('<div className="text-[10px] text-gray-400">Avg pH</div><div className="text-sm font-medium">{soilResult.avg_ph}</div>',
         "<div className=\"text-[10px] text-gray-400\">{t('avgPh')}</div><div className=\"text-sm font-medium\">{soilResult.avg_ph}</div>"),
        ('<div className="text-[10px] text-gray-400">Range</div>', "<div className=\"text-[10px] text-gray-400\">{t('range')}</div>"),
        ('<div className="text-[10px] text-gray-400">Variation</div>', "<div className=\"text-[10px] text-gray-400\">{t('variation')}</div>"),
        ('<p className="text-xs font-medium text-gray-700 mt-2">Suitable crops at this pH:</p>', "<p className=\"text-xs font-medium text-gray-700 mt-2\">{t('suitableCropsAtPh')}</p>"),
        ('<p className="text-sm font-medium mb-2">Water samples — pH & EC (up to 5)</p>', "<p className=\"text-sm font-medium mb-2\">{t('waterSamplesLabel')}</p>"),
        ('<div className="text-[10px] text-gray-400">Avg pH</div><div className="text-sm font-medium">{waterResult.avg_ph ?? \'—\'}</div>',
         "<div className=\"text-[10px] text-gray-400\">{t('avgPh')}</div><div className=\"text-sm font-medium\">{waterResult.avg_ph ?? '—'}</div>"),
        ('<div className="text-[10px] text-gray-400">Avg EC</div>', "<div className=\"text-[10px] text-gray-400\">{t('avgEc')}</div>"),
        ('<p className="text-xs mb-1">Organic carbon (%)</p>', "<p className=\"text-xs mb-1\">{t('organicCarbon')}</p>"),
    ],
}

# ---- patch i18n.jsx ----
i18n_path = "src/lib/i18n.jsx"
with open(i18n_path) as f:
    i18n_content = f.read()

added, skipped, insertion_lines = [], [], []
for key, (en, hi, te) in NEW_LABELS.items():
    if re.search(rf"^\s*{re.escape(key)}:\s*{{", i18n_content, re.M):
        skipped.append(key)
        continue
    insertion_lines.append(f"  {key}: {{ en: {en!r}, hi: {hi!r}, te: {te!r} }},")
    added.append(key)

if insertion_lines:
    marker = "export function LanguageProvider"
    idx = i18n_content.index(marker)
    close_idx = i18n_content.rindex("};", 0, idx)
    i18n_content = i18n_content[:close_idx] + "\n".join(insertion_lines) + "\n" + i18n_content[close_idx:]
    with open(i18n_path, "w") as f:
        f.write(i18n_content)

print(f"i18n.jsx: added {len(added)} keys, skipped {len(skipped)} already present.")

# ---- patch each file ----
for relpath, replacements in FILE_PATCHES.items():
    try:
        with open(relpath) as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  SKIP (not found): {relpath}")
        continue

    hits, misses = 0, 0
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new, 1)
            hits += 1
        else:
            misses += 1

    with open(relpath, "w") as f:
        f.write(content)
    print(f"  {relpath}: {hits} replaced, {misses} not found")

print("\nRun `npm run dev` and check Fertilize, Treatments, CropPlanner, SensorLab pages.")
