from typing import List, Dict, Any
from ..models.graphs import Node, Edge, FactGraph, NodeType, EdgeType
import re

class OntologyBuilder:
    """
    Construit l'ontologie métier depuis une interview transforming
    (Event Storming mode)
    """
    
    def build_ontology(
        self,
        events: List[Dict[str, Any]],
        policies: List[Dict[str, Any]] = None,
        applications: List[Dict[str, Any]] = None,
        capabilities: List[Dict[str, Any]] = None
    ) -> FactGraph:
        """
        Construit l'Ontology Graph depuis les éléments capturés
        
        Returns:
            FactGraph représentant l'ontologie métier
        """
        nodes = []
        edges = []
        
        policies = policies or []
        applications = applications or []
        capabilities = capabilities or []
        
        # 1. Extraire les concepts métier depuis les événements
        concepts = self._extract_concepts_from_events(events)
        
        for concept_name, concept_data in concepts.items():
            concept_node = Node(
                id=f"concept_{concept_name.lower().replace(' ', '_')}",
                type=NodeType.FACT,  # Les concepts sont des faits potentiels
                label=concept_name,
                data={
                    "type": "business_concept",
                    "source": "event_storming",
                    "events": concept_data["events"],
                    "attributes": concept_data["attributes"]
                }
            )
            nodes.append(concept_node)
        
        # 2. Créer des nœuds pour les règles métier
        for policy in policies:
            policy_node = Node(
                id=policy.get("id", f"policy_{len(nodes)}"),
                type=NodeType.RULE,
                label=policy.get("rule", policy.get("label", "Unknown rule")),
                data={
                    "type": policy.get("type", "OTHER"),
                    "event_id": policy.get("event_id")
                }
            )
            nodes.append(policy_node)
            
            # Lien règle → concept affecté
            affected_concept = self._extract_concept_from_rule(policy.get("rule", policy.get("label", "")))
            if affected_concept:
                concept_id = f"concept_{affected_concept.lower().replace(' ', '_')}"
                if any(n.id == concept_id for n in nodes):
                    edges.append(Edge(
                        id=f"edge_policy_{policy_node.id}",
                        source=policy_node.id,
                        target=concept_id,
                        type=EdgeType.THEN
                    ))
        
        # 3. Créer des nœuds pour les applications
        for app in applications:
            app_node = Node(
                id=app.get("id", f"app_{len(nodes)}"),
                type=NodeType.DATA_OBJECT,
                label=app.get("name", app.get("label", "Unknown app")),
                data={
                    "type": "application_system",
                    "event_ids": app.get("event_ids", [])
                }
            )
            nodes.append(app_node)
            
            # Lien application → concepts gérés
            for event_id in app.get("event_ids", []):
                event = next((e for e in events if e.get("id") == event_id), None)
                if event:
                    concept = self._extract_concept_from_event(event)
                    if concept:
                        concept_id = f"concept_{concept.lower().replace(' ', '_')}"
                        if any(n.id == concept_id for n in nodes):
                            edges.append(Edge(
                                id=f"edge_app_{app_node.id}_{concept_id}",
                                source=concept_id,
                                target=app_node.id,
                                type=EdgeType.STORED_IN
                            ))
        
        # 4. Créer des nœuds pour les capabilities (si NodeType.CAPABILITY existe)
        # Pour l'instant, on les traite comme des DATA_OBJECT
        for cap in capabilities:
            if cap.get("status") not in ["VALIDATED", "RENAMED"]:
                continue
            
            cap_node = Node(
                id=cap.get("id", f"cap_{len(nodes)}"),
                type=NodeType.DATA_OBJECT,  # Fallback si CAPABILITY n'existe pas
                label=cap.get("validated_name") or cap.get("name", "Unknown capability"),
                data={
                    "type": "capability",
                    "level": cap.get("level"),
                    "confidence": cap.get("confidence"),
                    "linked_concepts": self._extract_concepts_from_capability(cap)
                }
            )
            nodes.append(cap_node)
        
        return FactGraph(nodes=nodes, edges=edges)
    
    def _extract_concepts_from_events(
        self, 
        events: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Extrait les concepts métier depuis les événements
        
        Exemple :
        - "Commande créée" → concept "Commande"
        - "Facture validée" → concept "Facture"
        - "Stock réservé" → concept "Stock"
        """
        concepts = {}
        
        # Mots-clés à ignorer (verbes d'action)
        stop_words = {
            "créée", "validée", "réservé", "envoyée", "reçue",
            "annulée", "mise", "à", "jour", "archivée", "supprimée",
            "créé", "validé", "envoyé", "reçu", "annulé", "archivé", "supprimé"
        }
        
        for event in events:
            label = event.get("label", event.get("name", ""))
            if not label:
                continue
            
            # Extraire le nom (généralement le premier mot significatif)
            words = label.split()
            for word in words:
                word_clean = word.lower().strip(",.!?")
                
                if word_clean not in stop_words and len(word_clean) > 3:
                    # C'est probablement un concept
                    concept_name = word.capitalize()
                    
                    if concept_name not in concepts:
                        concepts[concept_name] = {
                            "events": [],
                            "attributes": set()
                        }
                    
                    event_id = event.get("id", f"event_{len(concepts[concept_name]['events'])}")
                    if event_id not in concepts[concept_name]["events"]:
                        concepts[concept_name]["events"].append(event_id)
                    
                    # Extraire les attributs potentiels depuis les variantes/policies
                    if event.get("variant"):
                        attrs = self._extract_attributes(str(event["variant"]))
                        concepts[concept_name]["attributes"].update(attrs)
                    
                    if event.get("policy"):
                        attrs = self._extract_attributes(str(event["policy"]))
                        concepts[concept_name]["attributes"].update(attrs)
                    
                    break  # Prendre le premier mot significatif
        
        # Convert sets to lists
        for concept in concepts.values():
            concept["attributes"] = list(concept["attributes"])
        
        return concepts
    
    def _extract_attributes(self, text: str) -> set:
        """Extrait les attributs potentiels depuis un texte"""
        attributes = set()
        
        if not text:
            return attributes
        
        # Patterns courants : "montant > 1000", "statut = actif", etc.
        patterns = [
            r'\b(\w+)\s*[><=!]+\s*\w+',  # montant > 1000
            r'\b(\w+)\s+(?:est|equals|=)',  # statut est actif
            r'(?:si|when|if)\s+(\w+)',  # si montant
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                if len(match) > 3:  # Ignorer les mots trop courts
                    attributes.add(match)
        
        return attributes
    
    def _extract_concept_from_event(self, event: Dict) -> str | None:
        """Extrait le concept principal depuis un événement"""
        label = event.get("label", event.get("name", ""))
        if not label:
            return None
        
        words = label.split()
        
        stop_words = {"créée", "validée", "réservé", "envoyée", "créé", "validé", "envoyé"}
        
        for word in words:
            word_clean = word.lower().strip(",.!?")
            if word_clean not in stop_words and len(word_clean) > 3:
                return word.capitalize()
        
        return None
    
    def _extract_concept_from_rule(self, rule: str) -> str | None:
        """Extrait le concept principal depuis une règle"""
        if not rule:
            return None
        
        # Simple heuristique : chercher les noms propres ou mots capitalisés
        matches = re.findall(r'\b([A-Z][a-z]+)\b', rule)
        
        if matches:
            return matches[0]
        
        return None
    
    def _extract_concepts_from_capability(self, capability: Dict) -> List[str]:
        """Extrait les concepts liés à une capability"""
        # Basé sur les événements liés
        linked_events = capability.get("linked_events", [])
        # TODO: mapper événements → concepts
        return []

