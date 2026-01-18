"""Routes API pour le Dashboard Opérationnel"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from ..services.semantic_router import SemanticRouter
from ..services.deterministic_query import DeterministicQueryEngine
from ..services.llm_reformulator import LLMReformulator
from ..services.storage import read_compilation_result

router = APIRouter(prefix="/api/ops", tags=["Ops Dashboard"])

@router.post("/ask/{interview_id}")
async def ask_question(
    interview_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Pose une question sur une interview décisionnelle
    
    Payload:
    {
        "question": "Quel est le montant de la commande ?"
    }
    
    Returns:
    {
        "question": "...",
        "answer": "Le montant est de 1500€ selon SAP ERP",
        "type": "FACT_QUERY",
        "deterministic": true,
        "sources": [...]
    }
    """
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    
    # Load compilation
    compilation = read_compilation_result(interview_id)
    if not compilation:
        raise HTTPException(status_code=404, detail="Compilation not found")
    
    # 1. Route la question
    router_svc = SemanticRouter()
    question_type = router_svc.route(question)
    entities = router_svc.extract_entities(question)
    
    # 2. Execute déterministiquement
    query_engine = DeterministicQueryEngine(
        compilation.fact_graph,
        compilation.reasoning_graph
    )
    
    if question_type == "FACT_QUERY":
        result = query_engine.query_fact(
            entities.get("entity", ""),
            entities.get("object")
        )
        
        # 3. Reformuler
        reformulator = LLMReformulator()
        answer = reformulator.reformulate_fact_answer(question, result)
        
        return {
            "question": question,
            "answer": answer,
            "type": question_type,
            "deterministic": True,
            "raw_result": result
        }
    
    elif question_type == "RULE_CHECK":
        result = query_engine.evaluate_rule(entities.get("condition", ""))
        
        reformulator = LLMReformulator()
        answer = reformulator.reformulate_rule_answer(question, result)
        
        return {
            "question": question,
            "answer": answer,
            "type": question_type,
            "deterministic": True,
            "raw_result": result
        }
    
    elif question_type == "SIGNAL_ALERT":
        alerts = query_engine.check_signals()
        
        reformulator = LLMReformulator()
        answer = reformulator.reformulate_alerts(alerts)
        
        return {
            "question": question,
            "answer": answer,
            "type": question_type,
            "deterministic": True,
            "alerts": alerts
        }
    
    elif question_type == "DECISION_STATUS":
        # Pour MVP, retourner un statut simple
        reformulator = LLMReformulator()
        answer = reformulator.reformulate_decision_status({
            "status": "En cours d'analyse"
        })
        
        return {
            "question": question,
            "answer": answer,
            "type": question_type,
            "deterministic": True
        }
    
    else:
        return {
            "question": question,
            "answer": "Je n'ai pas compris votre question. Pouvez-vous reformuler ? (Ex: 'Quel est le montant ?', 'Y a-t-il des alertes ?', 'Est-ce autorisé ?')",
            "type": "UNKNOWN",
            "deterministic": False
        }

@router.get("/alerts/{interview_id}")
async def get_active_alerts(interview_id: str):
    """Récupère les alertes actives"""
    compilation = read_compilation_result(interview_id)
    if not compilation:
        raise HTTPException(status_code=404, detail="Compilation not found")
    
    query_engine = DeterministicQueryEngine(
        compilation.fact_graph,
        compilation.reasoning_graph
    )
    
    alerts = query_engine.check_signals()
    
    return {
        "interview_id": interview_id,
        "alerts": alerts,
        "count": len(alerts)
    }

@router.get("/stats/{interview_id}")
async def get_ops_stats(interview_id: str):
    """Statistiques pour le dashboard ops"""
    compilation = read_compilation_result(interview_id)
    if not compilation:
        raise HTTPException(status_code=404, detail="Compilation not found")
    
    facts_count = len([n for n in compilation.fact_graph.nodes if n.type.value == "fact"])
    rules_count = len([n for n in compilation.reasoning_graph.nodes if n.type.value == "rule"])
    
    query_engine = DeterministicQueryEngine(
        compilation.fact_graph,
        compilation.reasoning_graph
    )
    alerts = query_engine.check_signals()
    
    return {
        "interview_id": interview_id,
        "facts_count": facts_count,
        "rules_count": rules_count,
        "alerts_count": len(alerts)
    }

