# AgriSaathi 3D Transformation — Phase 4

Livestock → Animal Encyclopedia → Animal Encyclopedia Detail.

## Prerequisite
Apply Phases 1–3 first. This phase only adds new files under
`three/config/`, `three/scenes/`, and `components/`, plus edits to the
three pages listed above.

## How to apply
Copy every file under this zip's `frontend/src/` into your real
`frontend/src/`, preserving paths. `npm run build` — clean already (one
small bug caught and fixed during this phase's own lint pass, see below).

## An important adaptation, said plainly

The spec assumed `/livestock-care` would be a personal herd-health
tracker (health status, feeding, vaccination per animal). The actual
`Livestock.jsx` in this repo is something else: a **government census
data browser** — it lists district-wise official livestock population
counts from Data.gov.in, with real aggregate totals per species already
computed (`totalCattle`, `totalBuffalo`, `totalSheep`, `totalGoat`,
`totalPoultry`, and now `totalPig`, which I added using the page's own
existing helper).

Rather than force a fictional health-tracker UI onto a census browser,
the 3D layer reflects what the page actually is: a herd scene shows the
*real* dominant species for whatever state/district is currently
selected, with the number of animal instances log-scaled from the real
aggregate count (so a herd of 40,000 doesn't try to render 40,000
meshes, while a herd of 40 still looks visibly smaller than one of
400,000). Switch state or filter by district and the dominant category
— and the scene — updates from the real numbers, satisfying the
spec's actual acceptance test ("Dairy selected → cows. Poultry selected
→ chickens.") using this page's real data shape instead of an invented
one.

## What's real in each page

**Livestock** — herd scene as described above, driven entirely by the
real per-species totals for the current filter.

**Animal Encyclopedia** — expanding a category card (Poultry, Dairy,
Goat & Sheep, Fisheries, Apiculture, Piggery, Rabbit) now shows a live
3D preview of that real category, matching the same "browse list with a
reacting preview" pattern used for Crops in Phase 2.

**Animal Encyclopedia Detail** — full drag-to-rotate/pinch-to-zoom
showcase (`OrbitControls`), and tapping a real `yield_timeline` entry
(the animal-side equivalent of a crop's growth timeline) scales the 3D
animal toward full maturity — the same interaction pattern as Crop
Encyclopedia Detail's growth stages in Phase 2.

## New shared engine pieces
- `three/config/animalVisuals.js` — data-driven category→visual map
  (mirrors `cropVisuals.js`), plus `dominantAnimalCategory()` for
  picking a category from real aggregate totals.
- `three/scenes/AnimalModel.jsx` — the one shared animal renderer.
  Fish (no legs) and apiculture (a hive + orbiting dots) get their own
  small recipes since forcing them into the general body+legs shape
  wouldn't read as anything recognizable; every other category uses
  the shared body+legs+optional-horns recipe with per-category colors
  and proportions.

## One bug caught in this phase's own QA
While cleaning up a lint warning in `AnimalModel.jsx`, an early
`str_replace` edit briefly deleted the `return (...)` wrapper of the
fish-shape component. The build/lint loop this whole project follows
caught it immediately (build did NOT stay clean) and it was fixed
before this zip was assembled — final `npm run build` and `npx eslint`
are both clean. Mentioned here because "was it actually tested"
matters more than "does it look done."

## Next phase
**Market Prices, Weather (+ Alerts/Analytics), Speak to AgriSaathi** —
this is also where Dashboard's weather prop (already wired to read
from global context) gets a second real writer, since Weather's own
page fetches more detailed weather than Home's. Say "next phase" to
continue.
