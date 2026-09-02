# AgriSaathi 3D Transformation — Phase 7

## What this is
Real WebGL (React Three Fiber) contextual 3D for the 9 Phase-7 modules
(spec §92): **Sensor Hub, Sensor Lab, Irrigation Planner, Farm Ledger,
Expense Analytics, Yield Benchmarks, Harvest Records, Inventory
Tracker, Equipment Registry** — built on the shared engine and crop
system Phases 1–6 already put in place. No new npm packages are
needed (`three` / `@react-three/fiber` / `@react-three/drei` were
already required from Phase 1).

## How to apply
1. Make sure Phases 1–6 are already applied (this phase imports
   `three/core/SceneStage`, `three/scenes/CropField`,
   `three/scenes/SoilCrossSectionScene`, and `three/scenes/IrrigationScene`
   from those phases — it does not re-ship them).
2. Copy every file under this zip's `frontend/src/` into your real
   `frontend/src/`, preserving paths. It **overwrites**:
   `pages/SensorHub.jsx`, `pages/SensorLab.jsx`,
   `pages/IrrigationPlanner.jsx`, `pages/FarmLedger.jsx`,
   `pages/ExpenseAnalytics.jsx`, `pages/YieldBenchmarks.jsx` (was a
   "coming soon" stub — now a full feature), `pages/HarvestRecords.jsx`,
   `pages/InventoryTracker.jsx`, `pages/EquipmentRegistry.jsx`, and
   `lib/i18n.jsx` (a few new keys only — nothing existing removed).
   It **adds** 9 new `three/scenes/*.jsx`, 2 new `three/config/*.js`,
   and 9 new `components/*Scene3D.jsx`.
3. `npm run build` / `npm run lint` — verified clean in this
   environment (0 lint errors, only the same pre-existing warnings the
   codebase already had before this phase; build succeeds at the same
   ~3,097 kB main-chunk size as Phase 6, so this phase added no new
   dependency weight).

## What you'll see, module by module

**Sensor Hub** (Level 1) — four IoT field nodes (pH / moisture / EC /
N), one per column your real `SensorTest.list()` already returns.
Pulse speed reflects whether your real *latest* reading sits inside a
normal band (slow pulse) or outside it (fast pulse); a node with no
reading yet stays dim and still. Zero readings → a calm empty field,
not a blank box.

**Sensor Lab** (Level 1) — spec §34 literally says "Soil tab → soil
layers, Water tab → water/irrigation visualization," so this reuses
the exact scenes already built for that: the Soil tab feeds your real
typed N/P/K/organic-carbon/pH values into Phase 3's
`SoilCrossSectionScene`; the Water tab mounts Phase 5's
`IrrigationScene` unmodified.

**Irrigation Planner** (Level 1) — a real `CropField` for your next
scheduled `IrrigationSession` (or your most recent one if nothing's
scheduled), with a genuinely different water-delivery animation per
real `method`: drip → animated drip lines, sprinkler → a rotating arc
with falling droplets, flood → a shimmering water sheet, furrow →
static furrow rows, rainfed → a drifting rain cloud, no irrigation
hardware. No session yet → an unwatered field at reduced growth, per
the spec's empty-state rule.

**Farm Ledger** (Level 3, "subtle depth" per spec §36 — this
explicitly says *not* to over-3D financial records) — a small
document-desk scene: the tilt/glow of the paper stack is green when
your real hash-chain `valid` flag is true, amber if it fails
integrity; two accent bars split by your real income/expense ratio.
Nothing here is a separate number from what the cards above already
show.

**Expense Analytics** (Level 2, "context not replacement" per spec
§37) — three small bars mirroring the *exact same* top-3
category totals and colors the pie chart below already renders — the
2D chart stays the primary, readable view.

**Yield Benchmarks** — this page was a `<p>This section is coming
soon.</p>` stub before this phase; it's now a real, working feature.
It groups your real `HarvestRecord` entries by crop, computes your
actual yield (quantity ÷ area_harvested, quintal/acre), and shows it
against (a) a labelled *indicative* regional-average reference table
(`three/config/yieldBenchmarks.js` — static public reference data,
never presented as live) and (b) your own best-ever single-harvest
result for that crop as the "target," so nothing is a promised or
invented number. Three `CropField` patches (all the same crop — spec
§38 explicitly warns against implying a different real-world scale)
are height-scaled by the real ratios, plus a bar chart with the same
three numbers. Crop selector appears only if you have records for more
than one crop; zero qualifying records → a message telling you what to
log, not a fabricated chart.

**Harvest Records** (Level 1) — `CropField` for your most recently
logged harvest's real crop; a small harvester sweeps across it once
you have at least one record, matching spec §39's "wheat → wheat field
+ harvester" example pattern for whichever crop you actually logged.

**Inventory Tracker** (Level 2) — one crate per real current-stock
item from your ledger snapshot, colored by its real category (Seed /
Fertilizer / Pesticide / Equipment / Fuel / Other); a crate glows amber
only for items your own real `low_stock_at` threshold flags as low —
matching spec §40's "do not make alerts distracting."

**Equipment Registry** (Level 1) — one shape per real registered
machine (tractor / harvester / pump / sprayer / generic tool, matched
from your free-text `type` field via `three/config/equipmentVisuals.js`
keyword lookup), pulsing red only when its real `next_maintenance` date
has actually passed — never a guessed status.

## Engine reuse (nothing duplicated)
Every scene above mounts through the same `SceneStage` /
`SceneCanvas` / `SceneFallback` / `SceneErrorBoundary` stack from
Phase 1 (WebGL fallback, device-tier quality, reduced-motion support,
crash isolation), and the crop-bearing scenes (Irrigation Planner,
Yield Benchmarks, Harvest Records) all reuse Phase 2b's `CropField`
instead of reimplementing "a patch of crop X." Two new config files
(`equipmentVisuals.js`, `yieldBenchmarks.js`) follow the same
data-driven-mapping pattern as `cropVisuals.js`.

## Known trade-off, said plainly
Same as every prior phase: no GLB/3D model assets were available in
this environment, so every object is procedural low-poly geometry
(boxes/cones/cylinders/spheres), not sculpted models. If you have
licensed GLB assets, drop them in `frontend/public/models/` and swap
the primitives in `three/scenes/*.jsx` for
`<primitive object={gltf.scene} />` — the data wiring stays the same.

The regional yield-benchmark figures in `yieldBenchmarks.js` are
static, hand-entered indicative averages (labelled as such in the UI's
disclaimer line), not a live government feed — there's no existing
backend endpoint for regional yield statistics to call instead. If one
gets added later, swap the constant lookup for a real fetch and the
rest of the page (grouping, ratios, chart, scene) needs no changes.

## Next phase (say "next phase" and I'll build it the same way —
audited, real code, built + linted, delivered as a diff)
**Phase 8**: Input Marketplace, Resource Marketplace, Vendor Contacts,
Training Center, Training Academy, Community, Community Forum, Expert
Directory.
