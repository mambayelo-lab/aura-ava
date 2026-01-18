"""Modèles de données pour les graphes sémantiques AVA"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from enum import Enum

class NodeType(str, Enum):
    """Types de nœuds dans les graphes"""
    # Fact Graph
    DECISION = "decision"
    FACT = "fact"
    DATA_OBJECT = "data_object"
    ACTOR = "actor"
    ACTIVITY = "activity"  # Activité métier
    
    # Reasoning Graph
    RULE = "rule"
    CONDITION = "condition"
    CONSEQUENCE = "consequence"
    SIGNAL = "signal"
    PAIN_POINT = "pain_point"

class EdgeType(str, Enum):
    """Types de relations entre nœuds"""
    # Fact Graph
    REQUIRES = "requires"  # Decision → Fact
    STORED_IN = "stored_in"  # Fact → DataObject
    PRODUCED_BY = "produced_by"  # Fact → Actor
    
    # Reasoning Graph
    IF = "if"  # Condition → Rule
    THEN = "then"  # Rule → Consequence
    TRIGGERS = "triggers"  # Fact → Signal
    BLOCKS = "blocks"  # PainPoint → Decision
    
    # Transforming Graph
    PART_OF = "part_of"  # Activity → Perimeter
    DECOMPOSED_INTO = "decomposed_into"  # Parent Activity → Child Activity
    PARALLEL = "parallel"  # Activity → Activity (en parallèle)
    LOOP = "loop"  # Activity → Activity (boucle)
    PERFORMS = "performs"  # Actor → Activity
    RELATED_TO = "related_to"  # Generic relation

class Node(BaseModel):
    """Nœud générique dans un graphe"""
    id: str
    type: NodeType
    label: str
    data: Dict[str, Any] = {}
    
class Edge(BaseModel):
    """Arête générique dans un graphe"""
    id: str
    source: str  # Node ID
    target: str  # Node ID
    type: EdgeType
    label: Optional[str] = None

class FactGraph(BaseModel):
    """Graphe de faits"""
    nodes: List[Node] = []
    edges: List[Edge] = []
    
    def to_dict(self):
        return {
            "nodes": [n.model_dump() for n in self.nodes],
            "edges": [e.model_dump() for e in self.edges]
        }

class ReasoningGraph(BaseModel):
    """Graphe de raisonnement"""
    nodes: List[Node] = []
    edges: List[Edge] = []
    
    def to_dict(self):
        return {
            "nodes": [n.model_dump() for n in self.nodes],
            "edges": [e.model_dump() for e in self.edges]
        }

class CompilationResult(BaseModel):
    """Résultat de compilation"""
    interview_id: str
    fact_graph: FactGraph
    reasoning_graph: ReasoningGraph
    validation: Dict[str, Any]
    stats: Dict[str, int]

