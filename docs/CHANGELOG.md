# Changelog

Most recent work first.

## v4 — demo login hardening, cleanup, responsiveness
- Verified the "Continue with demo credentials" button end-to-end: Login
  page → `AuthContext.loginAsDemo()` → `POST /auth/demo-login` → creates or
  reuses one fixed demo user in Postgres → returns a real JWT → routes into
  the app exactly like a normal login. No changes were needed to the flow
  itself; it was already wired correctly.
- **Trip Graph responsiveness**: canvas height was a fixed `560px`
  regardless of screen size — now `380px` on phones, `460px` on tablets,
  `560px` on desktop. The "Live dependency graph" header chip abbreviates
  to "Live graph" below `sm:`. The hover tooltip's fixed `w-72` could
  overflow a narrow (~320px) phone screen — now caps at
  `min(18rem, 100% - 2rem)`.
- **Trip Graph layout fallback**: any node id without a hand-placed
  position used to fall back to the exact canvas center `[50, 50]`, so
  multiple unknown nodes would stack invisibly on top of each other.
  Replaced with a golden-angle spiral fallback so they spread out
  legibly instead.
- **Repo cleanup**: removed `backend/app/core/config.py` (a dead,
  never-imported `Settings` dataclass left over from before `core/db.py`
  and env-var reads took over config duties), two empty `.gitkeep`
  placeholders in directories that now hold real files, and
  `scripts/reuse_risk_gate.py` (a one-off scaffolding script from the
  very first phase, unrelated to running the app). Consolidated four
  separate changelog/status docs (`CHANGELOG.md`, `CHANGELOG_v2.md`,
  `CHANGELOG_v3.md`, `PHASE_STATUS.md`) into this single file.

## v3 — closing gaps from the v2 review
1. Hotel/stay nodes are now selectable as a disruption target (the picker
   only offered `flight | transfer | activity`, even though the backend
   already supported any node type — blocked the "flight delay + hotel
   unavailability" multi-disruption demo from the UI).
2. Itinerary-generation reasoning trace, implemented end-to-end:
   `planner_service._personalize_items` now returns a human-readable
   trace (e.g. *"Day 1: matched 'adventure' → swapped 'Leh Market' for
   'Leh Bazaar Cycling Tour'"*) alongside its swap list, surfaced in a
   persistent "Why this itinerary looks the way it does" panel on the
   Dashboard instead of only a toast.
3. "Apply Recovery" now adds the chosen option's `cost_delta` onto the
   trip's cost, not just restoring node status — previously the cost
   impact of the recovery choice was silently dropped.
4. Genuine three-way **original → disrupted → recovered** comparison:
   `TripContext` freezes a `disruptedSnapshot` the moment a disruption
   cascade resolves, independent of the live graph that recovery goes on
   to mutate, so all three states can be shown together instead of the
   "disrupted" state disappearing the instant a recovery is applied.
5. "Preview this recovery" → "Apply this recovery" (the button always
   permanently mutated state; the label didn't say so), plus an
   "✓ Applied" badge on whichever option was used.
6. The apply-recovery button now has a loading/disabled state, so a
   rapid double-click can't fire the request twice.
7. Backend startup no longer crashes the whole API if Postgres is
   unreachable — `Base.metadata.create_all` runs inside a try/except, the
   app still boots, and every non-auth endpoint keeps working. Auth-gated
   calls now return a clean `503` instead of a raw driver exception.
8. CORS origins are configurable via a `CORS_ORIGINS` env var instead of
   only ever allowing `localhost:5173`.
9. Frontend dependencies pinned to real versions instead of `"latest"`
   (`react`, `react-dom`, `react-router-dom`, `axios`, `lucide-react`,
   `framer-motion`, `vite`, `@vitejs/plugin-react`).
10. Added `docker-compose.yml` for one-command local Postgres
    (`docker compose up -d db`), matching `.env.example`'s defaults.
11. Added a React error boundary wrapping the app — an unhandled render
    error now shows a themed, recoverable screen instead of blank white.

## v2 — auth, theming, responsiveness, quick wins, bug fixes
**Authentication (new):** real, Postgres-backed auth, not a cosmetic
login screen — `db_models/user.py` + `core/db.py` (SQLAlchemy User model
+ engine), `core/security.py` (bcrypt hashing done directly rather than
via passlib, which has a known incompatibility with recent bcrypt
releases; JWT issuing/verification), `api/auth.py` (`/auth/signup`,
`/login`, `/demo-login`, `/me`). Every product route requires a valid
bearer token via a shared `Depends(get_current_user)`. Frontend:
`AuthContext`, `Login.jsx` (login/signup tabs + demo button),
`ProtectedRoute`; the token is attached to every request via an axios
interceptor. Verified against a real local Postgres instance: signup,
duplicate-email rejection, wrong-password rejection, demo-login
idempotency, token rejection, and route protection all passed.

**Light/dark theme toggle (new):** all color tokens re-defined as CSS
variables in `index.css`, wired through `tailwind.config.js`, so every
existing component became theme-aware without being individually
rewritten. `ThemeContext` handles the toggle, localStorage persistence,
and system-preference detection on first load.

**Responsiveness (new):** `AppLayout` gained a mobile bottom tab bar (the
desktop nav was previously just hidden below `lg:` with no replacement —
there was no way to navigate the app at all on a phone).

**Quick-win features:** multi-disruption stacking (a disruption can layer
onto the graph's current state instead of resetting it), "Apply Recovery"
mutating real graph state instead of only a toast, a "Personalized" badge
on itinerary items chosen by the interest-matching logic.

**Bugs found and fixed (via actually running the app, not just reading
code):** Trip Graph label overlap on densely-packed nodes (switched to
icon-only nodes + hover tooltip); the disruption engine ignoring
personalization and silently reverting a swapped activity's title;
several light-mode contrast bugs — invisible login input text, invisible
landing-page body text, invisible protected-route loading text, and
several buttons relying on inherited (wrong) text color instead of an
explicit one.

## v1 — post-review fixes (grounding AI features, cascade trace, UX flow)
- Fixed itinerary generation silently ignoring the traveler's `interests`
  (`TripContext.loadTrip` was calling the static demo endpoint instead of
  the real generation endpoint) — the biggest functional gap at the time.
- Added tagged content variants to the six demo activities so
  personalization has real choices to make, plus an optional LLM pass to
  rewrite descriptions of the activities it swapped in.
- Recovery ranking gained an LLM-generated explanation of the top option,
  grounded in the real scored options (the scoring itself stayed
  deterministic).
- Q&A now grounds on the live (possibly disrupted) graph the frontend
  sends, instead of always rebuilding a clean graph from the static demo
  file.
- Added a live cascade-reasoning trace surfaced as a terminal-style panel
  on the Disruption page, a "Generating your trip" screen between trip
  creation and the dashboard, and a before/after itinerary comparison on
  Recovery.
- Pinned `tailwindcss`/`postcss`/`autoprefixer` off `"latest"` (had
  drifted to Tailwind v4, which broke the build against this v3-style
  config).

## Known, honest limitations (by design, not oversights)
- No server-side session store for *trip* state — the itinerary/
  disruption graph lives in the frontend and is passed back to the
  backend with each request. This is separate from auth, which *is*
  backed by Postgres. Fine for a single-user demo; would need a session
  store for true multi-user persistence of trip state.
- Recovery option *candidates* (their titles/change-lists) are a fixed
  set of three; only the scoring and the LLM-generated explanation are
  dynamic.
- If `LLM_API_KEY` isn't set, every LLM-backed feature (recovery
  explanation, Q&A, activity description rewrite) falls back to a
  deterministic, still-correct templated response — intentional for demo
  reliability, but the "AI Integration" story is stronger with a key
  configured.
