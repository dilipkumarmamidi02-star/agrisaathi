# AgriSaathi 3D Transformation — Phase 1 + first Phase-2 slice

## What this is
A drop-in set of files implementing:
- **Phase 1**: the shared 3D engine (`frontend/src/three/`) + the global
  context engine (`frontend/src/contexts/AgricultureContext.jsx`)
- **Phase 2 (part 1)**: real 3D on **Login**, **Register**, and **Dashboard**

## How to apply
1. `cd ~/Downloads/agrisaathi/frontend`
2. `npm install three @react-three/fiber @react-three/drei`
3. Copy every file under this zip's `frontend/src/` into your real
   `frontend/src/`, preserving paths (they overwrite `App.jsx`,
   `Login.jsx`, `Register.jsx`, `Dashboard.jsx`, and add the new
   `three/`, `contexts/`, and 3 new `components/*.jsx` files).
4. `npm run build` (or `npm run dev`) to verify — this exact tree
   already builds clean with `npm run build` and `npm run lint`.

## What you'll see

**Login / Register** — Level-3 "subtle depth" (per the spec: auth must
stay fast, no heavy 3D). Real WebGL via R3F: ~26 instanced leaves
drifting in 3D with soft ambient light, layered under the existing CSS
leaf accent. Falls back to a plain gradient with zero JS cost if WebGL
is unavailable or the device is very low-end.

**Dashboard** — Level-1 "3D Farm Command Center". This is fully
data-driven from your *real* dashboard state, not decoration:
- One field patch per real plot (`farms[]`), colored/sized by its real
  `current_crop` via `three/config/cropVisuals.js` (paddy → green +
  standing water, wheat → gold, cotton → pale, etc. — extend this file
  as you add more crops to the app's data).
- A plot pulses **red** if it has an urgent alert (`urgentCycles`).
- The livestock shed pulses **amber** if there are pending livestock
  care logs.
- Clicking a field navigates to `/crop-planner` with that plot's name
  and crop in router state; clicking the shed navigates to
  `/livestock-care`. This is real `useNavigate`, not a fake overlay.
- Zero plots yet → shows one empty waiting field instead of nothing
  (spec's empty-state rule), so first-time users aren't looking at a
  blank box.
- Weather isn't wired in yet because Dashboard.jsx doesn't currently
  fetch weather data — the scene defaults to a sunny look rather than
  inventing a condition. Wire `weather` prop once `/weather` data is
  available app-wide (see Phase 5 below).

## Engine pieces (reusable by every future module)
- `three/core/SceneStage.jsx` — the one import a page needs: bundles
  WebGL-fallback + error-boundary + Canvas in one component.
- `three/core/SceneCanvas.jsx` — device-tier-aware `<Canvas>` (caps
  pixel ratio / disables AA+shadows on weak devices).
- `three/core/SceneFallback.jsx` — CSS-only gradient fallback, no GPU.
- `three/core/SceneErrorBoundary.jsx` — a scene crash never takes the
  page down.
- `three/hooks/useDeviceCapability.js` — WebGL probe, device tier,
  `prefers-reduced-motion`.
- `three/config/cropVisuals.js` — the data-driven crop→visual and
  weather→visual maps every future scene should read from instead of
  hardcoding if/else chains.
- `contexts/AgricultureContext.jsx` — the global context engine
  (spec §66). `usePageContext({...})` lets any page declare what's
  currently selected; scenes read `useAgricultureContext()`.

## Known trade-off, said plainly
No GLB/3D model assets were available in this environment (network is
locked to package registries, not asset CDNs), so every object above
is procedural low-poly geometry (cones/boxes), not sculpted models.
It's real, interactive, data-reactive 3D — just stylized rather than
photoreal. If you have licensed GLB assets for crops/animals, drop
them in `frontend/public/models/` and swap the `<mesh>` primitives in
`three/scenes/*.jsx` for `<primitive object={gltf.scene} />` — the
context wiring and click/hover handling stay the same.

## Next phases (say "next phase" and I'll build it the same way —
audited, real code, built + linted, delivered as a diff)
- **Phase 2 cont.**: Home, Crops, Crop Encyclopedia, Crop Planner,
  Crop Passport
- **Phase 3**: Diagnose, Treatments, Soil Passport, Fertilizer, Pest
  Library
- **Phase 4**: Livestock, Livestock Care, Animal Encyclopedia (+detail)
- **Phase 5**: Market Prices, Weather (+Alerts/Analytics), Speak to
  AgriSaathi — this is also where Dashboard's `weather` prop gets
  wired to something real
- **Phases 6–10**: per the original spec's ordering

Each phase will only touch the pages it's implementing, get built +
linted before delivery, and never touch the backend/API contracts.
