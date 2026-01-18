"""Routes API pour le workspace architecte"""
from fastapi import APIRouter, HTTPException
from ..services.transforming_storage import read_transforming_interview, save_transforming_interview
from ..services.ontology_compiler import OntologyCompiler
from ..services.architecture_generator import ArchitectureGenerator
from ..services.domain_detector import DomainDetector

router = APIRouter(prefix="/api/architect", tags=["Architect Workspace"])

@router.post("/compile/{interview_id}")
async def compile_ontology(interview_id: str):
    """Compile interview en ontologie"""
    interview = read_transforming_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    if interview.status != "submitted":
        raise HTTPException(400, "Interview must be submitted first")
    
    compiler = OntologyCompiler()
    compilation = compiler.compile(interview)
    
    return compilation

@router.post("/detect-domains/{interview_id}")
async def detect_domains(interview_id: str):
    """Détecte domaines métier"""
    interview = read_transforming_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    detector = DomainDetector()
    domains = detector.detect_domains(interview.activities)
    
    # Sauvegarder
    interview.domains = domains
    save_transforming_interview(interview)
    
    return {
        "domains": [d.model_dump() for d in domains],
        "count": len(domains)
    }

@router.post("/generate-architecture/{interview_id}")
async def generate_architecture(interview_id: str):
    """Génère schémas d'architecture"""
    interview = read_transforming_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Compiler
    compiler = OntologyCompiler()
    compilation = compiler.compile(interview)
    
    # Générer schémas
    generator = ArchitectureGenerator()
    
    return {
        "capability_map": generator.generate_capability_map(compilation),
        "activity_flow": generator.generate_activity_flow(compilation),
        "actor_matrix": generator.generate_actor_matrix(compilation),
        "decomposition_tree": generator.generate_decomposition_tree(compilation),
        "compilation": compilation
    }

