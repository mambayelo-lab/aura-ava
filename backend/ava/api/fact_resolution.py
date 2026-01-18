"""Routes API pour la résolution des faits"""
from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
from ..services.fact_resolver import FactResolver
from ..services.storage import read_compilation_result, read_inventory_graph, save_inventory_graph

router = APIRouter(prefix="/api/facts", tags=["Fact Resolution"])

@router.post("/resolve/{interview_id}")
async def resolve_facts(
    interview_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Résout les faits identifiés dans l'interview
    
    Payload:
    {
        "required_facts": ["montant commande", "statut client", ...]
    }
    
    Returns:
    {
        "matched": [...],
        "gaps": [...],
        "coverage": 0.85
    }
    """
    required_facts = payload.get("required_facts", [])
    
    if not required_facts:
        raise HTTPException(status_code=400, detail="required_facts is required")
    
    # Load Inventory
    inventory = read_inventory_graph()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Resolve
    resolver = FactResolver(inventory)
    matched, gaps = resolver.resolve_facts(required_facts)
    
    coverage = len(matched) / len(required_facts) if required_facts else 0
    
    return {
        "interview_id": interview_id,
        "matched": matched,
        "gaps": gaps,
        "coverage": round(coverage, 2),
        "total_required": len(required_facts)
    }

@router.post("/enrich")
async def enrich_inventory(payload: Dict[str, Any] = Body(...)):
    """
    Enrichit l'Inventory avec un nouveau fait
    
    Payload:
    {
        "fact_label": "nouveau fait",
        "source_info": {
            "system": "CRM Salesforce",
            "field": "account.status",
            "type": "manual"
        }
    }
    """
    fact_label = payload.get("fact_label")
    source_info = payload.get("source_info", {})
    
    if not fact_label:
        raise HTTPException(status_code=400, detail="fact_label is required")
    
    # Load Inventory
    inventory = read_inventory_graph()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Enrich
    resolver = FactResolver(inventory)
    new_node = resolver.enrich_inventory(fact_label, source_info)
    
    # Save updated Inventory
    save_inventory_graph(inventory)
    
    return {
        "status": "enriched",
        "node_id": new_node.id,
        "label": new_node.label
    }

@router.get("/inventory")
async def get_inventory():
    """Retourne l'Inventory complet (Fact Graph)"""
    inventory = read_inventory_graph()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    return inventory.to_dict()

