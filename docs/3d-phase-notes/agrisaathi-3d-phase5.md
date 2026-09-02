# AgriSaathi 3D Transformation — Phase 5

Market Prices → Weather → Weather Alerts → Weather Analytics → Speak to
AgriSaathi.

## Prerequisite
Apply Phases 1–4 first. This phase only adds new files under
`three/config/`, `three/scenes/`, and `components/`, plus edits to the
five pages listed above.

## How to apply
Copy every file under this zip's `frontend/src/` into your real
`frontend/src/`, preserving paths — this overwrites `MarketPrices.jsx`,
`Weather.jsx`, `WeatherAlerts.jsx`, `WeatherAnalytics.jsx`, and
`SpeakToAgriSaathi.jsx`, and adds the rest as new files. `npm run build`
— verified clean against the real repo (0 lint errors introduced; the
11 warnings that show are pre-existing, same as prior phases' note).

## What's real in each page

**Market Prices** — a real 3D mandi under the header, built entirely
from `displayRecords` (the page's own already-fetched market data):
the top 2–3 commodities by how many records are present get a stall
each, the one matching your real `commodityFilter` (or the most common
one, if you haven't filtered) is centered and shown at full size, and
its real modal price + market name float over the scene. No commodity
or price is invented — an empty filter result shows an empty stall
rather than a fabricated one. The active commodity/market is also
pushed into the shared context, so if Speak to AgriSaathi's "market"
topic ever overlaps with what you were just browsing, it's consistent.

**Weather** — a real weather diorama (sun/clouds/rain/fog, ground grass
that sways harder in real higher wind) driven by the same
`weather.description` this page already fetches, mapped through the
existing `mapWeatherDescriptionToCondition`. This page fetches more
detail than Home's hero, so it becomes a second real writer of the
shared `weather` context key — Dashboard's farm scene (Phase 1) already
reads that key, so visiting `/weather` now updates Dashboard's
background too, with no changes needed on the Dashboard side.

**Weather Alerts** — same diorama, but driven by real **WMO weather
codes** from the Open-Meteo forecast this page already fetches (a
different real value shape than Weather.jsx's free-text description, so
it gets its own mapper, `mapWmoCodeToCondition`, in the new
`marketVisuals.js`). If a real extreme (storm/heavy rain/high
wind/heatwave) is present in the 5-day forecast, the scene reflects
that worst real day rather than today's plain forecast — "storm warning
→ storm" per the spec's own acceptance test — and falls back to today's
code when there's nothing extreme.

**Weather Analytics** — the same diorama again, kept small (spec #32:
data stays primary, 3D is background context only) and driven by the
same `current` value already rendered in the stat grid above it.

**Speak to AgriSaathi** — a new `detectSpeakTopic()` (same file, same
style as the existing `extractCropKeyword()`) reads the real transcript
and picks one of `pest / market / scheme / irrigation / weather / crop
/ default` by keyword, checked in an order that matches the spec's own
acceptance tests ("how do I control pests in paddy" → pest, not just
crop; "today's tomato price" → market, not crop). The scene changes
right after the UNDERSTANDING step, before retrieval — matching spec
§14's "scene should change AFTER the system identifies the
topic/response," using the identified topic rather than waiting on the
(separate, and sometimes unavailable) KCC answer. `crop`/`market`
topics reuse the existing `CropPreviewScene`/`PestScene`/`MandiScene`;
`irrigation`/`scheme` get two new small scenes since nothing existing
fit. The **weather** topic is the one honest limitation here: this page
has no forecast fetch of its own, so instead of inventing a condition
it reads whatever real value Home/Weather already wrote to the shared
context this session (spec §66's context engine, put to actual use) —
if nothing's been fetched yet this session, it stays neutral rather
than guessing.

## New shared engine pieces
- `three/config/marketVisuals.js` — commodity→shape mapping (reuses
  `cropVisuals.js`'s color, since a tomato is the same color at the
  mandi as in the field) + `mapWmoCodeToCondition()`.
- `three/scenes/MandiScene.jsx` — the shared mandi-stall renderer, used
  by both Market Prices and Speak to AgriSaathi's market topic.
- `three/scenes/WeatherScene.jsx` — a compact, card-sized version of
  Phase 2's `HomeHeroScene` (same `WEATHER_VISUALS`, no mountains),
  used by all three weather pages instead of three separate
  implementations. Also reacts to real wind speed, which the Home hero
  currently doesn't receive.
- `three/scenes/IrrigationScene.jsx`, `SchemeScene.jsx` — two small new
  scenes for Speak topics nothing existing covered.
- `three/scenes/SpeakContextScene.jsx` — the topic switch itself.

## Next phase
**Near Me, Government Schemes, Insurance Hub, Insurance Vault, Loan
Eligibility, Loan Calculator** — say "next phase" to continue.
