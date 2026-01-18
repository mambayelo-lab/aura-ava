"""Point d'entrée FastAPI pour AURA AVA V3"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Charger les variables d'environnement depuis .env
load_dotenv()

from ava.api import interview, ontology, compilation, mapping, fact_resolution, ops_dashboard, llm_assist, decision_interview, transforming_interview, architect_workspace, conversational_interview
from ava.db.neo4j import neo4j_conn

app = FastAPI(
    title="AURA AVA V3",
    description="Architecture Vision Assistant - Decision Intelligence Platform",
    version="3.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(ontology.router, prefix="/api/ontology", tags=["Ontology"])
app.include_router(compilation.router, prefix="/api/compilation", tags=["Compilation"])
app.include_router(mapping.router, prefix="/api/mapping", tags=["Mapping"])
app.include_router(fact_resolution.router, tags=["Fact Resolution"])
app.include_router(ops_dashboard.router, tags=["Ops Dashboard"])
app.include_router(llm_assist.router, tags=["LLM Assistance"])
app.include_router(decision_interview.router, tags=["Decision Interview"])
app.include_router(transforming_interview.router, tags=["Transforming Interview"])
app.include_router(architect_workspace.router, tags=["Architect Workspace"])
app.include_router(conversational_interview.router, tags=["Conversational Interview"])

@app.get("/")
def root():
    return {"message": "AURA AVA V3 API", "status": "running"}

@app.get("/health")
def health():
    """Health check avec test Neo4j"""
    try:
        is_connected = neo4j_conn.test_connection()
        return {"status": "healthy", "neo4j": is_connected}
    except Exception as e:
        return {"status": "unhealthy", "neo4j": False, "error": str(e)}

@app.on_event("shutdown")
def shutdown():
    """Fermeture propre de la connexion Neo4j"""
    neo4j_conn.close()
