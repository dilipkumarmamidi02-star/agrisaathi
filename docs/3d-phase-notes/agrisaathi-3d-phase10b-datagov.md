# AgriSaathi 3D Transformation — Phase 10b (`/data-gov`)

## What this is
The one real gap flagged at the end of Phase 10: `/data-gov`
(`DataGovLiveData.jsx`) is a substantial, fully-working page (real
resource registry, real API calls, real live/empty/error states) that
had never received a 3D treatment across Phases 1–9. Per spec §18 this
is a **Level-2 contextual** "Government Data Intelligence Center":
floating data streams, source nodes, freshness indicators — layered
*above* the real resource list and table, never replacing them (spec
§18: "Do NOT alter the underlying data architecture").

No new npm packages. Reuses the shared `three/core/SceneStage` engine
from Phase 1 — this phase adds one new scene + one new wrapper only.

## New files
- `frontend/src/three/scenes/GovDataScene.jsx` — the R3F scene
- `frontend/src/components/GovDataScene3D.jsx` — the page-ready wrapper
  (fixed height banner + a text legend, so the color mapping is never
  3D-only)

## Modified file
- `frontend/src/pages/DataGovLiveData.jsx` — two small additions only:
  1. `import GovDataScene3D from '../components/GovDataScene3D';`
  2. `<GovDataScene3D .../>` inserted right under the page header, above
     the existing error banner and summary cards.

  Nothing else in this 563-line file changed — every API call, state
  variable, and existing UI element is untouched.

## What you'll see, and why it's honest
The registry-core icosahedron and the ring of small nodes around it are
**entirely derived from the real state this page already computes**,
never invented:

- **Node count** = the real number of registered resources
  (`resources.length`), capped at 18 for legibility on a small banner.
- **Node color mix** = the real `summary.live` / `summary.empty` /
  `summary.errors` counts this page already calculates from actual API
  responses — green nodes for `LIVE-DATA`, amber for `LIVE-EMPTY`, red
  for `API-ERROR`, slate for not-yet-loaded. The proportions in the
  scene always match the real counts; there's no separate "looks good"
  ratio.
- **Registry core brightness** = `liveCount / resourceCount`, the same
  freshness ratio spec §18 asks to make "visually obvious." More real
  live data → brighter green core; more real errors → the core dims
  toward amber/slate. Nothing here is a fixed animation — an all-error
  registry will show a dim, mostly-red scene, not a falsely cheerful one.
- **Pulse speed** ticks up only while `loadingKey` is actually truthy
  (a real fetch is in flight), per spec §72's loading-state guidance.
- A text legend is overlaid on the banner itself (not just implied by
  color) so the mapping doesn't depend on 3D rendering succeeding —
  consistent with spec §75 (3D is enhancement, never the only way to
  get the information).

## How to apply
1. Confirm Phases 1–10 are already applied.
2. Copy `frontend/src/three/scenes/GovDataScene.jsx` and
   `frontend/src/components/GovDataScene3D.jsx` into your real tree.
3. Replace `frontend/src/pages/DataGovLiveData.jsx` with the version in
   this zip (or apply the two-line diff described above by hand if you
   have local edits to that file since the base zip).
4. `npm run lint` / `npm run build` (also esbuild-syntax-checked here).

## Module visual registry (spec §87)

| Route | Scene | Context prop(s) | Data source |
|---|---|---|---|
| /data-gov | GovDataScene | resourceCount, liveCount, emptyCount, errorCount, loading | real `getDataGovResources` / `getDataGovResourceRecords` calls already on the page |

## Status: full route coverage complete
With Phase 10 + 10b, every route in spec §3's full list — core,
detail, and authentication — now has a real, data-driven 3D treatment
at its appropriate level (1/2/3). `/community` and `/livestock-care`
were re-confirmed to already inherit their treatment from Phase 8
(`CommunityForum`) and Phase 4 (`Livestock`) respectively, so no
further route work remains against the original spec.

If you'd like, the next useful step is a real `npm run lint && npm run
build` pass against your actual working tree with **all** phases
merged in at once (I've only been able to lint/parse each phase's new
files in isolation here, since I don't have your live repo state) —
that would catch any cross-phase import path drift before you ship.
