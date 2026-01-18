"""Routes API pour les interviews décisionnelles"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
import uuid
from datetime import datetime

from ..models.decision_interview import DecisionInterview, InfoRequirement, BusinessRule, AlertSignal
from ..services.decision_storage import save_decision_interview, read_decision_interview, list_decision_interviews
from ..services.decision_compiler import DecisionCompiler

router = APIRouter(prefix="/api/decision-interview", tags=["Decision Interview"])

@router.post("/create")
async def create_interview(payload: Dict[str, Any] = Body(...)):
    """Crée une nouvelle interview décisionnelle"""
    interview_id = str(uuid.uuid4())
    
    interview = DecisionInterview(
        id=interview_id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    save_decision_interview(interview)
    
    return {
        "id": interview_id,
        "status": "created"
    }

@router.get("/{interview_id}")
async def get_interview(interview_id: str):
    """Récupère une interview"""
    interview = read_decision_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    return interview.model_dump(mode='json')

@router.put("/{interview_id}")
async def update_interview(
    interview_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """Met à jour une interview complète"""
    interview = read_decision_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Update fields
    if "decision" in payload:
        interview.decision = payload["decision"]
    if "context" in payload:
        interview.context = payload["context"]
    if "infos" in payload:
        interview.infos = [InfoRequirement(**i) for i in payload["infos"]]
    if "rules" in payload:
        interview.rules = [BusinessRule(**r) for r in payload["rules"]]
    if "signals" in payload:
        interview.signals = [AlertSignal(**s) for s in payload["signals"]]
    if "risks" in payload:
        interview.risks = payload["risks"]
    
    interview.updated_at = datetime.now()
    
    save_decision_interview(interview)
    
    return interview.model_dump(mode='json')

@router.post("/{interview_id}/submit")
async def submit_interview(interview_id: str):
    """Soumet l'interview pour compilation"""
    interview = read_decision_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Valider complétude
    if not interview.decision:
        raise HTTPException(400, "Decision is required")
    if not interview.context:
        raise HTTPException(400, "Context is required")
    if len(interview.infos) == 0:
        raise HTTPException(400, "At least one info is required")
    if len(interview.rules) == 0:
        raise HTTPException(400, "At least one rule is required")
    
    # Compiler
    compiler = DecisionCompiler()
    compilation = compiler.compile(interview)
    
    # Update status
    interview.status = "submitted"
    interview.submitted_at = datetime.now()
    save_decision_interview(interview)
    
    return {
        "status": "submitted",
        "interview_id": interview_id,
        "compilation": compilation
    }

@router.get("/")
async def list_interviews():
    """Liste toutes les interviews"""
    interviews = list_decision_interviews()
    return [i.model_dump(mode='json') for i in interviews]

