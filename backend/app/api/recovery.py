from fastapi import APIRouter, HTTPException
from app.services.recovery_service import rank_recovery_options, explain_ranking, apply_recovery_option
from app.models.ai import RecoveryApplyRequest

router=APIRouter()
@router.get("/options/{node_id}")
def recovery_options(node_id: str, delay_minutes: int = 300):
    try:
        options = rank_recovery_options(node_id, delay_minutes)
        return {"node_id": node_id, "options": options, "explanation": explain_ranking(node_id, options)}
    except ValueError as exc: raise HTTPException(status_code=404, detail=str(exc))
@router.post("/apply")
def apply_recovery(payload: RecoveryApplyRequest):
    try:
        return apply_recovery_option(payload.node_id, payload.option_id, payload.delay_minutes, payload.current_graph)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
