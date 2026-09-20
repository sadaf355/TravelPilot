from fastapi import APIRouter, Depends
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.itinerary import router as itinerary_router
from app.api.disruption import router as disruption_router
from app.api.recovery import router as recovery_router
from app.api.qa import router as qa_router
from app.api.weather import router as weather_router
from app.api.budget import router as budget_router
from app.core.security import get_current_user

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router, prefix='/auth', tags=['auth'])

# Everything below requires a valid session — signed in as a real account or
# via the demo-login button, both of which issue a real JWT against a real
# Postgres row.
authed = [Depends(get_current_user)]
api_router.include_router(itinerary_router, prefix='/itinerary', tags=['itinerary'], dependencies=authed)
api_router.include_router(disruption_router, prefix='/disruption', tags=['disruption'], dependencies=authed)
api_router.include_router(recovery_router, prefix='/recovery', tags=['recovery'], dependencies=authed)
api_router.include_router(qa_router, prefix='/qa', tags=['ai'], dependencies=authed)
api_router.include_router(weather_router, prefix='/weather', tags=['weather'], dependencies=authed)
api_router.include_router(budget_router, prefix='/budget', tags=['budget'], dependencies=authed)
