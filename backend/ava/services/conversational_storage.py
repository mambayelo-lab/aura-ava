import json
from pathlib import Path
from typing import Optional
from ..models.conversational_interview import ConversationalInterview

# Utiliser le même répertoire data que les autres services
STORAGE_DIR = Path(__file__).parent.parent / "data" / "conversational"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

def save_conversational_interview(interview: ConversationalInterview) -> None:
    """Sauvegarde interview conversationnelle"""
    file_path = STORAGE_DIR / f"{interview.id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(
            interview.model_dump(mode='json'), 
            f, 
            ensure_ascii=False, 
            indent=2, 
            default=str
        )

def read_conversational_interview(interview_id: str) -> Optional[ConversationalInterview]:
    """Charge interview conversationnelle"""
    file_path = STORAGE_DIR / f"{interview_id}.json"
    if not file_path.exists():
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return ConversationalInterview(**data)

def list_conversational_interviews() -> list[ConversationalInterview]:
    """Liste toutes les interviews conversationnelles"""
    interviews = []
    for file_path in STORAGE_DIR.glob("*.json"):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            interviews.append(ConversationalInterview(**data))
    
    return sorted(interviews, key=lambda x: x.created_at, reverse=True)

