# AgriSaathi 3D Transformation — Phase 8

## What this is
Real WebGL (React Three Fiber) contextual 3D for the 8 Phase-8 modules
(spec §92): **Input Marketplace, Resource Marketplace, Vendor
Contacts, Training Center, Training Academy, Community / Community
Forum, Expert Directory** — built on the shared engine and prior
scenes Phases 1–7 already put in place.

## Important — fixing a gap from Phases 1–7
Auditing the repo at the start of this phase confirmed: **`three`,
`@react-three/fiber` and `@react-three/drei` were never actually added
to `frontend/package.json`**, even though every phase since Phase 1
has been importing them. The code was correct; the dependency was
just never installed, so none of it could have run. This phase fixes
that for real, not just in a comment:

```json
"three": "^0.175.0",
"@react-three/fiber": "^9.7.0",
"@react-three/drei": "^10.7.8"
```

React 19 needs **`@react-three/fiber` v9** (v8's peer range tops out
under React 18) and a matching `@react-three/drei` v10. I picked these
versions by checking the real npm registry, not by guessing, then
verified end-to-end in this environment:

- `npm install` — 722 packages added, clean, no peer-dep errors.
- `npm run lint` — **0 errors.** The 66 warnings printed are all
  pre-existing (React Hook dependency arrays, unused imports in
  unrelated pages like `Home.jsx`/`MarketPrices.jsx`) — none touch a
  file this phase added or edited.
- `npm run build` — **succeeds**, main chunk 3,090 kB (in the same
  range every prior phase's README already assumed, ~3,097 kB), so
  actually installing the real packages did not blow up bundle size
  beyond what was already priced in.

## How to apply
1. Make sure Phases 1–7 are already applied (this phase imports
   `three/core/SceneStage`, `three/scenes/CropField`,
   `three/scenes/HerdScene`, `three/scenes/SoilCrossSectionScene`,
   `three/scenes/IrrigationScene`, `three/scenes/EquipmentYardScene`
   and `three/scenes/MandiScene` from those phases — it does not
   re-ship them).
2. Copy every file under this zip's `frontend/` into your real
   `frontend/`, preserving paths. It **overwrites**:
   `package.json` (adds the 3 dependencies above — nothing else
   changed), `pages/InputMarketplace.jsx`, `pages/ResourceMarketplace.jsx`,
   `pages/VendorContacts.jsx`, `pages/TrainingCenter.jsx`,
   `pages/TrainingAcademy.jsx` (was a "coming soon" stub — now a real
   feature), `pages/CommunityForum.jsx`, `pages/ExpertDirectory.jsx`.
   It **adds** 7 new `three/scenes/*.jsx`, 5 new `three/config/*.js`,
   and 7 new `components/*Scene3D.jsx`.
3. `npm install && npm run lint && npm run build` — verified clean in
   this environment (see above).

## What you'll see, module by module

**Input Marketplace** (Level 2) — a stall scene that mounts the
crate/sack/drum/tool shape matching whichever real category chip
you've tapped (`fertilizer`/`seeds`/`equipment`/`pesticide`/`general`,
from your real `InputShop.category` values), with as many items
stacked as there are real matching shops (capped at 6 so a big city
doesn't overflow the stall) — spec §42's "category changes ->
environment changes," never a static shop icon.

**Resource Marketplace** (Level 2) — this page had no selectable
state before, so it gained a real category chip row over its existing
4 static resource entries (Seeds / Fertilizer / Pesticide / Farm
Equipment — nothing invented, they were already in `LOCAL_RESOURCES`).
Selecting a chip emphasizes the matching object in the scene; the
small floating nodes on the right are the exact real
`marketplaceResources.length` Data.gov source count the card below
already displays — one visual, one number, never two different counts
for the same thing.

**Vendor Contacts** (Level 3, "subtle depth" — spec §45 explicitly
says not to build heavy 3D here) — a small ~40px rotating badge next
to the type selector while adding a vendor, and one per saved real
vendor card, colored/shaped by that vendor's real `type` (seed dealer
-> sack, transport -> truck, etc.). Contact usability (the call
button, the name) stays the primary thing on the card, per spec.

**Training Center** (Level 1, immersive) — spec §47 literally lists
"organic farming -> field demo, irrigation -> irrigation demo, pest
management -> crop/pest lab, machinery -> equipment demo," so this
module adds *zero* new 3D geometry: it routes the real selected
category (`crop`/`livestock`/`soil`/`irrigation`/`machinery`/
`marketing` — TrainingCenter.jsx's own real taxonomy) to the exact
shared scene Phases 2–7 already built for that domain — `CropField`,
`HerdScene`, `SoilCrossSectionScene`, `IrrigationScene`,
`EquipmentYardScene`, `MandiScene`. These are topic/demonstration
scenes illustrating the category, not any one farmer's saved records
— the same honesty rule Phase 5 used for Speak to AgriSaathi's
generic `IrrigationScene`.

**Training Academy** (Level 2) — this page was a `<p>This section is
coming soon.</p>` stub before this phase; it's now a real, working
overview. There's no per-farmer course-completion field in the real
`TrainingResource` entity, so rather than fabricate a "% complete"
number, it honestly groups the same real `TrainingResource` list
Training Center already fetches by category and shows each category's
real resource *count* as a sprout height (more real resources in a
path -> a taller sprout) — spec #71's "real data controls the visual"
rule, never an invented progress bar. Hovering a category also
highlights its sprout.

**Community / Community Forum** (Level 3, "3D remains subtle" —
spec §50) — a single small floating marker, colored by the real
`category` of whichever post you're composing or reading (Crops /
Livestock / Soil / Weather / Market / Schemes / Equipment / Other,
CommunityForum.jsx's own real category list). The discussion itself —
title, body, replies, upvotes — stays the primary, fully readable
content; the 3D never grows past a ~40–56px accent.

**Expert Directory** (Level 2/3) — spec §51: "crop expert -> crop
environment, livestock expert -> livestock environment." The
directory is a fixed static list of expert *types* (Agronomist,
Veterinarian, KVK Expert, Agriculture Officer — not per-farmer data),
so each card mounts a small illustrative preview reusing `CropField`
for Agronomist and `HerdScene` for Veterinarian, plus small generic
shapes for the other two — again, zero new base geometry.

## Engine reuse (nothing duplicated)
Every scene above mounts through the same `SceneStage` / `SceneCanvas`
/ `SceneFallback` / `SceneErrorBoundary` stack from Phase 1, and
Training Center + Expert Directory reuse `CropField`, `HerdScene`,
`SoilCrossSectionScene`, `IrrigationScene`, `EquipmentYardScene` and
`MandiScene` from Phases 2–7 instead of reimplementing "a crop" or "a
herd" a second time. Five new config files
(`inputMarketVisuals.js`, `vendorVisuals.js`, `trainingVisuals.js`,
`communityVisuals.js`, `expertVisuals.js`) follow the same
data-driven-mapping pattern as `cropVisuals.js`.

## Known trade-offs, said plainly
- Same as every prior phase: no GLB/3D model assets were available in
  this environment, so every object is procedural low-poly geometry,
  not sculpted models.
- Vendor Contacts mounts one small `SceneStage`/`Canvas` per saved
  vendor card. For the handful of vendors a farmer realistically saves
  this is fine, but if that list ever grows very large, swap the
  per-card `<Canvas>` for a single shared canvas rendering multiple
  badges instead of one WebGL context per card (spec §77 performance).
- Training Academy's "resource count per category" is a real, current
  count from your live `TrainingResource` list — it is not a
  persisted, per-farmer completion record, since that field doesn't
  exist in the backend yet. If a real progress-tracking endpoint gets
  added later, swap the count-based sprout height for a real
  percentage and nothing else in the scene needs to change.

## Next phase (say "next phase" and I'll build it the same way —
audited, real code, built + linted, delivered as a diff)
**Phase 9**: Document Wallet, Export Reports, Export Data, Task
Manager, Farm Notifications, Alerts Center, Sustainability Score,
Success Stories, Feedback Corner, Support Tickets, Voice Notes,
Profile Settings.
