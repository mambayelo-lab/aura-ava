from typing import List, Dict, Any, Tuple
from ..models.graphs import FactGraph, Node, NodeType
import json
from pathlib import Path

class FactResolver:
    """
    Résout les faits identifiés dans l'interview en les liant
    aux sources connues (Inventory) ou en identifiant les gaps.
    """
    
    def __init__(self, inventory_graph: FactGraph):
        """
        Args:
            inventory_graph: Fact Graph de l'Inventory existant
        """
        self.inventory = inventory_graph
        self.known_facts = self._extract_known_facts()
    
    def _extract_known_facts(self) -> Dict[str, Node]:
        """Extrait les faits connus de l'Inventory"""
        facts = {}
        for node in self.inventory.nodes:
            if node.type == NodeType.FACT:
                # Normaliser le label pour la recherche
                normalized = node.label.lower().strip()
                facts[normalized] = node
        return facts
    
    def resolve_facts(
        self, 
        required_facts: List[str]
    ) -> Tuple[List[Dict], List[str]]:
        """
        Résout une liste de faits requis
        
        Returns:
            - matched: Faits trouvés dans l'Inventory avec leurs sources
            - gaps: Faits manquants (à enrichir)
        """
        matched = []
        gaps = []
        
        for fact_label in required_facts:
            normalized = fact_label.lower().strip()
            
            # Recherche exacte
            if normalized in self.known_facts:
                matched.append({
                    "label": fact_label,
                    "status": "matched",
                    "confidence": 1.0,
                    "source": self._get_fact_source(normalized),
                    "inventory_node_id": self.known_facts[normalized].id
                })
            else:
                # Recherche fuzzy (similitude)
                similar = self._find_similar_facts(normalized)
                if similar:
                    matched.append({
                        "label": fact_label,
                        "status": "similar",
                        "confidence": similar["confidence"],
                        "similar_to": similar["fact"],
                        "source": similar["source"],
                        "inventory_node_id": similar["node_id"]
                    })
                else:
                    gaps.append(fact_label)
        
        return matched, gaps
    
    def _get_fact_source(self, normalized_fact: str) -> Dict[str, Any]:
        """Récupère la source d'un fait depuis l'Inventory"""
        node = self.known_facts[normalized_fact]
        
        # Chercher les edges STORED_IN
        for edge in self.inventory.edges:
            # EdgeType est un Enum, accéder à sa valeur
            edge_type_value = edge.type.value if hasattr(edge.type, 'value') else str(edge.type)
            if edge.source == node.id and edge_type_value == "stored_in":
                # Trouver le nœud DataObject cible
                for n in self.inventory.nodes:
                    if n.id == edge.target:
                        return {
                            "type": "known",
                            "system": n.label,
                            "details": n.data
                        }
        
        return {"type": "unknown", "system": "Unknown"}
    
    def _find_similar_facts(
        self, 
        normalized_fact: str
    ) -> Dict[str, Any] | None:
        """Recherche de faits similaires (fuzzy matching)"""
        from difflib import SequenceMatcher
        
        best_match = None
        best_score = 0.0
        threshold = 0.7  # Seuil de similarité
        
        for known_label, node in self.known_facts.items():
            score = SequenceMatcher(None, normalized_fact, known_label).ratio()
            
            if score > threshold and score > best_score:
                best_score = score
                best_match = {
                    "fact": node.label,
                    "confidence": score,
                    "source": self._get_fact_source(known_label),
                    "node_id": node.id
                }
        
        return best_match
    
    def enrich_inventory(
        self, 
        new_fact_label: str,
        source_info: Dict[str, Any]
    ) -> Node:
        """
        Enrichit l'Inventory avec un nouveau fait
        
        Returns:
            Le nouveau nœud créé
        """
        new_node = Node(
            id=f"fact_{len(self.inventory.nodes)}",
            type=NodeType.FACT,
            label=new_fact_label,
            data={
                "origin": "decision_interview",
                "source": source_info,
                "status": "pending_validation"
            }
        )
        
        self.inventory.nodes.append(new_node)
        self.known_facts[new_fact_label.lower().strip()] = new_node
        
        return new_node

