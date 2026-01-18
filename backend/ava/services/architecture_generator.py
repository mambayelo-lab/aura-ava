"""Génère schémas d'architecture depuis ontologie"""
from typing import Dict, Any, List

class ArchitectureGenerator:
    """Génère schémas d'architecture depuis ontologie"""
    
    def generate_capability_map(self, compilation: Dict[str, Any]) -> str:
        """
        Génère cartographie capabilities (Mermaid)
        
        Returns: Code Mermaid
        """
        domains = compilation.get("domains", [])
        normalized_activities = compilation.get("normalized_activities", [])
        
        mermaid = ["graph TB"]
        mermaid.append("  classDef domain fill:#e1bee7,stroke:#8e24aa,stroke-width:3px")
        mermaid.append("  classDef activity fill:#c5e1a5,stroke:#7cb342,stroke-width:2px")
        mermaid.append("")
        
        # Domaines
        for domain in domains:
            domain_id = domain["id"].replace("-", "_")
            mermaid.append(f"  {domain_id}[\"{domain['name']}\"]")
            mermaid.append(f"  class {domain_id} domain")
        
        mermaid.append("")
        
        # Activités par domaine
        for domain in domains:
            domain_id = domain["id"].replace("-", "_")
            domain_activities = [
                a for a in normalized_activities 
                if a["id"] in domain["activities"] and a["level"] == 1
            ]
            
            for activity in domain_activities:
                act_id = activity["id"].replace("-", "_")
                mermaid.append(f"  {act_id}[\"{activity['normalized_label']}\"]")
                mermaid.append(f"  class {act_id} activity")
                mermaid.append(f"  {domain_id} --> {act_id}")
        
        return "\n".join(mermaid)
    
    def generate_activity_flow(self, compilation: Dict[str, Any]) -> str:
        """
        Génère diagramme de flux activités (Mermaid)
        """
        ontology_graph = compilation.get("ontology_graph", {})
        nodes = ontology_graph.get("nodes", [])
        edges = ontology_graph.get("edges", [])
        
        # Filtrer activités niveau 1
        activity_nodes = [
            n for n in nodes 
            if n.get("data", {}).get("type") == "activity" 
            and n.get("data", {}).get("level") == 1
        ]
        
        mermaid = ["graph LR"]
        mermaid.append("  classDef activity fill:#81c784,stroke:#388e3c,stroke-width:2px")
        mermaid.append("")
        
        # Nodes
        for node in activity_nodes:
            node_id = node["id"].replace("-", "_")
            label = node["label"].replace('"', "'")
            mermaid.append(f"  {node_id}[\"{label}\"]")
            mermaid.append(f"  class {node_id} activity")
        
        mermaid.append("")
        
        # Edges (flux)
        flow_edges = [
            e for e in edges 
            if e.get("type") in ["then", "parallel", "if"]
        ]
        
        for edge in flow_edges:
            source = edge["source"].replace("-", "_")
            target = edge["target"].replace("-", "_")
            edge_type = edge.get("type")
            label = edge.get("label", "")
            
            arrow = {
                "then": "-->",
                "parallel": "-.->",
                "if": "-->",
            }.get(edge_type, "-->")
            
            edge_label = f"|{label}|" if label else ""
            mermaid.append(f"  {source} {arrow}{edge_label} {target}")
        
        return "\n".join(mermaid)
    
    def generate_actor_matrix(self, compilation: Dict[str, Any]) -> str:
        """
        Génère matrice RACI (Mermaid + Markdown table)
        """
        ontology_graph = compilation.get("ontology_graph", {})
        nodes = ontology_graph.get("nodes", [])
        edges = ontology_graph.get("edges", [])
        
        # Acteurs
        actors = [n for n in nodes if n.get("type") == "actor"]
        
        # Activités niveau 1
        activities = [
            n for n in nodes 
            if n.get("data", {}).get("type") == "activity"
            and n.get("data", {}).get("level") == 1
        ]
        
        # Matrice
        markdown = ["| Activité |"]
        markdown[0] += " | ".join([a["label"] for a in actors]) + " |"
        markdown.append("|" + "---|" * (len(actors) + 1))
        
        for activity in activities:
            row = [activity["label"]]
            
            for actor in actors:
                # Chercher edge acteur → activité
                performs = any(
                    e for e in edges
                    if e["source"] == actor["id"]
                    and e["target"] == activity["id"]
                    and e.get("type") == "performs"
                )
                row.append("R" if performs else "-")
            
            markdown.append("| " + " | ".join(row) + " |")
        
        return "\n".join(markdown)
    
    def generate_decomposition_tree(self, compilation: Dict[str, Any]) -> str:
        """
        Génère arbre de décomposition (Mermaid)
        """
        hierarchy = compilation.get("hierarchy", {})
        tree = hierarchy.get("tree", {})
        
        mermaid = ["graph TD"]
        mermaid.append("  classDef l1 fill:#fff9c4,stroke:#f57f17,stroke-width:3px")
        mermaid.append("  classDef l2 fill:#e1f5fe,stroke:#0277bd,stroke-width:2px")
        mermaid.append("  classDef l3 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1px")
        mermaid.append("")
        
        def add_node(node_data: Dict, parent_id: str = None):
            activity = node_data["activity"]
            activity_id = activity["id"].replace("-", "_")
            label = activity["label"].replace('"', "'")
            level = activity.get("level", 1)
            
            mermaid.append(f"  {activity_id}[\"{label}\"]")
            mermaid.append(f"  class {activity_id} l{level}")
            
            if parent_id:
                mermaid.append(f"  {parent_id.replace('-', '_')} --> {activity_id}")
            
            for child in node_data.get("children", []):
                add_node(child, activity["id"])
        
        for root_id, root_tree in tree.items():
            add_node(root_tree)
        
        return "\n".join(mermaid)

