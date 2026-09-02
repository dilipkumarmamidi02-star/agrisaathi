# AgriSaathi 3D Transformation — Phase 2, part 2

Home → Crops → Crop Encyclopedia Detail → Crop Planner → Crop Passport.

## Prerequisite
Apply the **Phase 1 + first Phase-2 slice** zip first (Login/Register/
Dashboard + the shared engine). This zip only adds new files and further
edits `Dashboard.jsx` (one line: it now reads real weather from the
global context instead of passing `null`) plus `three/scenes/
FarmCommandCenterScene.jsx` (refactored to reuse the new shared
`CropField` instead of its own duplicated blade code — same visuals,
less duplication).

## How to apply
1. Copy every file under this zip's `frontend/src/` into your real
   `frontend/src/`, preserving paths — this overwrites `Dashboard.jsx`,
   `Home.jsx`, `Crops.jsx`, `CropEncyclopediaDetail.jsx`, `CropPlanner.jsx`,
   `CropPassport.jsx`, `FarmCommandCenterScene.jsx`, and adds the rest as
   new files.
2. `npm run build` — this tree builds and lints clean already.

## What's real in each page

**Home** — cinematic hero (mountains, swaying grass, sky) whose color and
whether it's raining come from `weather.description`, the *real* value
Home already fetches from `/api/weather/current`. If the API is down,
`weather` is `null` and the hero shows a neutral default rather than
inventing a condition. The resolved condition is also pushed into the
global context, which is why Dashboard's farm scene now shows the same
weather rather than defaulting to sunny.

**Crops** — the browse/search list itself stays a list (a live-updating
3D scene per hovered card isn't practical for a scrollable grid of many
crops); what does react live is a preview strip driven by the category
filter chips — tap "Vegetables" and the preview becomes a tomato
patch, tap "Cash Crops" and it becomes cotton, immediately, no
navigation needed. Mapping in `three/config/cropVisuals.js`
(`CATEGORY_PREVIEW_CROP`).

**Crop Encyclopedia Detail** — the real showcase the spec asked for:
drag-to-rotate, pinch/scroll-to-zoom (`OrbitControls`) around the
selected crop, and tapping a growth-timeline entry (real data from
`cropEncyclopedia.json`) regrows/shrinks the 3D plant to that stage.
Tap the same stage again to return to fully grown.

**Crop Planner** — after ranking crops by fit, the top real match gets a
growth-stage explorer: a slider (Prep → Sowing → Germination →
Vegetative → Flowering → Harvest) that scales the 3D crop. This stage
scrubber is a genuinely new interactive control I added — the planner's
API doesn't return a stage itself, so it's presented as an exploration
tool over the real top-ranked crop, not as fetched data.

**Crop Passport** — three switchable layers over the real requirements +
ledger-chain response: Field & Crop (the plant), Soil (three bars sized
from the real `nitrogen_kg_ha`/`phosphorus_kg_ha`/`potassium_kg_ha`
numbers), and Ledger (a stack of blocks colored green/red from the real
`chain.valid`, with a spinning shield once verified). The Ledger tab is
disabled until a passport is actually generated — no fabricated chain
data.

## Reused engine pieces added this phase
- `three/scenes/CropField.jsx` — the one shared "a patch of crop X"
  renderer (blades, soil, optional standing water, growth-stage
  scaling). Dashboard's `FarmCommandCenterScene` was refactored to use
  it too, so there's now exactly one blade-rendering implementation in
  the whole app instead of two.
- `three/scenes/CropPreviewScene.jsx` — single-crop turntable built on
  `CropField`, reused by Crops' category preview, Crop Encyclopedia
  Detail, and Crop Planner.
- `cropVisuals.js` gained `mapWeatherDescriptionToCondition()` (maps a
  real free-text weather string to sunny/cloudy/rain/storm/fog — never
  guesses when there's no description) and `CATEGORY_PREVIEW_CROP`.

## Next phase
**Diagnose, Treatments, Soil Passport, Fertilizer, Pest Library** — say
"next phase" and I'll build it the same way: audit the real pages
first, wire scenes to real diagnosis/soil/fertilizer data only, build +
lint before handing it over.
