from fastapi import APIRouter
from app.models.itinerary import ItineraryRequest, ItineraryResponse
from app.services.itinerary_service import generate_demo_itinerary, get_demo_graph

router = APIRouter()

@router.post("/generate", response_model=ItineraryResponse)
def generate_itinerary(payload: ItineraryRequest):
    return generate_demo_itinerary(payload)

@router.get("/demo", response_model=ItineraryResponse)
def demo_itinerary():
    return generate_demo_itinerary(ItineraryRequest(destination="Ladakh", budget=50000, interests=["Adventure", "Nature", "Photography"]))

@router.get("/demo/graph")
def demo_graph():
    return get_demo_graph()
