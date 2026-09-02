import re
path = "src/pages/CropPlanner.jsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

old_import = "import YieldEstimator from '../components/YieldEstimator';"
new_import = "import YieldEstimator from '../components/YieldEstimator';\nimport { STATES } from '../lib/indianLocations';"
if old_import in content and new_import not in content:
    content = content.replace(old_import, new_import, 1)

old_select = "<SelectContent className=\"max-h-72\">{profiles.map((p) => <SelectItem key={p.id} value={p.state_ut}>{p.state_ut}</SelectItem>)}</SelectContent>"
new_select = "<SelectContent className=\"max-h-72\">{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>"
if old_select in content:
    content = content.replace(old_select, new_select, 1)
    print("state select patched")
else:
    print("state select block not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
