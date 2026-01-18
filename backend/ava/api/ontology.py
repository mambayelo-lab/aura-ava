"""Routes API pour l'ontologie"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from ..services.ontology_builder import OntologyBuilder
from ..services.storage import save_ontology_graph, read_ontology_graph

router = APIRouter(prefix="/api/ontology", tags=["Ontology"])

@router.post("/build/{interview_id}")
async def build_ontology(
    interview_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Construit l'ontologie métier depuis une interview transforming
    
    Payload:
    {
        "events": [...],
        "policies": [...],
        "applications": [...],
        "capabilities": [...]
    }
    """
    events = payload.get("events", [])
    policies = payload.get("policies", [])
    applications = payload.get("applications", [])
    capabilities = payload.get("capabilities", [])
    
    if not events:
        raise HTTPException(status_code=400, detail="events is required")
    
    # Build ontology
    builder = OntologyBuilder()
    ontology_graph = builder.build_ontology(
        events=events,
        policies=policies,
        applications=applications,
        capabilities=capabilities
    )
    
    # Save
    save_ontology_graph(interview_id, ontology_graph)
    
    concepts = [n for n in ontology_graph.nodes if n.data.get("type") == "business_concept"]
    
    return {
        "interview_id": interview_id,
        "ontology": ontology_graph.to_dict(),
        "concepts_count": len(concepts),
        "stats": {
            "nodes": len(ontology_graph.nodes),
            "edges": len(ontology_graph.edges)
        }
    }

@router.get("/{interview_id}")
async def get_ontology(interview_id: str):
    """Récupère l'ontologie d'une interview"""
    ontology = read_ontology_graph(interview_id)
    if not ontology:
        raise HTTPException(status_code=404, detail="Ontology not found")
    
    return ontology.to_dict()

# Legacy routes (keep for backward compatibility)
@router.get("/")
def get_ontology_legacy():
    """Récupère l'ontologie complète (legacy)"""
    return {"message": "Ontology endpoint - Use /{interview_id} for specific ontology"}

@router.get("/nodes")
def get_nodes():
    """Récupère tous les nœuds de l'ontologie (legacy)"""
    return {"nodes": []}

@router.get("/relationships")
def get_relationships():
    """Récupère toutes les relations de l'ontologie (legacy)"""
    return {"relationships": []}
