"""Routes API pour la compilation AVA"""
from fastapi import APIRouter, HTTPException
from ..services.ava_compiler import AVACompiler
from ..services.storage import read_interview, write_compilation_result, read_compilation_result
from ..models.graphs import CompilationResult

router = APIRouter()

@router.post("/{interview_id}", response_model=CompilationResult)
async def compile_interview(interview_id: str) -> CompilationResult:
    """
    Compile une interview en graphes sémantiques
    
    POST /api/compilation/{interview_id}
    """
    # Load interview
    interview = read_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Compile
    compiler = AVACompiler()
    result = compiler.compile(interview)
    
    # Save
    write_compilation_result(interview_id, result)
    
    return result

@router.get("/{interview_id}", response_model=CompilationResult)
async def get_compilation_result(interview_id: str) -> CompilationResult:
    """
    Récupère le résultat de compilation
    
    GET /api/compilation/{interview_id}
    """
    result = read_compilation_result(interview_id)
    if not result:
        raise HTTPException(status_code=404, detail="Compilation result not found")
    
    return result

