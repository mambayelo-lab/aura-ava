"""Modèles pour l'interview Vibe Transforming"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class Activity(BaseModel):
    """
    Activité métier (récursive)
    Une activité peut avoir des sous-activités
    """
    id: str
    label: str  # Ex: "Traiter une commande"
    description: Optional[str] = None
    
    # Récursivité
    parent_id: Optional[str] = None
    children_ids: List[str] = Field(default_factory=list)
    level: int = 1  # 1 = macro, 2+ = décomposition
    
    # Contexte
    who: List[str] = Field(default_factory=list)  # Qui fait ?
    tools: List[str] = Field(default_factory=list)  # Avec quoi ?
    inputs: Optional[str] = None  # Besoin de quoi ?
    outputs: Optional[str] = None  # Produit quoi ?
    
    # Métadonnées
    order: int = 0
    duration_estimate: Optional[str] = None
    frequency: Optional[str] = None

class ActivityFlow(BaseModel):
    """Lien entre activités"""
    id: str
    source_activity_id: str
    target_activity_id: str
    type: Literal["PUIS", "EN_PARALLELE", "SI_ALORS", "BOUCLE"]
    condition: Optional[str] = None

class Actor(BaseModel):
    """Personne ou système"""
    id: str
    name: str
    type: Literal["personne", "equipe", "systeme"]
    role: Optional[str] = None
    activities: List[str] = Field(default_factory=list)

class PainPoint(BaseModel):
    """Point de douleur"""
    id: str
    description: str
    related_activities: List[str] = Field(default_factory=list)
    impact: Literal["temps_perdu", "erreurs", "frustration", "cout", "risque"]
    severity: Literal["HIGH", "MEDIUM", "LOW"] = "MEDIUM"

class BusinessDomain(BaseModel):
    """Domaine métier détecté"""
    id: str
    name: str
    activities: List[str] = Field(default_factory=list)
    description: Optional[str] = None

class TransformingInterview(BaseModel):
    """Interview complète"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    # Données
    perimeter: str = ""
    objective: str = ""
    activities: List[Activity] = Field(default_factory=list)
    flows: List[ActivityFlow] = Field(default_factory=list)
    actors: List[Actor] = Field(default_factory=list)
    pain_points: List[PainPoint] = Field(default_factory=list)
    domains: List[BusinessDomain] = Field(default_factory=list)
    
    # Métadonnées
    status: Literal["draft", "completed", "submitted"] = "draft"
    submitted_at: Optional[datetime] = None

