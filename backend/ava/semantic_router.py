"""Router sémantique simple pour Ask Aura v0"""
from typing import Dict, List, Any
from .main import PROCESSES, SUBMITTED_PROCESSES, FACTS, load_initiatives
from .architecture import CAPABILITIES


def route_question(question: str) -> Dict[str, Any]:
    """Route une question vers les sources pertinentes"""
    question_lower = question.lower()
    
    # Router simple basé sur mots-clés
    if "capability" in question_lower or "capabilities" in question_lower or "capabilité" in question_lower:
        return {
            "type": "capabilities",
            "sources": ["capabilities"],
            "rules": ["Extraction depuis interviews"]
        }
    
    if "fragilité" in question_lower or "fragile" in question_lower or "risque" in question_lower:
        return {
            "type": "fragility",
            "sources": ["interviews"],
            "rules": ["Extraction du champ fragility"]
        }
    
    if "application" in question_lower or "applications" in question_lower or "système" in question_lower or "system" in question_lower:
        return {
            "type": "systems",
            "sources": ["interviews", "architecture"],
            "rules": ["Extraction du champ systems"]
        }
    
    # Par défaut : recherche générale
    return {
        "type": "general",
        "sources": ["interviews", "initiatives", "facts"],
        "rules": ["Recherche dans tous les éléments"]
    }


def answer_question(question: str, route: Dict[str, Any]) -> Dict[str, Any]:
    """Génère une réponse basée sur le routing"""
    question_lower = question.lower()
    facts_used = []
    interpretation = ""
    
    if route["type"] == "capabilities":
        # Lister les capabilities
        all_caps = []
        for process in PROCESSES.values():
            if process.id in SUBMITTED_PROCESSES:
                state = process.state or {}
                command = state.get("command", "")
                business_object = state.get("business_object", "")
                if command and business_object:
                    all_caps.append(f"{command} {business_object}")
        
        interpretation = f"Capabilities détectées: {', '.join(all_caps[:5])}" if all_caps else "Aucune capability détectée"
        facts_used = all_caps[:5]
    
    elif route["type"] == "fragility":
        fragilities = []
        for process in PROCESSES.values():
            if process.id in SUBMITTED_PROCESSES:
                fragility = (process.state or {}).get("fragility", "")
                if fragility:
                    fragilities.append(f"{process.name}: {fragility}")
        
        interpretation = "\n".join(fragilities) if fragilities else "Aucune fragilité identifiée"
        facts_used = fragilities
    
    elif route["type"] == "systems":
        systems = []
        for process in PROCESSES.values():
            if process.id in SUBMITTED_PROCESSES:
                sys = (process.state or {}).get("systems", "")
                if sys:
                    systems.append(f"{process.name}: {sys}")
        
        interpretation = "\n".join(systems) if systems else "Aucun système identifié"
        facts_used = systems
    
    else:
        # Recherche générale
        matches = []
        for process in PROCESSES.values():
            state_text = " ".join((process.state or {}).values()).lower()
            if any(word in state_text for word in question_lower.split()):
                matches.append(process.name)
        
        interpretation = f"Éléments trouvés: {', '.join(matches[:5])}" if matches else "Aucun élément trouvé"
        facts_used = matches[:5]
    
    return {
        "question": question,
        "facts": facts_used,
        "interpretation": interpretation,
        "confidence": 70 if facts_used else 30,
        "rules_applied": route["rules"]
    }

