# AgriSaathi 3D Transformation — Phase 9

## What this is
Real WebGL (React Three Fiber) contextual 3D for the 12 Phase-9
modules (spec §92): **Document Wallet, Export Reports, Export Data,
Task Manager, Farm Notifications, Alerts Center, Sustainability
Score, Success Stories, Feedback Corner, Support Tickets, Voice
Notes, Profile Settings** — built on the shared engine Phases 1–8
already put in place. No new npm packages are needed (`three` /
`@react-three/fiber` / `@react-three/drei` were already required
from Phase 1).

Per spec §64, these are mostly **Level 3 (subtle depth)** modules —
settings, documents, feedback, support, exports, administrative
pages — plus four that lean **Level 2 (contextual)**: Task Manager,
Farm Notifications, Alerts Center, Sustainability Score, because
they connect directly to real farm events (spec §55–58). None of
them get a heavy immersive world; each gets one small (h-24 to h-28)
real-data-driven scene, matching the restraint the spec calls for on
this tier.

## How to apply
1. Make sure Phases 1–8 are already applied (this phase imports only
   `three/core/SceneStage` from that shared engine — it does not
   re-ship it).
2. Copy every file under this zip's `frontend/src/` into your real
   `frontend/src/`, preserving paths. It **replaces** the 12
   "coming soon" / plain pages listed above with 3D-enhanced
   versions that keep every existing API call, ledger entity, and
   form field exactly as they were — only the visual layer and prop
   wiring changed. It **adds** 12 new `three/scenes/*.jsx`, 1 new
   `three/config/taskVisuals.js`, and 12 new `components/*Scene3D.jsx`.
3. `npm run lint` / `npm run build` before shipping, same as every
   prior phase.

## What you'll see, module by module

**Document Wallet** (Level 3) — a small vault scene: the document
stack height reflects your real saved-document count (capped at 6
for legibility), and the security seal shifts from green to amber
the moment any real document's `expiry_date` has already passed.

**Export Reports** (Level 3) — a report desk where the number of
assembling page-sheets equals how many of the three real sections
(Ledger / Harvest / Soil) you've actually checked on, and the sheets
spin fast only while the real `jsPDF` generation is in flight.

**Export Data** (Level 3) — this feature was a bare "coming soon"
stub with no page content at all. It now gets a Data Intelligence
Center scene (spec §54) with one node per real dataset type the app
already tracks (Farm Ledger, Harvest Records, Soil Records,
Documents), plus honest copy pointing to Export Reports as the
working alternative today — nothing about the export functionality
itself was invented.

**Task Manager** (Level 2) — a farm operations board (spec §55):
each pending task becomes a colored post, colored by its real
`category` (planting/weeding/feeding/irrigation/harvest/
maintenance), glowing red if `priority === 'high'`. The field strip
below fills left-to-right by your real completed/total ratio.

**Farm Notifications** (Level 2) — a reminder bell that pulses red
if any real reminder's `due_date` is already past, amber if one
falls within 2 days, calm green otherwise.

**Alerts Center** (Level 2) — a three-lamp watchtower, one lamp per
real alert category the page already fetches (low-stock inventory,
rain-risk forecast, price swings) — lit only when that category
actually has entries.

**Sustainability Score** (Level 2) — a living-ecosystem strip (spec
§58): vegetation density and soil-tone richness scale directly with
your real 0–100 self-assessment score, nothing exaggerated beyond
what the checklist supports.

**Success Stories** (Level 3) — a small crop cluster, one plant per
real shared story (capped at 8), each topped with a trophy-gold bud.

**Feedback Corner** (Level 3) — a five-petal flower that blooms open
petal-by-petal as you tap more stars in the real rating control it
sits beside.

**Support Tickets** (Level 3) — a help-desk lamp that glows amber
while you have real open tickets and settles to green once
everything you've filed is resolved; the ticket-stack heights
reflect real open vs. resolved counts.

**Voice Notes** (Level 3, spec §63) — a real amplitude-style
waveform: bars jitter red while `recording` is true, settle calm
once you stop, and turn green once a transcript has actually been
captured.

**Profile Settings** (Level 3) — a small farm-plot marker sized by
the real `landSizeAcres` you've typed, with a crop tuft appearing
only once you've actually entered a `primaryCrop` — no visual
appears ahead of real input.

## Module visual registry (spec §87)

| Route | Scene | Context prop(s) | Data source |
|---|---|---|---|
| /document-wallet | DocumentVaultScene | docCount, expiringCount | DocumentWallet entity list |
| /export-reports | ReportDeskScene | sectionsOn, generating | local form state + jsPDF |
| /export-data | DataStreamScene | datasetCount | static real dataset list |
| /task-manager | TaskFieldScene | tasks, overdueCount | FarmTask entity list |
| /farm-notifications | NotificationBeaconScene | dueSoonCount, overdueCount | ledger chain: farm_notification |
| /alerts-center | AlertWatchtowerScene | stockAlerts, weatherAlerts, priceAlerts | inventory ledger + weather API + price-alerts API |
| /sustainability-score | EcosystemScene | score | ledger chain: sustainability |
| /success-stories | StoryFieldScene | storyCount | ledger list: success_story |
| /feedback-corner | FeedbackGardenScene | rating | local form state |
| /support-tickets | SupportDeskScene | openCount, resolvedCount | ledger chain: support_ticket |
| /voice-notes | VoiceWaveScene | recording, hasTranscript | Web Speech API state |
| /profile-settings | FarmIdentityScene | landSizeAcres, hasCrop | Firestore user profile form |

## Next
Phase 10 (Authentication: Login, Register, Forgot/Reset Password,
OAuth Consent) is next per the spec's implementation order — Login
and Register already shipped in Phase 1, so Phase 10 covers the
remaining three lightweight auth screens with the same
`AuthScene3D` / `AuthFieldScene` pattern.
