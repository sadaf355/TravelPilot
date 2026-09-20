from fastapi import APIRouter
from app.models.ai import QARequest, QAResponse
from app.services.ai_service import answer_question
router=APIRouter()
@router.post("", response_model=QAResponse)
def qa(payload: QARequest): return answer_question(payload.question, payload.trip)
