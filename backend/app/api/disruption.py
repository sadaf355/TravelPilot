from fastapi import APIRouter, HTTPException
from app.models.disruption import DisruptionRequest, DisruptionResponse
from app.services.cascade_service import simulate_disruption
from app.services.recovery_service import rank_recovery_options, explain_ranking

router = APIRouter()

@router.post("/trigger", response_model=DisruptionResponse)
def trigger_disruption(payload: DisruptionRequest):
    try:
        return simulate_disruption(
            payload.node_id, payload.disruption_type, payload.delay_minutes,
            current_graph=payload.current_graph, reset=payload.reset,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.get("/cascade/{node_id}")
def cascade(node_id: str, delay_minutes: int = 300):
    try:
        return simulate_disruption(node_id, "delay", delay_minutes)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.get("/recovery/{node_id}")
def recovery(node_id: str, delay_minutes: int = 300):
    try:
        options = rank_recovery_options(node_id, delay_minutes)
        return {"node_id": node_id, "options": options, "explanation": explain_ranking(node_id, options)}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
