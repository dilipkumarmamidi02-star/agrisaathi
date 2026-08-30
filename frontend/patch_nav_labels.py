#!/usr/bin/env python3
"""
Run from ~/Downloads/agrisaathi/frontend:
    python3 patch_nav_labels.py
"""
import re

NEW_LABELS = {
    "animalEncyclopedia": ("Animal Encyclopedia", "पशु विश्वकोश", "జంతు విజ్ఞాన సర్వస్వం"),
    "marketPrices": ("Market Prices", "बाज़ार भाव", "మార్కెట్ ధరలు"),
    "govSchemes": ("Gov Schemes", "सरकारी योजनाएं", "ప్రభుత్వ పథకాలు"),
    "sensorLab": ("Sensor Lab", "सेंसर लैब", "సెన్సార్ ల్యాబ్"),
    "loanEligibility": ("Loan Eligibility", "ऋण पात्रता", "రుణ అర్హత"),
    "documents": ("Documents", "दस्तावेज़", "పత్రాలు"),
    "insurance": ("Insurance", "बीमा", "బీమా"),
    "inventory": ("Inventory", "इन्वेंटरी", "ఇన్వెంటరీ"),
    "tasks": ("Tasks", "कार्य", "పనులు"),
    "alerts": ("Alerts", "अलर्ट", "అలర్ట్‌లు"),
    "pestLibrary": ("Pest Library", "कीट पुस्तकालय", "తెగుళ్ల లైబ్రరీ"),
    "sustainability": ("Sustainability", "स्थिरता", "సుస్థిరత"),
    "experts": ("Experts", "विशेषज्ञ", "నిపుణులు"),
    "notifications": ("Notifications", "सूचनाएं", "నోటిఫికేషన్లు"),
    "vendors": ("Vendors", "विक्रेता", "విక్రేతలు"),
    "animals": ("Animals", "पशु", "జంతువులు"),
}

FILE_PATCHES = {
    "src/pages/Home.jsx": [
        ("label: 'Diagnose', color: 'bg-amber-50 text-amber-700' },\n    { to: '/fertilizer'",
         "label: t('diagnose'), color: 'bg-amber-50 text-amber-700' },\n    { to: '/fertilizer'"),
        ("label: 'Fertilizer', color: 'bg-blue-50 text-blue-700' }", "label: t('fertilizer'), color: 'bg-blue-50 text-blue-700' }"),
        ("label: 'Soil Passport', color: 'bg-green-50 text-green-700' }", "label: t('soil'), color: 'bg-green-50 text-green-700' }"),
        ("label: 'Crop Planner', color: 'bg-purple-50 text-purple-700' }", "label: t('planner'), color: 'bg-purple-50 text-purple-700' }"),
        ("label: 'Livestock', color: 'bg-rose-50 text-rose-700' }", "label: t('livestock'), color: 'bg-rose-50 text-rose-700' }"),
        ("label: 'Animal Encyclopedia', color: 'bg-fuchsia-50 text-fuchsia-700' }", "label: t('animalEncyclopedia'), color: 'bg-fuchsia-50 text-fuchsia-700' }"),
        ("label: 'Market Prices', color: 'bg-orange-50 text-orange-700' }", "label: t('marketPrices'), color: 'bg-orange-50 text-orange-700' }"),
        ("label: 'Near Me', color: 'bg-indigo-50 text-indigo-700' }", "label: t('nearMe'), color: 'bg-indigo-50 text-indigo-700' }"),
        ("label: 'Farm Ledger', color: 'bg-lime-50 text-lime-700' }", "label: t('ledger'), color: 'bg-lime-50 text-lime-700' }"),
        ("label: 'Crop Passport', color: 'bg-emerald-50 text-emerald-700' }", "label: t('cropPassportTitle'), color: 'bg-emerald-50 text-emerald-700' }"),
        ("label: 'Gov Schemes', color: 'bg-blue-50 text-blue-700' }", "label: t('govSchemes'), color: 'bg-blue-50 text-blue-700' }"),
        ("label: 'Community', color: 'bg-purple-50 text-purple-700' }", "label: t('community'), color: 'bg-purple-50 text-purple-700' }"),
        ("label: 'Weather', color: 'bg-sky-50 text-sky-700' }", "label: t('weather'), color: 'bg-sky-50 text-sky-700' }"),
        ("label: 'Sensor Lab', color: 'bg-cyan-50 text-cyan-700' }", "label: t('sensorLab'), color: 'bg-cyan-50 text-cyan-700' }"),
        ("label: 'Irrigation', color: 'bg-cyan-50 text-cyan-700' }", "label: t('irrigation'), color: 'bg-cyan-50 text-cyan-700' }"),
        ("label: 'Harvest', color: 'bg-amber-50 text-amber-700' }", "label: t('harvest'), color: 'bg-amber-50 text-amber-700' }"),
        ("label: 'Profile', color: 'bg-slate-50 text-slate-700' }", "label: t('profile'), color: 'bg-slate-50 text-slate-700' }"),
        ("label: 'Voice Notes', color: 'bg-rose-50 text-rose-700' }", "label: t('voice'), color: 'bg-rose-50 text-rose-700' }"),
        ("label: 'Loan Eligibility', color: 'bg-indigo-50 text-indigo-700' }", "label: t('loanEligibility'), color: 'bg-indigo-50 text-indigo-700' }"),
        ("label: 'Marketplace', color: 'bg-orange-50 text-orange-700' }", "label: t('marketplace'), color: 'bg-orange-50 text-orange-700' }"),
        ("label: 'Training', color: 'bg-teal-50 text-teal-700' }", "label: t('training'), color: 'bg-teal-50 text-teal-700' }"),
        ("label: 'Documents', color: 'bg-amber-50 text-amber-700' }", "label: t('documents'), color: 'bg-amber-50 text-amber-700' }"),
        ("label: 'Insurance', color: 'bg-purple-50 text-purple-700' }", "label: t('insurance'), color: 'bg-purple-50 text-purple-700' }"),
        ("label: 'Inventory', color: 'bg-blue-50 text-blue-700' }", "label: t('inventory'), color: 'bg-blue-50 text-blue-700' }"),
        ("label: 'Tasks', color: 'bg-green-50 text-green-700' }", "label: t('tasks'), color: 'bg-green-50 text-green-700' }"),
        ("label: 'Alerts', color: 'bg-amber-50 text-amber-700' }", "label: t('alerts'), color: 'bg-amber-50 text-amber-700' }"),
        ("label: 'Pest Library', color: 'bg-red-50 text-red-700' }", "label: t('pestLibrary'), color: 'bg-red-50 text-red-700' }"),
        ("label: 'Sustainability', color: 'bg-green-50 text-green-700' }", "label: t('sustainability'), color: 'bg-green-50 text-green-700' }"),
        ("label: 'Experts', color: 'bg-blue-50 text-blue-700' }", "label: t('experts'), color: 'bg-blue-50 text-blue-700' }"),
        ("label: 'Success Stories', color: 'bg-amber-50 text-amber-700' }", "label: t('successStoriesTitle'), color: 'bg-amber-50 text-amber-700' }"),
        ("label: 'Notifications', color: 'bg-cyan-50 text-cyan-700' }", "label: t('notifications'), color: 'bg-cyan-50 text-cyan-700' }"),
        ("label: 'Vendors', color: 'bg-teal-50 text-teal-700' }", "label: t('vendors'), color: 'bg-teal-50 text-teal-700' }"),
    ],
    "src/components/Layout.jsx": [
        ("{ path: '/', icon: Home, label: 'Home' }", "{ path: '/', icon: Home, label: t('home') }"),
        ("{ path: '/diagnose', icon: Camera, label: 'Diagnose' }", "{ path: '/diagnose', icon: Camera, label: t('diagnose') }"),
        ("{ path: '/near-me', icon: MapPin, label: 'Near Me' }", "{ path: '/near-me', icon: MapPin, label: t('nearMe') }"),
        ("{ path: '/crops', icon: Sprout, label: 'Crops' }", "{ path: '/crops', icon: Sprout, label: t('crops') }"),
        ("{ path: '/animal-encyclopedia', icon: PawPrint, label: 'Animals' }", "{ path: '/animal-encyclopedia', icon: PawPrint, label: t('animals') }"),
        ("{ path: '/dashboard', icon: User, label: 'Dashboard' }", "{ path: '/dashboard', icon: User, label: t('dashboard') }"),
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
    with open(relpath) as f:
        content = f.read()

    hits, misses = 0, 0
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new, 1)
            hits += 1
        else:
            misses += 1
            print(f"    MISS in {relpath}: {old[:70]}")

    with open(relpath, "w") as f:
        f.write(content)
    print(f"  {relpath}: {hits} replaced, {misses} not found")

print("\nRun `npm run dev` and check the Home tool grid + bottom nav in Hindi/Telugu.")
