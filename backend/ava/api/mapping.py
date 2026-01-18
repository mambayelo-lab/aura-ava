"""Routes API pour le mapping assistant"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any
from ..services.mapping_service import MappingService
from ..services.storage import (
    read_compilation_result,
    read_ontology_graph,
    read_inventory_graph
)
from ..services.fact_resolver import FactResolver

router = APIRouter(prefix="/api/mapping", tags=["Mapping"])

mapping_service = MappingService()

@router.get("/datasets")
async def list_datasets():
    """Liste les datasets disponibles"""
    return mapping_service.list_datasets()

@router.post("/propose/{interview_id}")
async def propose_mappings(
    interview_id: str,
    dataset_id: str = Query(..., description="ID du dataset")
):
    """
    Génère des propositions de mapping pour un dataset
    
    Analyse l'ontologie AVA (depuis le Fact Graph) et propose
    des mappings vers les champs du dataset
    """
    # Load compilation result
    result = read_compilation_result(interview_id)
    if not result:
        raise HTTPException(status_code=404, detail="Compilation result not found")
    
    # Generate proposals
    proposals = mapping_service.generate_proposals(
        interview_id=interview_id,
        fact_graph=result.fact_graph,
        dataset_id=dataset_id
    )
    
    return {
        "interview_id": interview_id,
        "dataset_id": dataset_id,
        "proposals": proposals,
        "count": len(proposals)
    }

@router.get("/proposals/{interview_id}")
async def get_proposals(
    interview_id: str,
    dataset_id: str = Query(None, description="Filter by dataset")
):
    """Récupère les propositions de mapping"""
    proposals = mapping_service.get_proposals(interview_id, dataset_id)
    return proposals

@router.post("/decide")
async def decide_mapping(payload: Dict[str, Any] = Body(...)):
    """
    Enregistre la décision de l'architecte sur un mapping
    
    Payload:
    {
        "interview_id": "...",
        "dataset_id": "...",
        "field": "...",
        "ontology_attribute": "...",
        "decision": "accept" | "reject"
    }
    """
    interview_id = payload.get("interview_id")
    dataset_id = payload.get("dataset_id")
    field = payload.get("field")
    ontology_attribute = payload.get("ontology_attribute")
    decision = payload.get("decision")
    
    if not all([interview_id, dataset_id, field, ontology_attribute, decision]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    if decision not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="decision must be 'accept' or 'reject'")
    
    # Record decision
    mapping_service.record_decision(
        interview_id=interview_id,
        dataset_id=dataset_id,
        field=field,
        ontology_attribute=ontology_attribute,
        decision=decision
    )
    
    return {
        "status": "recorded",
        "decision": decision
    }

@router.post("/facts/build/{interview_id}")
async def build_facts(
    interview_id: str,
    dataset_id: str = Query(..., description="ID du dataset")
):
    """
    Construit les facts instanciés à partir des mappings acceptés
    
    Lit les données réelles du dataset et crée des instances
    de facts basées sur les mappings validés
    """
    facts = mapping_service.build_facts(interview_id, dataset_id)
    
    return {
        "interview_id": interview_id,
        "dataset_id": dataset_id,
        "facts_count": len(facts),
        "facts": facts
    }

@router.get("/facts/{interview_id}")
async def get_facts(
    interview_id: str,
    dataset_id: str = Query(None, description="Filter by dataset")
):
    """Récupère les facts instanciés"""
    facts = mapping_service.get_facts(interview_id, dataset_id)
    return facts

@router.get("/stats/{interview_id}")
async def get_mapping_stats(interview_id: str):
    """Statistiques de mapping"""
    stats = mapping_service.get_stats(interview_id)
    return stats

@router.post("/resolve/{interview_id}")
async def resolve_mapping(
    interview_id: str,
    mode: str = Query(..., description="'decision' or 'transforming'")
):
    """
    Route unifiée de mapping pour les 2 modes
    
    - Mode decision : Faits requis → Inventory
    - Mode transforming : Ontologie métier → Inventory
    """
    if mode == "decision":
        # Charger les faits depuis la compilation
        compilation = read_compilation_result(interview_id)
        if not compilation:
            raise HTTPException(status_code=404, detail="Compilation not found")
        
        required_facts = [
            node.label for node in compilation.fact_graph.nodes
            if node.type.value == "fact"
        ]
    
    elif mode == "transforming":
        # Charger les concepts depuis l'ontologie
        ontology = read_ontology_graph(interview_id)
        if not ontology:
            raise HTTPException(status_code=404, detail="Ontology not found")
        
        required_facts = [
            node.label for node in ontology.nodes
            if node.data.get("type") == "business_concept"
        ]
    
    else:
        raise HTTPException(status_code=400, detail="mode must be 'decision' or 'transforming'")
    
    # Résoudre via l'Inventory
    inventory = read_inventory_graph()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    resolver = FactResolver(inventory)
    matched, gaps = resolver.resolve_facts(required_facts)
    
    coverage = len(matched) / len(required_facts) if required_facts else 0
    
    return {
        "interview_id": interview_id,
        "mode": mode,
        "matched": matched,
        "gaps": gaps,
        "coverage": round(coverage, 2),
        "total_required": len(required_facts)
    }

@router.post("/dataset-mapping/{interview_id}")
async def map_to_dataset(
    interview_id: str,
    dataset_id: str = Query(...),
    mode: str = Query(...)
):
    """
    Mapper une interview vers un dataset spécifique
    
    Réutilise la logique legacy de proposition de mappings
    """
    from difflib import SequenceMatcher
    
    # Charger les concepts/faits selon le mode
    if mode == "decision":
        compilation = read_compilation_result(interview_id)
        if not compilation:
            raise HTTPException(status_code=404, detail="Compilation not found")
        ontology_attrs = [n.label for n in compilation.fact_graph.nodes if n.type.value == "fact"]
    else:
        ontology = read_ontology_graph(interview_id)
        if not ontology:
            raise HTTPException(status_code=404, detail="Ontology not found")
        ontology_attrs = [n.label for n in ontology.nodes if n.data.get("type") == "business_concept"]
    
    # Charger le dataset
    dataset = mapping_service.load_dataset(dataset_id)
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Extraire les champs du dataset
    sample = dataset[0] if dataset else {}
    fields = list(sample.keys())
    
    # Générer propositions (simple matching pour MVP)
    proposals = []
    for field in fields:
        for attr in ontology_attrs:
            # Simple matching par similarité de mots
            confidence = SequenceMatcher(None, field.lower(), attr.lower()).ratio()
            
            if confidence >= 0.3:
                proposals.append({
                    "field": field,
                    "ontology_attribute": attr,
                    "confidence": round(confidence, 2),
                    "sample_value": str(sample.get(field, ""))[:50] if sample else "",
                    "source_name": dataset_id
                })
    
    # Trier par confiance
    proposals.sort(key=lambda x: x["confidence"], reverse=True)
    
    return {
        "interview_id": interview_id,
        "dataset_id": dataset_id,
        "mode": mode,
        "proposals": proposals,
        "count": len(proposals)
    }

# Legacy routes (keep for backward compatibility)
@router.get("/{interview_id}")
async def get_mappings(interview_id: str) -> Dict[str, Any]:
    """
    Récupère les mappings d'une interview (legacy)
    
    GET /api/mapping/{interview_id}
    """
    from pathlib import Path
    import json
    
    MAPPINGS_DIR = Path(__file__).parent.parent / "data" / "mappings"
    mapping_file = MAPPINGS_DIR / f"{interview_id}.json"
    
    if not mapping_file.exists():
        return {"mappings": {}}
    
    try:
        with open(mapping_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"mappings": {}}

@router.post("/{interview_id}")
async def save_mappings(interview_id: str, mappings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sauvegarde les mappings d'une interview (legacy)
    
    POST /api/mapping/{interview_id}
    Body: {"mappings": {"fact_id": "data_object_id", ...}}
    """
    from pathlib import Path
    import json
    from datetime import datetime
    
    MAPPINGS_DIR = Path(__file__).parent.parent / "data" / "mappings"
    MAPPINGS_DIR.mkdir(parents=True, exist_ok=True)
    mapping_file = MAPPINGS_DIR / f"{interview_id}.json"
    
    try:
        data = {
            "interview_id": interview_id,
            "mappings": mappings.get("mappings", {}),
            "updated_at": datetime.now().isoformat()
        }
        
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return {"status": "saved", "mappings": data["mappings"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving mappings: {str(e)}")
