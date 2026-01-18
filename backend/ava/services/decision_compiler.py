"""Compile une interview décisionnelle en graphes déterministes"""
from typing import Dict, Any, List
from ..models.decision_interview import DecisionInterview
from ..models.graphs import Node, Edge, FactGraph, ReasoningGraph, NodeType, EdgeType
import re

class DecisionCompiler:
    """Compile une interview décisionnelle en graphes déterministes"""
    
    def compile(self, interview: DecisionInterview) -> Dict[str, Any]:
        """
        Compile l'interview en Facts Graph + Reasoning Graph
        
        Returns:
            {
                "fact_graph": {...},
                "reasoning_graph": {...},
                "stats": {...}
            }
        """
        fact_nodes = []
        fact_edges = []
        reasoning_nodes = []
        reasoning_edges = []
        
        # 1. Nœud décision principal
        decision_node = Node(
            id="decision_main",
            type=NodeType.DECISION,
            label=interview.decision,
            data={
                "type": "decision",
                "context": interview.context
            }
        )
        fact_nodes.append(decision_node)
        
        # 2. Nœuds pour chaque information requise
        for info in interview.infos:
            info_node = Node(
                id=info.id,
                type=NodeType.FACT,
                label=info.label,
                data={
                    "source": info.source,
                    "required": True
                }
            )
            fact_nodes.append(info_node)
            
            # Edge : décision → info (la décision nécessite cette info)
            fact_edges.append(Edge(
                id=f"edge_decision_{info.id}",
                source="decision_main",
                target=info.id,
                type=EdgeType.REQUIRES
            ))
        
        # 3. Nœuds pour les règles métier
        for rule in interview.rules:
            # Parser la condition pour extraire les faits référencés
            referenced_facts = self._extract_facts_from_condition(rule.condition)
            
            rule_node = Node(
                id=rule.id,
                type=NodeType.RULE,
                label=f"{rule.type}: {rule.condition} → {rule.consequence}",
                data={
                    "rule_type": rule.type,
                    "condition": rule.condition,
                    "consequence": rule.consequence,
                    "referenced_facts": referenced_facts
                }
            )
            reasoning_nodes.append(rule_node)
            
            # Edge : règle → décision
            edge_type = EdgeType.IF if rule.type == "SI_ALORS" else EdgeType.IF  # Utiliser IF pour les deux types
            reasoning_edges.append(Edge(
                id=f"edge_rule_{rule.id}",
                source=rule.id,
                target="decision_main",
                type=edge_type,
                label=rule.type
            ))
        
        # 4. Nœuds pour les signaux d'alerte
        for signal in interview.signals:
            signal_node = Node(
                id=signal.id,
                type=NodeType.SIGNAL,
                label=f"{signal.event} → {signal.action}",
                data={
                    "event": signal.event,
                    "action": signal.action,
                    "severity": signal.severity or "MEDIUM"
                }
            )
            reasoning_nodes.append(signal_node)
            
            # Edge : signal → décision (le signal déclenche une action sur la décision)
            reasoning_edges.append(Edge(
                id=f"edge_signal_{signal.id}",
                source=signal.id,
                target="decision_main",
                type=EdgeType.TRIGGERS
            ))
        
        # Construire les graphes
        fact_graph = FactGraph(nodes=fact_nodes, edges=fact_edges)
        reasoning_graph = ReasoningGraph(nodes=reasoning_nodes, edges=reasoning_edges)
        
        return {
            "fact_graph": fact_graph.to_dict(),
            "reasoning_graph": reasoning_graph.to_dict(),
            "stats": {
                "facts_count": len([n for n in fact_nodes if n.type == NodeType.FACT]),
                "rules_count": len([n for n in reasoning_nodes if n.type == NodeType.RULE]),
                "signals_count": len([n for n in reasoning_nodes if n.type == NodeType.SIGNAL]),
                "infos_required": len(interview.infos)
            }
        }
    
    def _extract_facts_from_condition(self, condition: str) -> List[str]:
        """
        Extrait les noms de faits depuis une condition
        
        Ex: "montant > 10000 ET client nouveau" → ["montant", "client"]
        """
        # Retirer les opérateurs et nombres
        cleaned = re.sub(r'[><=!&|()]', ' ', condition)
        cleaned = re.sub(r'\d+', '', cleaned)
        
        # Extraire les mots significatifs (pas ET, OU, etc.)
        stop_words = {'et', 'ou', 'si', 'alors', 'tant', 'que', 'de', 'la', 'le', 'les', 'un', 'une', 'des', 'du', 'dans', 'pour', 'avec'}
        words = [w.strip().lower() for w in cleaned.split() if w.strip()]
        facts = [w for w in words if w not in stop_words and len(w) > 2]
        
        return facts

