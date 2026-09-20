from fastapi import APIRouter
from app.services.weather_service import get_weather
router=APIRouter()
@router.get("")
def weather(): return {"mode":"mock","days":get_weather()}
