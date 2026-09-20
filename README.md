# TravelPilot — Complete Hackathon Build

TravelPilot is an AI travel command center that models a trip as a dependency graph, detects disruption cascades, ranks recovery options, and answers natural-language questions about the current itinerary — behind real authentication with a Postgres-backed user store.

## Implemented
- Phases 0–5: project foundation, mock Ladakh trip, graph model, dashboard and itinerary UI.
- Phase 6: interactive dependency graph.
- Phase 7: disruption + cascade engine, with multi-disruption stacking.
- Phase 8: transparent recovery ranking, with an LLM-narrated explanation and a real "apply" that mutates the graph.
- Phase 9: itinerary planner with genuine interest-based personalization (not just label swaps) + AI-ready Q&A grounded in live disruption state.
- Phase 10: grounded AI assistant UI.
- Phase 11: end-to-end disruption/recovery flow.
- Phase 12: demo-safe mode, mock weather feed, budget optimizer, responsive UI (including a mobile bottom nav), light/dark theme toggle, and full auth (signup/login/demo-login) backed by Postgres.

See `docs/CHANGELOG.md` for the detailed build history and known, honest limitations.

## Run with Docker (Recommended)
To run the full stack (Frontend, Backend, and PostgreSQL database) with a single command:
```bash
docker compose up -d
```
- **Frontend**: http://localhost:5175 (or configured port)
- **Backend API**: http://localhost:8002 (or configured port)
- **API Documentation**: http://localhost:8002/docs
- **Database**: PostgreSQL on port 5434

To stop all containers:
```bash
docker compose down
```

To view logs:
```bash
docker compose logs -f
```

## Prerequisites (Manual / Local Run)
- Python 3.11+, Node 18+
- If only running PostgreSQL via Docker:
  ```bash
  docker compose up -d db
  ```

  Without Docker, the equivalent on Linux is:
  ```bash
  sudo apt install postgresql   # or your OS's equivalent
  sudo service postgresql start
  sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
  sudo -u postgres createdb travelpilot
  ```
  If Postgres isn't reachable, the API still boots — every endpoint except
  `/auth/*` works fine, and auth returns a clear `503` instead of crashing
  the process. This is intentional so a missing DB never takes down the
  whole demo.

## Run backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit if your DB/LLM setup differs from the defaults
export $(cat .env | xargs)   # or use a tool like python-dotenv / direnv
uvicorn app.main:app --reload --port 8000
```
Tables are created automatically on startup (`Base.metadata.create_all`). No manual migration step is needed for this hackathon scope.

## Run frontend
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL, normally http://localhost:5173.

## Auth
- Sign up with any email/password, or tap **"Continue with demo credentials"** on the login screen to instantly log in as a real, persisted demo account (`demo@travelpilot.app`) — no form filling needed.
- Every product route (itinerary, disruption, recovery, Q&A, weather, budget) requires a valid session; the frontend attaches the token automatically once logged in.

## Demo path
1. Log in (or hit the demo button) → Plan trip → generate a personalized itinerary.
2. Dashboard → inspect health, cost and connected nodes.
3. Itinerary → note the "Personalized" badges on activities matched to your interests.
4. Trip Graph → click nodes and inspect dependencies.
5. Disruption → trigger a 5-hour delay on Delhi → Leh; optionally check "stack on current disruption" and trigger a second one without resetting the first.
6. Recovery → compare ranked recovery options, read the AI-generated reasoning, click "Apply this recovery" to see it actually resolve the affected nodes (and add the option's cost to the trip total), and check the original → disrupted → recovered comparison.
7. AI Assistant → ask what happens if the flight is cancelled — the answer reflects whatever disruption is currently active.
8. Weather → inspect the mock weather/impact feed.
9. Toggle light/dark mode from the header at any point — try it on the login screen too.

No real booking, payment, weather or airline API is required. Demo mode (no `LLM_API_KEY` set) is designed to remain fully functional offline, with deterministic fallback text wherever an LLM call would otherwise happen.
