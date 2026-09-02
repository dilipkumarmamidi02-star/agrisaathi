# AgriSaathi 3D Transformation — Phase 3

Diagnose → Treatments → Soil Passport → Fertilizer → Pest Library.

## Prerequisite
Apply Phase 1 + Phase 2 (parts 1 & 2) first — this phase's scenes build
on `three/scenes/CropField.jsx` and `three/core/SceneStage.jsx` from
those zips.

## How to apply
Copy every file under this zip's `frontend/src/` into your real
`frontend/src/`, preserving paths. `npm run build` — already verified
clean (0 lint errors introduced; the few warnings that show are
pre-existing in `SoilPassport.jsx` from before this phase).

## What's real in each page

**Diagnose** — step 2 now shows a live crop preview the moment you pick
a crop (livestock domain intentionally has no 3D yet — that's Phase 4's
job, and I didn't want to fake an animal model). Step 3, once a real
diagnosis comes back, shows the same crop with a red affected-region
pulse sized by the API's own `confidence` score — no result yet means
no highlight, never a guessed one.

**Treatments** — crop reacts to your real crop selection; once a result
arrives, a green ring appears if it recommends an organic treatment, a
blue ring if chemical, both if both.

**Soil Passport** — this was the big one (1650-line file, edited
surgically, not rewritten). Added a real interactive cross-section:
topsoil/subsoil layers plus five bars for pH/N/P/K/organic-carbon, all
pulled straight from your farmer-entered `SoilRecord` fields — nothing
invented, and no moisture layer since that entity doesn't track it.
Tapping a record card in "My Soil Records" makes it the active one in
the 3D view; tapping a nutrient chip (pH/N/P/K/OC) highlights that bar.

**Fertilizer** — crop reacts to selection. Once a calculation result
comes back, a colored glow shows which nutrient it's really about: I
added a small real-text-matching helper (`detectNutrientFocus`) that
reads the actual recommendation for "urea"/"DAP"/"MOP or potash"
keywords, falling back to whichever of your own entered N/P/K soil
numbers is lowest if the text doesn't say. Said plainly in code
comments — this is inference over real data, not an invented answer.

**Pest Library** — tapping a pest/disease/weed card shows its real
affected crop (parsed from the item's own `affects` field) with a
marker colored by its real `type` (red pest / orange disease / yellow
weed).

## Next phase
**Livestock, Livestock Care, Animal Encyclopedia (+ detail)** — this is
where the app gets its first real animal visuals (currently only
crops have 3D representations). Say "next phase" to continue.
