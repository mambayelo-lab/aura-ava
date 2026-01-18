from typing import Dict, Any, List
from ..models.graphs import FactGraph, ReasoningGraph, Node

class DeterministicQueryEngine:
    """
    Moteur de requête DÉTERMINISTE sur les graphes
    PAS de LLM ici - uniquement de la logique
    """
    
    def __init__(self, fact_graph: FactGraph, reasoning_graph: ReasoningGraph):
        self.facts = fact_graph
        self.reasoning = reasoning_graph
    
    def query_fact(self, entity: str, object_name: str = None) -> Dict[str, Any]:
        """
        Requête sur un fait spécifique
        
        Returns:
            {
                "found": bool,
                "value": Any,
                "source": str,
                "confidence": float
            }
        """
        # Normaliser la recherche
        entity_lower = entity.lower() if entity else ""
        
        # Chercher dans le Fact Graph
        for node in self.facts.nodes:
            if node.type.value == "fact":
                label_lower = node.label.lower()
                
                # Match exact ou partiel
                if entity_lower and (entity_lower in label_lower or label_lower in entity_lower):
                    # Si object_name est spécifié, vérifier aussi
                    if object_name:
                        object_lower = object_name.lower()
                        if object_lower not in label_lower:
                            continue
                    
                    # Trouver la source
                    source = self._find_fact_source(node.id)
                    
                    return {
                        "found": True,
                        "value": node.data.get("value", "N/A"),
                        "label": node.label,
                        "source": source,
                        "confidence": 1.0
                    }
        
        return {
            "found": False,
            "value": None,
            "label": entity or "Unknown",
            "source": None,
            "confidence": 0.0
        }
    
    def evaluate_rule(self, condition: str) -> Dict[str, Any]:
        """
        Évalue si une règle métier est respectée
        
        Returns:
            {
                "satisfied": bool,
                "rule": str,
                "reason": str
            }
        """
        # Chercher les règles qui matchent
        for node in self.reasoning.nodes:
            if node.type.value == "rule":
                rule_text = node.label.lower()
                rule_data = node.data or {}
                
                # Simple matching (peut être amélioré)
                if condition.lower() in rule_text or condition.lower() in str(rule_data.get("condition", "")).lower():
                    # Évaluer la règle (simplifié pour MVP)
                    satisfied = self._evaluate_rule_logic(node)
                    
                    return {
                        "satisfied": satisfied,
                        "rule": node.label,
                        "condition": rule_data.get("condition", ""),
                        "consequence": rule_data.get("consequence", ""),
                        "reason": self._get_rule_reason(node, satisfied)
                    }
        
        return {
            "satisfied": None,
            "rule": None,
            "reason": "Aucune règle trouvée pour cette condition"
        }
    
    def check_signals(self) -> List[Dict[str, Any]]:
        """
        Vérifie tous les signaux d'alerte
        
        Returns:
            Liste des alertes actives
        """
        alerts = []
        
        for node in self.reasoning.nodes:
            if node.type.value == "signal":
                # Évaluer si le signal est déclenché
                triggered = self._evaluate_signal(node)
                
                if triggered:
                    alerts.append({
                        "id": node.id,
                        "label": node.label,
                        "severity": node.data.get("severity", "MEDIUM") if node.data else "MEDIUM",
                        "triggered_at": node.data.get("triggered_at") if node.data else None,
                        "reason": self._get_signal_reason(node)
                    })
        
        return alerts
    
    def _find_fact_source(self, fact_id: str) -> str:
        """Trouve la source d'un fait"""
        for edge in self.facts.edges:
            edge_type_value = edge.type.value if hasattr(edge.type, 'value') else str(edge.type)
            if edge.source == fact_id and edge_type_value == "stored_in":
                # Trouver le nœud DataObject
                for node in self.facts.nodes:
                    if node.id == edge.target:
                        return node.label
        return "Unknown"
    
    def _evaluate_rule_logic(self, rule_node: Node) -> bool:
        """Évalue la logique d'une règle (simplifié)"""
        # TODO: Implémenter évaluation réelle basée sur les faits
        # Pour MVP, retourner True par défaut
        # On pourrait vérifier si les conditions sont remplies dans les faits
        rule_data = rule_node.data or {}
        condition = rule_data.get("condition", "")
        
        # Simple check: si la condition contient des mots-clés de validation
        if "dépass" in condition.lower() or "excé" in condition.lower():
            # Pour MVP, on suppose que c'est vérifié (à améliorer avec vraies données)
            return False  # Par défaut, on considère que les seuils ne sont pas dépassés
        
        return True
    
    def _get_rule_reason(self, rule_node: Node, satisfied: bool) -> str:
        """Génère la raison d'une évaluation de règle"""
        rule_data = rule_node.data or {}
        condition = rule_data.get("condition", "")
        consequence = rule_data.get("consequence", "")
        
        if satisfied:
            return f"La règle '{rule_node.label}' est respectée. {consequence}"
        else:
            return f"La règle '{rule_node.label}' N'est PAS respectée. Condition: {condition}"
    
    def _evaluate_signal(self, signal_node: Node) -> bool:
        """Évalue si un signal est déclenché"""
        # TODO: Implémenter évaluation réelle
        # Pour MVP, check si un threshold est défini et dépassé
        signal_data = signal_node.data or {}
        threshold = signal_data.get("threshold")
        current_value = signal_data.get("current_value")
        condition = signal_data.get("condition", "")
        
        if threshold and current_value:
            return current_value > threshold
        
        # Si pas de threshold, on peut déclencher basé sur la condition
        # Pour MVP, on simule quelques alertes
        if "dépass" in condition.lower() or "seuil" in condition.lower():
            # Simuler un déclenchement (à remplacer par vraie logique)
            return True
        
        return False
    
    def _get_signal_reason(self, signal_node: Node) -> str:
        """Génère la raison du déclenchement d'un signal"""
        signal_data = signal_node.data or {}
        condition = signal_data.get("condition", "")
        return condition or f"Signal '{signal_node.label}' déclenché"

