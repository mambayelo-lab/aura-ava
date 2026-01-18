"""Routes API pour les interviews - Phase 1: Decision-focused"""
from fastapi import APIRouter, HTTPException
from ava.models.ontology import Interview
from ava.services.storage import read_json, write_json
from typing import List
from uuid import uuid4
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=Interview)
def create_interview(interview: Interview):
    """Crée une nouvelle interview"""
    interviews = read_json("interviews.json", default=[])
    
    # Vérifier que l'ID n'existe pas déjà
    existing_ids = [i.get("id") for i in interviews if isinstance(i, dict)]
    if interview.id in existing_ids:
        raise HTTPException(status_code=400, detail=f"Interview with id '{interview.id}' already exists")
    
    # Ajouter l'interview
    interview_dict = interview.model_dump()
    interview_dict["created_at"] = interview.created_at.isoformat()
    interview_dict["updated_at"] = interview.updated_at.isoformat()
    interviews.append(interview_dict)
    
    write_json("interviews.json", interviews)
    return interview

@router.get("/", response_model=List[Interview])
def list_interviews():
    """Liste toutes les interviews"""
    interviews = read_json("interviews.json", default=[])
    return [Interview(**i) for i in interviews]

@router.get("/{interview_id}", response_model=Interview)
def get_interview(interview_id: str):
    """Récupère une interview par son ID"""
    interviews = read_json("interviews.json", default=[])
    
    for interview_data in interviews:
        if isinstance(interview_data, dict) and interview_data.get("id") == interview_id:
            return Interview(**interview_data)
    
    raise HTTPException(status_code=404, detail=f"Interview '{interview_id}' not found")

@router.put("/{interview_id}", response_model=Interview)
def update_interview(interview_id: str, interview: Interview):
    """Met à jour une interview"""
    if interview.id != interview_id:
        raise HTTPException(status_code=400, detail="Interview ID mismatch")
    
    interviews = read_json("interviews.json", default=[])
    
    # Trouver et mettre à jour
    found = False
    for i, interview_data in enumerate(interviews):
        if isinstance(interview_data, dict) and interview_data.get("id") == interview_id:
            interview_dict = interview.model_dump()
            # Préserver created_at, mettre à jour updated_at
            interview_dict["created_at"] = interview_data.get("created_at", datetime.now().isoformat())
            interview_dict["updated_at"] = datetime.now().isoformat()
            interviews[i] = interview_dict
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail=f"Interview '{interview_id}' not found")
    
    write_json("interviews.json", interviews)
    return interview

@router.delete("/{interview_id}")
def delete_interview(interview_id: str):
    """Supprime une interview"""
    interviews = read_json("interviews.json", default=[])
    
    original_count = len(interviews)
    interviews = [i for i in interviews if not (isinstance(i, dict) and i.get("id") == interview_id)]
    
    if len(interviews) == original_count:
        raise HTTPException(status_code=404, detail=f"Interview '{interview_id}' not found")
    
    write_json("interviews.json", interviews)
    return {"status": "deleted", "interview_id": interview_id}

@router.post("/{interview_id}/submit")
def submit_interview(interview_id: str):
    """Soumet une interview (compilation AVA)"""
    interviews = read_json("interviews.json", default=[])
    
    # Trouver l'interview
    interview_data = None
    for i, data in enumerate(interviews):
        if isinstance(data, dict) and data.get("id") == interview_id:
            interview_data = data
            break
    
    if not interview_data:
        raise HTTPException(status_code=404, detail=f"Interview '{interview_id}' not found")
    
    # Mettre à jour le statut de validation
    interview = Interview(**interview_data)
    interview.validation["validated_by_user"] = True
    interview.validation["submitted_at"] = datetime.now().isoformat()
    interview.updated_at = datetime.now()
    
    # Sauvegarder
    interview_dict = interview.model_dump()
    interview_dict["created_at"] = interview_data.get("created_at", datetime.now().isoformat())
    interview_dict["updated_at"] = interview.updated_at.isoformat()
    interviews[i] = interview_dict
    
    write_json("interviews.json", interviews)
    
    return {
        "status": "submitted",
        "interview_id": interview_id,
        "submitted_at": interview.validation["submitted_at"]
    }
