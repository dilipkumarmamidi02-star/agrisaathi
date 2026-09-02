path = "src/pages/CropPlanner.jsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

old_import = "import { STATES } from '../lib/indianLocations';"
new_import = old_import + """

const FALLBACK_CROPS = [
  { id: 'rice', name_en: 'Rice', category: 'Cereal', typical_states: 'Telangana, Andhra Pradesh, West Bengal, Punjab', water_requirement: 'High', season: 'Kharif', duration_days: '120-150' },
  { id: 'wheat', name_en: 'Wheat', category: 'Cereal', typical_states: 'Punjab, Uttar Pradesh, Madhya Pradesh, Haryana', water_requirement: 'Medium', season: 'Rabi', duration_days: '110-130' },
  { id: 'cotton', name_en: 'Cotton', category: 'Cash Crop', typical_states: 'Maharashtra, Gujarat, Telangana, Andhra Pradesh', water_requirement: 'Medium', season: 'Kharif', duration_days: '150-180' },
  { id: 'groundnut', name_en: 'Groundnut', category: 'Oilseed', typical_states: 'Gujarat, Andhra Pradesh, Tamil Nadu, Karnataka', water_requirement: 'Low', season: 'Kharif', duration_days: '100-130' },
  { id: 'chilli', name_en: 'Chilli', category: 'Spice', typical_states: 'Andhra Pradesh, Telangana, Karnataka', water_requirement: 'Medium', season: 'Kharif', duration_days: '150-180' },
  { id: 'soybean', name_en: 'Soybean', category: 'Oilseed', typical_states: 'Madhya Pradesh, Maharashtra, Rajasthan', water_requirement: 'Medium', season: 'Kharif', duration_days: '90-110' },
  { id: 'maize', name_en: 'Maize', category: 'Cereal', typical_states: 'Karnataka, Madhya Pradesh, Bihar, Telangana', water_requirement: 'Medium', season: 'Kharif', duration_days: '90-110' },
  { id: 'turmeric', name_en: 'Turmeric', category: 'Spice', typical_states: 'Telangana, Andhra Pradesh, Tamil Nadu', water_requirement: 'Medium', season: 'Kharif', duration_days: '210-240' },
  { id: 'sugarcane', name_en: 'Sugarcane', category: 'Cash Crop', typical_states: 'Uttar Pradesh, Maharashtra, Karnataka', water_requirement: 'High', season: 'Perennial', duration_days: '300-365' },
];
"""

if old_import in content and "FALLBACK_CROPS" not in content:
    content = content.replace(old_import, new_import, 1)
    print("fallback crop list inserted")
else:
    print("import anchor not found or already patched")

old_fetch = "base44.entities.Crop.list('name_en', 300).then(setCrops).catch(() => []);"
new_fetch = """base44.entities.Crop.list('name_en', 300).then((list) => {
      setCrops(list && list.length > 0 ? list : FALLBACK_CROPS);
    }).catch(() => setCrops(FALLBACK_CROPS));"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch, 1)
    print("crop fetch patched to fall back to real seed data when store is empty")
else:
    print("crop fetch line not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
