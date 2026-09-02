# AgriSaathi 3D Transformation — Phase 6

## What this is
Continues the same drop-in delta pattern as Phases 1–5. Implements the
spec's **Phase 6** module list:
- Near Me
- Government Schemes
- Insurance Hub
- Insurance Vault
- Loan Eligibility
- Loan Calculator

This depends on the shared engine already applied in earlier phases
(`three/core/`, `three/hooks/useDeviceCapability.js`, and
`three/scenes/CropField.jsx` + `three/config/cropVisuals.js` from
Phase 2b). Nothing in Phase 1–5 is modified.

## How to apply
1. Make sure Phases 1–5 are already applied (this phase reuses
   `SceneStage`, `SceneCanvas`, `CropField`, and `cropVisuals.js` from
   them — it does not re-ship those files).
2. Copy every file under this zip's `frontend/src/` into your real
   `frontend/src/`, preserving paths. It **overwrites**:
   `pages/NearMe.jsx`, `pages/GovernmentSchemes.jsx`,
   `pages/InsuranceHub.jsx`, `pages/InsuranceVault.jsx`,
   `pages/LoanEligibility.jsx`, `pages/LoanCalculator.jsx`,
   and adds 6 new `three/scenes/*.jsx` + 6 new `components/*Scene3D.jsx`.
3. `npm run build` / `npm run lint` — verified clean (0 lint errors,
   only pre-existing warnings unrelated to these files; build succeeds
   at ~3,096 kB main chunk, same as before this phase).

## What you'll see (Level-2 "contextual 3D" per spec §64 — none of
these are heavy worlds; all are small, subtle, and driven only by
real app data)

**Near Me** — spec #26 is explicit that the real OpenStreetMap +
Overpass-API map must never be replaced by decorative terrain, so it
isn't touched. A small beacon scene sits above it and reflects the
*real* selected filter (`all`/`kvk`/`market`/`shop`) by color, and
pulses faster once a specific list item is tapped — matching the
spec's acceptance test ("KVK selected → KVK … pulse → focus").

**Government Schemes** — a stack of benefit-document cards (reusing
the same motif Phase 5 built for Speak-to-AgriSaathi's scheme topic).
Card count reflects how many real schemes loaded for the selected
state; the accent stripe only turns green/red/amber once the farmer
has actually run a real eligibility check on an opened scheme —
nothing is guessed ahead of that.

**Insurance Hub** — the tapped policy's real `crop_name` renders as an
actual `CropField` (same crop → visual mapping used everywhere else in
the app), with a shield ring above it colored/pulsing by the real
`claim_status` (filed/under review pulse, approved/none calm, rejected
neutral gray). Zero policies → an empty waiting field, per the spec's
empty-state rule, not a blank box.

**Insurance Vault** — was a "coming soon" stub; now a real, read-only
secured view of the farmer's actual `InsurancePolicy` records (no
separate document entity exists in the backend, so this doesn't invent
a fake file system — it treats the existing policy data as the
securable record, per spec #71/#90/#91). A small stacked-and-locked
vault scene shows one card per real policy.

**Loan Eligibility** — the farmer's first registered farm's crop
renders as a full, healthy `CropField` at all times (it represents
their real plot, not a verdict). Only a small floating seal above it
changes color with the *most recently checked* real AI eligibility
result — informational, never implying a guaranteed approval, per
spec #45's explicit warning.

**Loan Calculator** — the 2D recharts repayment-schedule bar chart
stays the primary, readable data view per spec #46. A small coin-stack
accent above it splits green/amber using the *exact same*
principal/interest numbers the chart uses (no separate estimate), and
updates immediately as the amount/rate/tenure sliders change.

## Verified
- `npm run build` — succeeds.
- `npm run lint` — 0 errors; only pre-existing warnings in files this
  phase didn't touch.
