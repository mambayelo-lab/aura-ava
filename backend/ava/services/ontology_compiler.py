"""Compile interview transforming en ontologie business"""
from typing import Dict, Any, List
from ..models.transforming_interview import TransformingInterview
from ..models.graphs import Node, Edge, FactGraph, NodeType, EdgeType
from .semantic_normalizer import SemanticNormalizer
from .domain_detector import DomainDetector

class OntologyCompiler:
    """Compile interview en ontologie business"""
    
    def __init__(self):
        self.normalizer = SemanticNormalizer()
        self.domain_detector = DomainDetector()
    
    def compile(self, interview: TransformingInterview) -> Dict[str, Any]:
        """
        Compile en ontologie
        
        Returns:
            {
                "ontology_graph": {...},
                "normalized_activities": [...],
                "hierarchy": {...},
                "domains": [...],
                "stats": {...}
            }
        """
        nodes = []
        edges = []
        normalized_activities = []
        
        # 1. Nœud périmètre
        perimeter_node = Node(
            id="perimeter_main",
            type=NodeType.DATA_OBJECT,
            label=interview.perimeter,
            data={
                "type": "business_perimeter",
                "objective": interview.objective
            }
        )
        nodes.append(perimeter_node)
        
        # 2. Normaliser et créer nœuds activités
        for activity in interview.activities:
            # Normaliser
            normalized = self.normalizer.normalize_activity_label(activity.label)
            
            normalized_activities.append({
                "id": activity.id,
                "original_label": activity.label,
                "normalized_label": normalized["normalized_label"],
                "verb": normalized["verb"],
                "entity": normalized["entity"],
                "category": normalized["category"],
                "level": activity.level,
                "parent_id": activity.parent_id
            })
            
            activity_node = Node(
                id=activity.id,
                type=NodeType.DATA_OBJECT,
                label=normalized["normalized_label"],
                data={
                    "type": "activity",
                    "original_label": activity.label,
                    "normalized_verb": normalized["verb"],
                    "normalized_entity": normalized["entity"],
                    "category": normalized["category"],
                    "level": activity.level,
                    "who": activity.who,
                    "tools": activity.tools,
                    "order": activity.order
                }
            )
            nodes.append(activity_node)
            
            # Edges
            if activity.level == 1:
                edges.append(Edge(
                    id=f"edge_{activity.id}_perimeter",
                    source=activity.id,
                    target="perimeter_main",
                    type=EdgeType.PART_OF
                ))
            
            if activity.parent_id:
                edges.append(Edge(
                    id=f"edge_{activity.id}_parent",
                    source=activity.id,
                    target=activity.parent_id,
                    type=EdgeType.DECOMPOSED_INTO
                ))
        
        # 3. Flux
        for flow in interview.flows:
            edge_type_map = {
                "PUIS": EdgeType.THEN,
                "EN_PARALLELE": EdgeType.PARALLEL,
                "SI_ALORS": EdgeType.IF,
                "BOUCLE": EdgeType.LOOP
            }
            edge_type = edge_type_map.get(flow.type, EdgeType.RELATED_TO)
            
            edges.append(Edge(
                id=flow.id,
                source=flow.source_activity_id,
                target=flow.target_activity_id,
                type=edge_type,
                label=flow.condition if flow.type == "SI_ALORS" else flow.type
            ))
        
        # 4. Détecter flux implicites
        activity_labels = [a.label for a in interview.activities if a.level == 1]
        implicit_flows = self.normalizer.detect_implicit_flows(activity_labels)
        
        for flow in implicit_flows:
            source_id = next((a.id for a in interview.activities if a.label == flow["source"]), None)
            target_id = next((a.id for a in interview.activities if a.label == flow["target"]), None)
            
            if source_id and target_id:
                edges.append(Edge(
                    id=f"implicit_{source_id}_{target_id}",
                    source=source_id,
                    target=target_id,
                    type=EdgeType.THEN,
                    label=f"Détecté ({flow['confidence']*100:.0f}%)"
                ))
        
        # 5. Acteurs
        for actor in interview.actors:
            actor_node = Node(
                id=actor.id,
                type=NodeType.ACTOR,
                label=actor.name,
                data={"type": actor.type, "role": actor.role}
            )
            nodes.append(actor_node)
            
            for activity_id in actor.activities:
                edges.append(Edge(
                    id=f"edge_actor_{actor.id}_{activity_id}",
                    source=actor.id,
                    target=activity_id,
                    type=EdgeType.PERFORMS
                ))
        
        # 6. Pain points
        for pain in interview.pain_points:
            pain_node = Node(
                id=pain.id,
                type=NodeType.PAIN_POINT,
                label=pain.description,
                data={"impact": pain.impact, "severity": pain.severity}
            )
            nodes.append(pain_node)
        
        # 7. Domaines
        domains = interview.domains
        if not domains:
            domains = self.domain_detector.detect_domains(interview.activities)
        
        for domain in domains:
            domain_node = Node(
                id=domain.id,
                type=NodeType.DATA_OBJECT,
                label=domain.name,
                data={
                    "type": "business_domain",
                    "description": domain.description
                }
            )
            nodes.append(domain_node)
        
        # 8. Hiérarchie
        hierarchy = self._build_hierarchy(interview.activities)
        
        ontology_graph = FactGraph(nodes=nodes, edges=edges)
        
        return {
            "ontology_graph": ontology_graph.to_dict(),
            "normalized_activities": normalized_activities,
            "hierarchy": hierarchy,
            "domains": [d.model_dump() for d in domains],
            "stats": {
                "activities_count": len(interview.activities),
                "activities_l1": len([a for a in interview.activities if a.level == 1]),
                "activities_l2": len([a for a in interview.activities if a.level == 2]),
                "actors_count": len(interview.actors),
                "pain_points_count": len(interview.pain_points),
                "domains_count": len(domains),
                "max_depth": max([a.level for a in interview.activities], default=1),
                "flows_explicit": len(interview.flows),
                "flows_implicit": len(implicit_flows)
            }
        }
    
    def _build_hierarchy(self, activities: List) -> Dict[str, Any]:
        """Construit arbre hiérarchique"""
        activities_map = {a.id: a for a in activities}
        root_activities = [a for a in activities if a.level == 1 or not a.parent_id]
        
        def build_tree(activity) -> Dict[str, Any]:
            children = []
            for child_id in activity.children_ids:
                if child_id in activities_map:
                    children.append(build_tree(activities_map[child_id]))
            
            return {
                "activity": activity.model_dump(),
                "children": children
            }
        
        return {
            "root_activities": [a.model_dump() for a in root_activities],
            "tree": {a.id: build_tree(a) for a in root_activities}
        }

