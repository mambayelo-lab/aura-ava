"""Routes API pour l'assistance LLM discrète"""
from fastapi import APIRouter, Body
from typing import Dict, Any, List
from difflib import get_close_matches

router = APIRouter(prefix="/api/llm", tags=["LLM Assistance"])

@router.post("/suggest")
async def suggest_concept(payload: Dict[str, Any] = Body(...)):
    """
    Suggère un concept depuis un texte libre
    
    Payload:
    {
        "user_input": "bon de commande",
        "context": "subject",
        "available_options": ["Commande", "Facture", "Client", ...]
    }
    
    Returns:
    {
        "suggestion": "Commande",
        "confidence": 0.95,
        "reason": "Correspondance directe avec 'bon de commande'"
    }
    """
    user_input = payload.get("user_input", "").lower().strip()
    available = payload.get("available_options", [])
    context = payload.get("context", "")
    
    if not user_input or len(user_input) < 3:
        return {
            "suggestion": None,
            "confidence": 0.0,
            "reason": "Entrée trop courte"
        }
    
    if not available:
        return {
            "suggestion": None,
            "confidence": 0.0,
            "reason": "Aucune option disponible"
        }
    
    # Normaliser les options disponibles
    normalized_options = {opt.lower(): opt for opt in available}
    
    # Recherche exacte d'abord
    if user_input in normalized_options:
        return {
            "suggestion": normalized_options[user_input],
            "confidence": 1.0,
            "reason": "Correspondance exacte"
        }
    
    # Recherche de sous-chaîne
    for normalized, original in normalized_options.items():
        if user_input in normalized or normalized in user_input:
            return {
                "suggestion": original,
                "confidence": 0.9,
                "reason": f"Correspondance partielle avec '{original}'"
            }
    
    # Fuzzy matching avec difflib
    matches = get_close_matches(
        user_input, 
        list(normalized_options.keys()), 
        n=1, 
        cutoff=0.3
    )
    
    if matches:
        original = normalized_options[matches[0]]
        # Calculer un score de confiance basé sur la similarité
        similarity = len(set(user_input) & set(matches[0])) / max(len(user_input), len(matches[0]))
        confidence = max(0.5, min(0.9, similarity))
        
        return {
            "suggestion": original,
            "confidence": round(confidence, 2),
            "reason": f"Similarité détectée avec '{original}'"
        }
    
    return {
        "suggestion": None,
        "confidence": 0.0,
        "reason": "Aucune correspondance trouvée"
    }

