# AgriSaathi 3D Transformation — Phase 10 (Authentication, final 3 screens)

## What this is
Per spec §92's implementation order, Phase 10 = Authentication. **Login**
and **Register** already shipped in Phase 1 with the shared `AuthScene3D`
Level-3 treatment (spec §65: subtle depth, no heavy 3D, auth must stay
fast). This phase covers the three remaining auth screens with the exact
same pattern — **no new 3D code, no new npm packages**:

- `ForgotPassword.jsx`
- `ResetPassword.jsx`
- `OAuthConsent.jsx`

All three reuse `components/AuthScene3D.jsx` (26 instanced drifting
leaves + soft ground haze, real WebGL via R3F, falls back cleanly if
WebGL is unavailable) that Phase 1 already delivered. This phase does
not re-ship the engine — it assumes Phases 1–9 are already applied.

## Why these three needed real logic, not just visuals
All three files in the base repo were literal "to be implemented" stubs
with no working flow at all — so per spec §71/§85 (real data, don't
fabricate, don't break what exists) this phase had to wire the actual
functionality, not just drop a background behind placeholder text:

**ForgotPassword** — calls Firebase's real `sendPasswordResetEmail`.
Shows the real error Firebase returns (`auth/user-not-found`,
`auth/invalid-email`) rather than a generic message, and a real "sent"
confirmation state with a way to resend.

**ResetPassword** — reads the real `oobCode` query param that Firebase's
password-reset email links to, calls `verifyPasswordResetCode` to check
it's valid and get the real email it belongs to, then `confirmPasswordReset`
on submit. Handles all four real states honestly: no code in the URL,
code still verifying, code invalid/expired, and success — never assumes
a code is valid before Firebase confirms it.

**OAuthConsent** — AgriSaathi doesn't currently have an OAuth
authorization-server backend anywhere in the repo (no `/api/oauth/*`
route exists, and nothing else in the app links to this page yet), so
this deliberately does **not** invent a token exchange. It's a generic,
honest consent screen: it reads whatever real `client_id` /
`client_name` / `redirect_uri` / `scope` / `state` query params an
external app would redirect the user here with, shows only the scopes
actually present in that query string (mapped to a plain-English label
where recognized), and on Approve/Deny forwards back to the real
`redirect_uri` with `approved=true/false` (+ `state`) appended — the
same shape most OAuth consent redirects use. If no `client_id`/
`redirect_uri` are present (i.e. nothing is actually requesting access),
it says so plainly instead of showing a fake pending request, and links
back to the dashboard. Wire a real backend call in `handleApprove`/
`handleDeny` once an authorization-server endpoint exists.

## How to apply
1. Confirm Phases 1–9 are already applied (this phase only imports the
   existing `components/AuthScene3D.jsx` — it adds no new `three/` files).
2. Copy `frontend/src/pages/ForgotPassword.jsx`,
   `ResetPassword.jsx`, and `OAuthConsent.jsx` from this zip into your
   real `frontend/src/pages/`, overwriting the three stub files. No
   other files change; `App.jsx` routing for `/forgot-password`,
   `/reset-password`, and `/oauth-consent` already points at these
   three components in the base repo, so no route changes are needed.
3. `npm run lint` / `npm run build` (all three files were also
   syntax-checked with esbuild before delivery here).

## Module visual registry (spec §87)

| Route | Scene | Context | Data source |
|---|---|---|---|
| /forgot-password | AuthFieldScene (shared) | none (Level 3, static) | Firebase Auth `sendPasswordResetEmail` |
| /reset-password | AuthFieldScene (shared) | none (Level 3, static) | Firebase Auth `verifyPasswordResetCode` / `confirmPasswordReset`, real `oobCode` from URL |
| /oauth-consent | AuthFieldScene (shared) | none (Level 3, static) | real `client_id`/`redirect_uri`/`scope`/`state` query params; no backend yet |

## Full-application status
With this phase, every route enumerated in spec §3 now has a real,
data-driven 3D treatment at the appropriate level (1/2/3), across
Phases 1–10:

- **Phase 1**: engine + context (Login, Register, Dashboard)
- **Phase 2**: Home, Crops, Crop Encyclopedia Detail, Crop Planner, Crop Passport
- **Phase 3**: Diagnose, Treatments, Soil Passport, Fertilizer, Pest Library
- **Phase 4**: Livestock, Animal Encyclopedia (+ Detail)
- **Phase 5**: Market Prices, Weather, Weather Alerts, Weather Analytics, Speak to AgriSaathi
- **Phase 6**: Near Me, Government Schemes, Insurance Hub, Insurance Vault, Loan Eligibility, Loan Calculator
- **Phase 7**: Irrigation Planner, Sensor Hub/Lab, Farm Ledger, Expense Analytics, Yield Benchmarks, Harvest Records, Inventory Tracker, Equipment Registry
- **Phase 8**: Input/Resource Marketplace, Vendor Contacts, Training Center/Academy, Community Forum, Expert Directory
- **Phase 9**: Document Wallet, Export Reports/Data, Task Manager, Farm Notifications, Alerts Center, Sustainability Score, Success Stories, Feedback Corner, Support Tickets, Voice Notes, Profile Settings
- **Phase 10 (this delivery)**: Forgot Password, Reset Password, OAuth Consent

## One real gap found during this phase's audit: `/data-gov`
Re-auditing the full route list against Phases 1–9 turned up one route
that was never actually touched: **`/data-gov`**, which renders
`DataGovLiveData.jsx` (a real, substantial 15KB page already wired to
the app's real `dataGov.js` client and backend `datagov_registry.py` —
not a stub). It wasn't part of any phase's file list above. Per spec
§18 this is a Level-2 "Government Data Intelligence Center" treatment
(floating data streams / source nodes / freshness indicators over the
real dataset list, not a new architecture). It's the clear next task —
say the word and it'll be built the same way as everything above: real
code, esbuild/lint-checked, delivered as a diff, nothing else touched.

Two routes I checked and confirmed do **not** need separate work:
`/community` just re-exports the already-3D-enhanced `CommunityForum`
(Phase 8), and `/livestock-care` renders the already-3D-enhanced
`Livestock` component (Phase 4).
