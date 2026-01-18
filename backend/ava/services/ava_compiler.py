"""Service de compilation AVA - Transforme les interviews en graphes sémantiques"""
from typing import Dict, Any
from ..models.graphs import (
    CompilationResult, FactGraph, ReasoningGraph,
    Node, Edge, NodeType, EdgeType
)
from ..models.ontology import Interview

class AVACompiler:
    """
    Compilateur sémantique AVA
    Transforme une Interview en graphes exploitables
    """
    
    def compile(self, interview: Interview) -> CompilationResult:
        """
        Compile l'interview en graphes sémantiques
        """
        # Build graphs
        fact_graph = self._build_fact_graph(interview)
        reasoning_graph = self._build_reasoning_graph(interview)
        
        # Validate
        validation = self._validate_graphs(fact_graph, reasoning_graph)
        
        # Compute stats
        stats = self._compute_stats(fact_graph, reasoning_graph)
        
        return CompilationResult(
            interview_id=interview.id,
            fact_graph=fact_graph,
            reasoning_graph=reasoning_graph,
            validation=validation,
            stats=stats
        )
    
    def _build_fact_graph(self, interview: Interview) -> FactGraph:
        """
        Construit le graphe de faits
        
        Structure:
        Decision (root)
          └─[REQUIRES]→ Fact
              ├─[STORED_IN]→ DataObject
              └─[PRODUCED_BY]→ Actor
        """
        nodes = []
        edges = []
        
        # Get decision (first decision in the list)
        decision = interview.decisions[0] if interview.decisions else None
        if not decision:
            return FactGraph(nodes=[], edges=[])
        
        # 1. Add Decision node (root)
        decision_node = Node(
            id=f"decision-{interview.id}",
            type=NodeType.DECISION,
            label=decision.label,
            data={
                "id": decision.id,
                "label": decision.label,
                "description": decision.description
            }
        )
        nodes.append(decision_node)
        
        # 2. Add Fact nodes
        for idx, fact in enumerate(decision.required_facts or []):
            fact_id = f"fact-{fact.id}"
            
            fact_node = Node(
                id=fact_id,
                type=NodeType.FACT,
                label=fact.label,
                data={
                    "id": fact.id,
                    "label": fact.label,
                    "source_type": fact.source_type,
                    "description": fact.description
                }
            )
            nodes.append(fact_node)
            
            # Link Decision → Fact
            edges.append(Edge(
                id=f"edge-d-f-{idx}",
                source=decision_node.id,
                target=fact_id,
                type=EdgeType.REQUIRES
            ))
            
            # 3. Add Origin (DataObject) if description exists
            if fact.description:
                origin_id = f"origin-{fact.id}"
                origin_node = Node(
                    id=origin_id,
                    type=NodeType.DATA_OBJECT,
                    label=fact.description,
                    data={
                        "source_type": fact.source_type,
                        "description": fact.description
                    }
                )
                nodes.append(origin_node)
                
                # Link Fact → Origin
                edges.append(Edge(
                    id=f"edge-f-o-{idx}",
                    source=fact_id,
                    target=origin_id,
                    type=EdgeType.STORED_IN
                ))
        
        return FactGraph(nodes=nodes, edges=edges)
    
    def _build_reasoning_graph(self, interview: Interview) -> ReasoningGraph:
        """
        Construit le graphe de raisonnement
        
        Structure:
        Condition ─[IF]→ Rule ─[THEN]→ Consequence
        Fact ─[TRIGGERS]→ Signal
        PainPoint ─[BLOCKS]→ Decision
        """
        nodes = []
        edges = []
        
        # Get decision
        decision = interview.decisions[0] if interview.decisions else None
        if not decision:
            return ReasoningGraph(nodes=[], edges=[])
        
        # 1. Add Rule nodes
        for idx, rule in enumerate(decision.rules or []):
            rule_id = f"rule-{rule.id}"
            
            # Rule node
            rule_node = Node(
                id=rule_id,
                type=NodeType.RULE,
                label=f"{rule.type.upper().replace('_', '-')}",
                data={
                    "id": rule.id,
                    "type": rule.type,
                    "condition": rule.condition,
                    "consequence": rule.consequence
                }
            )
            nodes.append(rule_node)
            
            # Condition node
            condition_id = f"condition-{rule.id}"
            condition_node = Node(
                id=condition_id,
                type=NodeType.CONDITION,
                label=rule.condition[:50] + "..." if len(rule.condition) > 50 else rule.condition,
                data={"text": rule.condition}
            )
            nodes.append(condition_node)
            
            # Consequence node
            consequence_id = f"consequence-{rule.id}"
            consequence_node = Node(
                id=consequence_id,
                type=NodeType.CONSEQUENCE,
                label=rule.consequence[:50] + "..." if len(rule.consequence) > 50 else rule.consequence,
                data={"text": rule.consequence}
            )
            nodes.append(consequence_node)
            
            # Link Condition → Rule → Consequence
            edges.append(Edge(
                id=f"edge-c-r-{idx}",
                source=condition_id,
                target=rule_id,
                type=EdgeType.IF
            ))
            edges.append(Edge(
                id=f"edge-r-c-{idx}",
                source=rule_id,
                target=consequence_id,
                type=EdgeType.THEN
            ))
        
        # 2. Add Signal nodes
        for idx, signal in enumerate(decision.signals or []):
            signal_id = f"signal-{signal.id}"
            
            signal_node = Node(
                id=signal_id,
                type=NodeType.SIGNAL,
                label=signal.label,
                data={
                    "id": signal.id,
                    "label": signal.label,
                    "description": signal.description,
                    "condition": signal.condition,
                    "severity": signal.severity,
                    "context": signal.context
                }
            )
            nodes.append(signal_node)
        
        # 3. Add PainPoint nodes
        for idx, pain in enumerate(decision.pain_points or []):
            pain_id = f"pain-{pain.id}"
            
            pain_node = Node(
                id=pain_id,
                type=NodeType.PAIN_POINT,
                label=pain.description[:50] + "..." if len(pain.description) > 50 else pain.description,
                data={
                    "id": pain.id,
                    "type": pain.type,
                    "description": pain.description,
                    "impact": pain.impact,
                    "criticality": pain.criticality
                }
            )
            nodes.append(pain_node)
            
            # Link PainPoint → Decision
            decision_id = f"decision-{interview.id}"
            edges.append(Edge(
                id=f"edge-p-d-{idx}",
                source=pain_id,
                target=decision_id,
                type=EdgeType.BLOCKS
            ))
        
        return ReasoningGraph(nodes=nodes, edges=edges)
    
    def _validate_graphs(self, fact_graph: FactGraph, reasoning_graph: ReasoningGraph) -> Dict[str, Any]:
        """
        Valide la cohérence des graphes
        """
        issues = []
        
        # Check: Au moins 1 fait
        fact_nodes = [n for n in fact_graph.nodes if n.type == NodeType.FACT]
        if len(fact_nodes) == 0:
            issues.append({
                "level": "warning",
                "message": "Aucun fait identifié. La décision manque de données."
            })
        
        # Check: Au moins 1 règle
        rule_nodes = [n for n in reasoning_graph.nodes if n.type == NodeType.RULE]
        if len(rule_nodes) == 0:
            issues.append({
                "level": "warning",
                "message": "Aucune règle métier définie."
            })
        
        return {
            "valid": len([i for i in issues if i.get("level") == "error"]) == 0,
            "issues": issues
        }
    
    def _compute_stats(self, fact_graph: FactGraph, reasoning_graph: ReasoningGraph) -> Dict[str, int]:
        """
        Calcule les statistiques des graphes
        """
        return {
            "total_nodes": len(fact_graph.nodes) + len(reasoning_graph.nodes),
            "total_edges": len(fact_graph.edges) + len(reasoning_graph.edges),
            "facts": len([n for n in fact_graph.nodes if n.type == NodeType.FACT]),
            "rules": len([n for n in reasoning_graph.nodes if n.type == NodeType.RULE]),
            "signals": len([n for n in reasoning_graph.nodes if n.type == NodeType.SIGNAL]),
            "pain_points": len([n for n in reasoning_graph.nodes if n.type == NodeType.PAIN_POINT])
        }
