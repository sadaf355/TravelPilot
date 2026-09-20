from pydantic import BaseModel, Field

class QARequest(BaseModel):
    question: str = Field(min_length=2)
    trip: dict | None = None

class QAResponse(BaseModel):
    answer: str
    sources: list[str] = []
    suggested_questions: list[str] = []

class RecoveryApplyRequest(BaseModel):
    option_id: str
    node_id: str
    delay_minutes: int = 300
    current_graph: dict | None = None
