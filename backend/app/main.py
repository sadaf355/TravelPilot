import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.db import Base, engine
import app.db_models.user  # noqa: F401 — ensures the model is registered before create_all

logger = logging.getLogger("travelpilot.startup")

# Extra allowed origins beyond localhost dev, comma-separated
# (e.g. CORS_ORIGINS="https://travelpilot.example.com,https://staging.example.com").
_extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
_allowed_origins = list(dict.fromkeys(["http://localhost:5173", "http://127.0.0.1:5173", *_extra_origins]))

app=FastAPI(title='TravelPilot API',version='1.0.0',description='AI travel planning, dependency intelligence and disruption recovery')
app.add_middleware(CORSMiddleware,allow_origins=_allowed_origins,allow_credentials=True,allow_methods=['*'],allow_headers=['*'])

db_ready = False

@app.on_event('startup')
def _create_tables():
    # If Postgres isn't reachable, don't take the whole API down with it —
    # only the auth-gated routes need the database. Every other endpoint
    # (itinerary/disruption/recovery/qa/weather/budget) stays demo-usable;
    # auth-gated calls will surface a clear 503 instead of the process
    # failing to boot at all.
    global db_ready
    try:
        Base.metadata.create_all(bind=engine)
        db_ready = True
        logger.info("Database ready.")
    except Exception as exc:  # pragma: no cover - depends on external DB
        db_ready = False
        logger.warning(
            "Database unavailable at startup (%s). Auth endpoints will return 503 "
            "until DATABASE_URL points at a running Postgres instance.", exc,
        )

app.include_router(api_router)
@app.get('/')
def root():
    return {'name':'TravelPilot API','status':'ready','phase':'complete','mode':'hackathon-demo','database':'connected' if db_ready else 'unavailable'}
