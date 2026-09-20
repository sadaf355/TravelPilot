from pydantic import BaseModel, Field

class DisruptionRequest(BaseModel):
    node_id: str
    disruption_type: str = "delay"
    delay_minutes: int = Field(default=300, ge=0, le=1440)
    current_graph: dict | None = None
    reset: bool = True

class DisruptionNode(BaseModel):
    id: str
    status: str
    delay_minutes: int = 0
    reason: str = ""

class DisruptionResponse(BaseModel):
    disrupted_node: str
    disruption_type: str
    delay_minutes: int
    affected_nodes: list[DisruptionNode]
    trace: list[str] = []
    graph: dict
    summary: dict
