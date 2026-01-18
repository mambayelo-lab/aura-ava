"""Service de stockage pour les interviews transforming"""
import json
from pathlib import Path
from typing import Optional, List
from ..models.transforming_interview import TransformingInterview

# Utiliser le même répertoire data que les autres services
STORAGE_DIR = Path(__file__).parent.parent / "data" / "transforming_interviews"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

def save_transforming_interview(interview: TransformingInterview) -> None:
    """Sauvegarde interview"""
    file_path = STORAGE_DIR / f"{interview.id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(interview.model_dump(mode='json'), f, ensure_ascii=False, indent=2, default=str)

def read_transforming_interview(interview_id: str) -> Optional[TransformingInterview]:
    """Charge interview"""
    file_path = STORAGE_DIR / f"{interview_id}.json"
    if not file_path.exists():
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Convertir les dates string en datetime
    if 'created_at' in data and isinstance(data['created_at'], str):
        from datetime import datetime
        data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
    if 'updated_at' in data and isinstance(data['updated_at'], str):
        from datetime import datetime
        data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
    if 'submitted_at' in data and data['submitted_at'] and isinstance(data['submitted_at'], str):
        from datetime import datetime
        data['submitted_at'] = datetime.fromisoformat(data['submitted_at'].replace('Z', '+00:00'))
    
    return TransformingInterview(**data)

def list_transforming_interviews() -> List[TransformingInterview]:
    """Liste interviews"""
    interviews = []
    for file_path in STORAGE_DIR.glob("*.json"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Convertir les dates
                if 'created_at' in data and isinstance(data['created_at'], str):
                    from datetime import datetime
                    data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
                if 'updated_at' in data and isinstance(data['updated_at'], str):
                    from datetime import datetime
                    data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
                if 'submitted_at' in data and data['submitted_at'] and isinstance(data['submitted_at'], str):
                    from datetime import datetime
                    data['submitted_at'] = datetime.fromisoformat(data['submitted_at'].replace('Z', '+00:00'))
                interviews.append(TransformingInterview(**data))
        except Exception as e:
            print(f"Error loading interview {file_path}: {e}")
            continue
    
    return sorted(interviews, key=lambda x: x.created_at, reverse=True)

