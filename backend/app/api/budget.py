from fastapi import APIRouter
from app.services.budget_service import optimize_budget
router=APIRouter()
@router.get("")
def budget(budget: float=50000, delay_minutes: int=300): return optimize_budget(budget, delay_minutes)
