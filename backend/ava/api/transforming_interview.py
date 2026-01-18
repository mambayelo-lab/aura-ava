"""Routes API pour les interviews transforming"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
import uuid
from datetime import datetime

from ..models.transforming_interview import (
    TransformingInterview, Activity, Actor, 
    ActivityFlow, PainPoint
)
from ..services.transforming_storage import (
    save_transforming_interview,
    read_transforming_interview,
    list_transforming_interviews
)
from ..services.semantic_normalizer import SemanticNormalizer

router = APIRouter(prefix="/api/transforming-interview", tags=["Transforming Interview"])

@router.post("/create")
async def create_interview(payload: Dict[str, Any] = Body(...)):
    """Crée nouvelle interview"""
    interview_id = str(uuid.uuid4())
    
    interview = TransformingInterview(
        id=interview_id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    save_transforming_interview(interview)
    return {"id": interview_id, "status": "created"}

@router.get("/{interview_id}")
async def get_interview(interview_id: str):
    """Récupère interview"""
    interview = read_transforming_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    return interview.model_dump(mode='json')

@router.put("/{interview_id}")
async def update_interview(
    interview_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """Met à jour interview"""
    interview = read_transforming_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    if "perimeter" in payload:
        interview.perimeter = payload["perimeter"]
    if "objective" in payload:
        interview.objective = payload["objective"]
    if "activities" in payload:
        interview.activities = [Activity(**a) for a in payload["activities"]]
    if "actors" in payload:
        interview.actors = [Actor(**a) for a in payload["actors"]]
    if "flows" in payload:
        interview.flows = [ActivityFlow(**f) for f in payload["flows"]]
    if "pain_points" in payload:
        interview.pain_points = [PainPoint(**p) for p in payload["pain_points"]]
    
    interview.updated_at = datetime.now()
    save_transforming_interview(interview)
    
    return interview.model_dump(mode='json')

@router.post("/{interview_id}/suggest-decomposition")
async def suggest_decomposition(
    interview_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """Suggère décomposition activité"""
    activity_label = payload.get("activity_label", "")
    
    normalizer = SemanticNormalizer()
    suggestions = normalizer.suggest_decomposition(activity_label)
    
    return {
        "activity_label": activity_label,
        "suggestions": suggestions,
        "count": len(suggestions)
    }

@router.post("/{interview_id}/normalize-activity")
async def normalize_activity(
    interview_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """Normalise activité"""
    raw_label = payload.get("raw_label", "")
    
    normalizer = SemanticNormalizer()
    normalized = normalizer.normalize_activity_label(raw_label)
    
    return normalized

@router.post("/{interview_id}/submit")
async def submit_interview(interview_id: str):
    """Soumet interview (passe au workspace architecte)"""
    interview = read_transforming_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    if not interview.perimeter:
        raise HTTPException(400, "Perimeter required")
    if not interview.objective:
        raise HTTPException(400, "Objective required")
    if len(interview.activities) == 0:
        raise HTTPException(400, "At least one activity required")
    
    interview.status = "submitted"
    interview.submitted_at = datetime.now()
    save_transforming_interview(interview)
    
    return {
        "status": "submitted",
        "interview_id": interview_id,
        "message": "Interview prête pour l'architecte"
    }

@router.get("/")
async def list_interviews():
    """Liste interviews"""
    interviews = list_transforming_interviews()
    return [i.model_dump(mode='json') for i in interviews]

