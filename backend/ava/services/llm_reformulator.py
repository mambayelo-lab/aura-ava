from typing import Dict, Any, List

class LLMReformulator:
    """
    Reformule les réponses structurées en prose
    Le LLM NE CRÉE PAS de contenu - il reformule uniquement
    """
    
    def __init__(self):
        # Pour MVP, on utilise des templates simples
        # Plus tard, on pourra intégrer un vrai LLM (Claude, GPT) pour reformuler
        pass
    
    def reformulate_fact_answer(
        self, 
        question: str, 
        fact_result: Dict[str, Any]
    ) -> str:
        """
        Reformule une réponse factuelle
        
        Input structuré:
        {
            "found": True,
            "value": "1500€",
            "label": "montant commande",
            "source": "SAP ERP"
        }
        
        Output prose:
        "Le montant de la commande est de 1500€, selon les données du SAP ERP."
        """
        if not fact_result.get("found"):
            return f"Je n'ai pas trouvé d'information sur '{fact_result.get('label', 'cette donnée')}' dans les données disponibles."
        
        label = fact_result.get("label", "Information")
        value = fact_result.get("value", "N/A")
        source = fact_result.get("source", "source inconnue")
        
        # Template simple pour MVP
        return (
            f"{label.capitalize()} : {value}. "
            f"Source : {source}."
        )
    
    def reformulate_rule_answer(
        self, 
        question: str, 
        rule_result: Dict[str, Any]
    ) -> str:
        """Reformule une réponse de règle"""
        if rule_result.get("satisfied") is None:
            return rule_result.get("reason", "Aucune règle trouvée")
        
        satisfied = rule_result.get("satisfied", False)
        reason = rule_result.get("reason", "")
        rule = rule_result.get("rule", "")
        
        status = "OUI" if satisfied else "NON"
        return f"{status}. {reason}"
    
    def reformulate_alerts(
        self, 
        alerts: List[Dict[str, Any]]
    ) -> str:
        """Reformule les alertes"""
        if not alerts:
            return "Aucune alerte active actuellement."
        
        lines = [f"⚠️ {len(alerts)} alerte(s) active(s) :"]
        
        for alert in alerts:
            severity_emoji = {
                "LOW": "ℹ️",
                "low": "ℹ️",
                "MEDIUM": "⚠️",
                "medium": "⚠️",
                "HIGH": "🚨",
                "high": "🚨",
                "CRITICAL": "🚨",
                "critical": "🚨"
            }
            severity = alert.get("severity", "MEDIUM")
            emoji = severity_emoji.get(severity, "⚠️")
            
            label = alert.get("label", "Alerte")
            reason = alert.get("reason", "")
            
            lines.append(f"{emoji} {label} - {reason}")
        
        return "\n".join(lines)
    
    def reformulate_decision_status(
        self,
        decision_info: Dict[str, Any]
    ) -> str:
        """Reformule le statut d'une décision"""
        status = decision_info.get("status", "unknown")
        return f"Le statut de la décision est : {status}"

