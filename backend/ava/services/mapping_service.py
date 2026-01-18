import os
import json
from pathlib import Path
from typing import List, Dict, Any
from ..models.graphs import FactGraph, Node, NodeType

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MAPPINGS_DIR = Path(__file__).parent.parent / "data" / "mappings"
FACTS_DIR = Path(__file__).parent.parent / "data" / "facts"

# Create directories
MAPPINGS_DIR.mkdir(parents=True, exist_ok=True)
FACTS_DIR.mkdir(parents=True, exist_ok=True)
DATASETS_DIR.mkdir(parents=True, exist_ok=True)

class MappingService:
    """Service de mapping entre ontologie AVA et datasets"""
    
    def list_datasets(self) -> List[Dict[str, str]]:
        """Liste les datasets disponibles"""
        datasets = []
        
        if DATASETS_DIR.exists():
            for filepath in DATASETS_DIR.glob("*.json"):
                dataset_id = filepath.stem.replace("_sample", "")
                datasets.append({
                    "id": dataset_id,
                    "name": dataset_id.replace("_", " ").title(),
                    "filename": filepath.name
                })
        
        return datasets
    
    def load_dataset(self, dataset_id: str) -> List[Dict[str, Any]]:
        """Charge un dataset"""
        filepath = DATASETS_DIR / f"{dataset_id}.json"
        if not filepath.exists():
            filepath = DATASETS_DIR / f"{dataset_id}_sample.json"
        
        if not filepath.exists():
            return []
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def extract_ontology_attributes(self, fact_graph: FactGraph) -> List[str]:
        """Extrait les attributs de l'ontologie depuis le Fact Graph"""
        attributes = set()
        
        for node in fact_graph.nodes:
            if node.type == NodeType.FACT:
                # Extract attribute from fact label
                label = node.label.lower()
                # Simple extraction: consider each word as potential attribute
                words = label.replace(",", " ").replace(".", " ").split()
                attributes.update(words)
        
        return list(attributes)
    
    def calculate_confidence(
        self,
        field: str,
        ontology_attr: str,
        dataset_sample: Dict[str, Any]
    ) -> float:
        """Calcule la confiance d'un mapping (0.0 à 1.0)"""
        field_lower = field.lower()
        attr_lower = ontology_attr.lower()
        
        # Exact match
        if field_lower == attr_lower:
            return 0.95
        
        # Contains
        if attr_lower in field_lower or field_lower in attr_lower:
            return 0.80
        
        # Semantic matching (simplified)
        semantic_pairs = {
            "status": ["state", "statut", "etat"],
            "amount": ["montant", "total", "prix", "price"],
            "date": ["created", "updated", "timestamp"],
            "reference": ["ref", "id", "code"],
        }
        
        for key, synonyms in semantic_pairs.items():
            if key in attr_lower and any(s in field_lower for s in synonyms):
                return 0.70
        
        # Default low confidence
        return 0.30
    
    def generate_proposals(
        self,
        interview_id: str,
        fact_graph: FactGraph,
        dataset_id: str
    ) -> List[Dict[str, Any]]:
        """Génère des propositions de mapping"""
        dataset = self.load_dataset(dataset_id)
        if not dataset:
            return []
        
        # Extract fields from dataset
        sample = dataset[0] if dataset else {}
        fields = list(sample.keys())
        
        # Extract ontology attributes
        ontology_attrs = self.extract_ontology_attributes(fact_graph)
        
        # Generate proposals
        proposals = []
        for field in fields:
            for attr in ontology_attrs:
                confidence = self.calculate_confidence(field, attr, sample)
                
                if confidence >= 0.30:  # Only keep reasonable matches
                    proposals.append({
                        "field": field,
                        "ontology_attribute": attr,
                        "confidence": round(confidence, 2),
                        "sample_value": str(sample.get(field, ""))[:50],
                        "status": "pending"
                    })
        
        # Sort by confidence
        proposals.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Save proposals
        self._save_proposals(interview_id, dataset_id, proposals)
        
        return proposals
    
    def _save_proposals(self, interview_id: str, dataset_id: str, proposals: List[Dict]):
        """Sauvegarde les propositions"""
        filepath = MAPPINGS_DIR / f"{interview_id}_{dataset_id}_proposals.json"
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(proposals, f, ensure_ascii=False, indent=2)
    
    def _load_proposals(self, interview_id: str, dataset_id: str) -> List[Dict]:
        """Charge les propositions"""
        filepath = MAPPINGS_DIR / f"{interview_id}_{dataset_id}_proposals.json"
        if not filepath.exists():
            return []
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def get_proposals(
        self,
        interview_id: str,
        dataset_id: str = None
    ) -> List[Dict[str, Any]]:
        """Récupère les propositions avec leurs statuts"""
        if dataset_id:
            proposals = self._load_proposals(interview_id, dataset_id)
        else:
            # Load all proposals for interview
            all_proposals = []
            for filepath in MAPPINGS_DIR.glob(f"{interview_id}_*_proposals.json"):
                with open(filepath, 'r', encoding='utf-8') as f:
                    all_proposals.extend(json.load(f))
            proposals = all_proposals
        
        # Load decisions and update status
        if dataset_id:
            decisions_file = MAPPINGS_DIR / f"{interview_id}_{dataset_id}_decisions.json"
            if decisions_file.exists():
                with open(decisions_file, 'r', encoding='utf-8') as f:
                    decisions = json.load(f)
                
                # Update proposal status
                for proposal in proposals:
                    key = f"{proposal['field']}:{proposal['ontology_attribute']}"
                    if key in decisions:
                        proposal['status'] = decisions[key]
        
        return proposals
    
    def record_decision(
        self,
        interview_id: str,
        dataset_id: str,
        field: str,
        ontology_attribute: str,
        decision: str
    ):
        """Enregistre une décision"""
        decisions_file = MAPPINGS_DIR / f"{interview_id}_{dataset_id}_decisions.json"
        
        # Load existing decisions
        decisions = {}
        if decisions_file.exists():
            with open(decisions_file, 'r', encoding='utf-8') as f:
                decisions = json.load(f)
        
        # Record decision
        key = f"{field}:{ontology_attribute}"
        decisions[key] = decision
        
        # Save
        with open(decisions_file, 'w', encoding='utf-8') as f:
            json.dump(decisions, f, ensure_ascii=False, indent=2)
    
    def build_facts(
        self,
        interview_id: str,
        dataset_id: str
    ) -> List[Dict[str, Any]]:
        """Construit les facts depuis les mappings acceptés"""
        dataset = self.load_dataset(dataset_id)
        if not dataset:
            return []
        
        # Load decisions
        decisions_file = MAPPINGS_DIR / f"{interview_id}_{dataset_id}_decisions.json"
        if not decisions_file.exists():
            return []
        
        with open(decisions_file, 'r', encoding='utf-8') as f:
            decisions = json.load(f)
        
        # Build facts from accepted mappings
        facts = []
        for record in dataset:
            for key, decision in decisions.items():
                if decision == "accept":
                    field, ontology_attr = key.split(":", 1)
                    if field in record:
                        facts.append({
                            "interview_id": interview_id,
                            "dataset_id": dataset_id,
                            "field": field,
                            "ontology_attribute": ontology_attr,
                            "value": record[field],
                            "record_id": record.get("id", "unknown")
                        })
        
        # Save facts
        facts_file = FACTS_DIR / f"{interview_id}_{dataset_id}_facts.json"
        with open(facts_file, 'w', encoding='utf-8') as f:
            json.dump(facts, f, ensure_ascii=False, indent=2)
        
        return facts
    
    def get_facts(
        self,
        interview_id: str,
        dataset_id: str = None
    ) -> List[Dict[str, Any]]:
        """Récupère les facts"""
        if dataset_id:
            facts_file = FACTS_DIR / f"{interview_id}_{dataset_id}_facts.json"
            if not facts_file.exists():
                return []
            
            with open(facts_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Load all facts
        all_facts = []
        for filepath in FACTS_DIR.glob(f"{interview_id}_*_facts.json"):
            with open(filepath, 'r', encoding='utf-8') as f:
                all_facts.extend(json.load(f))
        
        return all_facts
    
    def get_stats(self, interview_id: str) -> Dict[str, Any]:
        """Statistiques de mapping"""
        proposals = self.get_proposals(interview_id)
        facts = self.get_facts(interview_id)
        
        # Count decisions
        accepted = 0
        rejected = 0
        pending = 0
        
        for filepath in MAPPINGS_DIR.glob(f"{interview_id}_*_decisions.json"):
            with open(filepath, 'r', encoding='utf-8') as f:
                decisions = json.load(f)
                accepted += sum(1 for d in decisions.values() if d == "accept")
                rejected += sum(1 for d in decisions.values() if d == "reject")
        
        pending = len(proposals) - accepted - rejected
        
        return {
            "total_proposals": len(proposals),
            "accepted": accepted,
            "rejected": rejected,
            "pending": pending,
            "facts_count": len(facts),
            "coverage": round(accepted / len(proposals) * 100, 1) if proposals else 0
        }

