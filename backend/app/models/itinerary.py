from pydantic import BaseModel, Field

class ItineraryRequest(BaseModel):
    destination: str = Field(min_length=2)
    start_date: str = "2026-06-12"
    end_date: str = "2026-06-17"
    budget: float = Field(gt=0)
    interests: list[str] = []
    travel_style: str = "balanced"

class ItineraryNode(BaseModel):
    id: str
    type: str
    title: str
    start_time: str
    end_time: str
    location: str
    cost: float
    status: str = "ok"
    day: int | None = None
    description: str | None = None
    buffer_time: int | None = None
    delay_minutes: int = 0
    impact_reason: str = ""

class ItineraryEdge(BaseModel):
    source: str
    target: str
    type: str = "depends_on"
    buffer_time: int = 0

class ItineraryResponse(BaseModel):
    trip_id: str
    destination: str
    start_date: str
    end_date: str
    budget: float
    interests: list[str]
    days: list[dict]
    nodes: list[ItineraryNode]
    edges: list[ItineraryEdge]
    graph: dict
    personalized_nodes: list[str] = []
    planning_trace: list[str] = []
