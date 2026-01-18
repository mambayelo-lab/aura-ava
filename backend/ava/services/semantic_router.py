from typing import Dict, Any, Literal
import re

QuestionType = Literal[
    "FACT_QUERY",       # "Quel est le montant ?"
    "RULE_CHECK",       # "Est-ce autorisé ?"
    "SIGNAL_ALERT",     # "Y a-t-il des alertes ?"
    "DECISION_STATUS",  # "Où en est la décision ?"
    "UNKNOWN"
]

class SemanticRouter:
    """
    Route les questions vers le bon handler SANS LLM
    Basé sur des patterns déterministes
    """
    
    def __init__(self):
        self.patterns = {
            "FACT_QUERY": [
                r'\b(quel|combien|montant|valeur|statut|date)\b',
                r'\b(est|sont)\s+(le|la|les)\b',
                r'\bdonn[ée]es?\b',
            ],
            "RULE_CHECK": [
                r'\b(peut|autoris[ée]|permis|valid[ée])\b',
                r'\b(respect|conforme|règle)\b',
                r'\b(doit|faut)\b',
            ],
            "SIGNAL_ALERT": [
                r'\b(alerte|signal|problème|risque)\b',
                r'\b(dépass|seuil|limite)\b',
                r'\b(attention|warning)\b',
            ],
            "DECISION_STATUS": [
                r'\b(statut|état|avancement)\b.*\bdécision\b',
                r'\bdécision\b.*\b(prise|validée|en cours)\b',
            ]
        }
    
    def route(self, question: str) -> QuestionType:
        """
        Route la question vers le bon type
        
        Returns:
            Type de question détecté
        """
        question_lower = question.lower()
        
        # Check patterns par ordre de priorité
        for qtype, patterns in self.patterns.items():
            for pattern in patterns:
                if re.search(pattern, question_lower):
                    return qtype  # type: ignore
        
        return "UNKNOWN"
    
    def extract_entities(self, question: str) -> Dict[str, Any]:
        """
        Extrait les entités clés de la question
        
        Exemple:
        - "Quel est le montant de la commande ?" → {"entity": "montant", "object": "commande"}
        - "Le budget est-il dépassé ?" → {"entity": "budget", "condition": "dépassé"}
        """
        entities = {}
        
        # Patterns d'extraction
        # Entity principale (montant, statut, etc.)
        entity_match = re.search(
            r'\b(montant|statut|date|budget|quantité|prix|total)\b',
            question.lower()
        )
        if entity_match:
            entities["entity"] = entity_match.group(1)
        
        # Objet métier (commande, facture, etc.)
        object_match = re.search(
            r'\b(commande|facture|client|produit|livraison|contrat)\b',
            question.lower()
        )
        if object_match:
            entities["object"] = object_match.group(1)
        
        # Condition (dépassé, validé, etc.)
        condition_match = re.search(
            r'\b(dépass[ée]|valid[ée]|autoris[ée]|conforme|en attente)\b',
            question.lower()
        )
        if condition_match:
            entities["condition"] = condition_match.group(1)
        
        return entities

