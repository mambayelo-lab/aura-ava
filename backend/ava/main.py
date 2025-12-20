from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid

app = FastAPI(title="AVA v0 - 7Q Compiler", version="0.1.0")

# ---------- Models ----------
class InterviewState(BaseModel):
    actor: Optional[str] = None
    system: Optional[str] = None
    command: Optional[str] = None
    event: Optional[str] = None
    reaction: Optional[str] = None
    visibility: Optional[str] = None
    dependency: Optional[str] = None

class CompileResponse(BaseModel):
    ok: bool
    missing_step: Optional[str] = None
    compiled: Dict[str, Any] = Field(default_factory=dict)
    hints: List[str] = Field(default_factory=list)


# ---------- Helpers ----------
QUESTIONS_ORDER = ["actor", "system", "command", "event", "reaction", "visibility", "dependency"]

EXAMPLES = {
    "actor": "ex : Gestionnaire commandes",
    "system": "ex : ERP SAP / CRM Salesforce / WMS Manhattan",
    "command": "ex : Créer commande",
    "event": "ex : Commande créée",
    "reaction": "ex : Allocation stock",
    "visibility": "ex : Logistique – temps réel",
    "dependency": "ex : Livraison dépend de commande créée",
}

def next_missing_step(state: InterviewState) -> Optional[str]:
    for step in QUESTIONS_ORDER:
        if getattr(state, step) in (None, ""):
            return step
    return None

def validate(state: InterviewState) -> List[str]:
    hints = []
    # Minimal validations (beginner-friendly)
    if state.command and " " not in state.command.strip():
        hints.append("Commande: utilise un verbe + objet (ex: 'Créer commande').")
    if state.event and " " not in state.event.strip():
        hints.append("Événement: décris un fait observable (ex: 'Commande créée').")
    return hints

def compile_state(state: InterviewState) -> Dict[str, Any]:
    # Compiled AST-like structure (ABP-ready)
    def node(t: str, value: Optional[str], step: str) -> Dict[str, Any]:
        return {"id": f"{t.lower()}_{uuid.uuid4().hex[:8]}", "type": t, "label": value or "", "step": step}

    compiled = {
        "actor": node("Actor", state.actor, "actor"),
        "system": node("System", state.system, "system"),
        "command": node("Command", state.command, "command"),
        "event": node("Event", state.event, "event"),
        "reaction": node("Reaction", state.reaction, "reaction"),
        "visibility": node("Visibility", state.visibility, "visibility"),
        "dependency": node("Dependency", state.dependency, "dependency"),
        "capabilities": [],         # v0: empty; will be inferred later
        "signal_candidates": [],    # v0: empty; will be inferred later
    }
    return compiled


# ---------- Routes ----------
@app.get("/examples")
def get_examples() -> Dict[str, str]:
    return EXAMPLES

@app.post("/compile", response_model=CompileResponse)
def compile_endpoint(state: InterviewState):
    missing = next_missing_step(state)
    hints = validate(state)

    compiled = compile_state(state)  # even partial, for live right-pane rendering
    return CompileResponse(
        ok=(missing is None and len(hints) == 0),
        missing_step=missing,
        compiled=compiled,
        hints=hints,
    )
