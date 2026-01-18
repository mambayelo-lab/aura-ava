from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class BusinessObject(BaseModel):
    """Objet métier capturé lors de l'interview"""
    id: str
    name: str  # Ex: "Commande", "Facture", "Stock"
    attributes: List[str] = Field(default_factory=list)  # Ex: ["montant", "date", "client"]
    created_by_activity: Optional[str] = None  # ID activité créatrice
    used_by_activities: List[str] = Field(default_factory=list)  # IDs activités utilisatrices
    source_system: Optional[str] = None  # Ex: "CRM", "ERP", "Excel"

class Activity(BaseModel):
    """Activité métier capturée"""
    id: str
    label: str  # Ex: "Recevoir commande client"
    description: Optional[str] = None
    validated: bool = False
    
    # Déclencheur (Trigger)
    trigger_event: Optional[str] = None  # Ex: "Email client"
    trigger_actor: Optional[str] = None  # Ex: "Client"
    trigger_actor_type: Optional[Literal["personne", "equipe", "systeme"]] = None
    trigger_system: Optional[str] = None  # Ex: "Messagerie"
    
    # Sortie (Output)
    output_object: Optional[str] = None  # ID BusinessObject produit
    output_system: Optional[str] = None  # Système stockant l'output
    
    # Acteur réalisateur
    performed_by: Optional[str] = None  # ID Actor
    performed_by_type: Optional[Literal["personne", "equipe", "systeme"]] = None
    
    # Relations séquentielles
    next_activity_id: Optional[str] = None
    
    # Hiérarchie (pour décomposition)
    parent_activity_id: Optional[str] = None
    sub_activities: List[str] = Field(default_factory=list)
    level: int = 1

class Actor(BaseModel):
    """Acteur (personne, équipe ou système)"""
    id: str
    name: str  # Ex: "Conseiller commercial", "Système ERP"
    type: Literal["personne", "equipe", "systeme"]
    role: Optional[str] = None  # Ex: "Traite les demandes clients"
    activities: List[str] = Field(default_factory=list)  # IDs activités réalisées

class BusinessRule(BaseModel):
    """Règle métier"""
    id: str
    condition: str  # Ex: "montant > 5000€"
    action: str  # Ex: "validation manager requise"
    type: Literal["SI_ALORS", "TANT_QUE"] = "SI_ALORS"
    applies_to_activity: Optional[str] = None  # ID activité concernée
    applies_to_object: Optional[str] = None  # ID objet métier concerné

class Signal(BaseModel):
    """Signal d'alerte / événement à surveiller"""
    id: str
    event: str  # Ex: "Budget dépassé de 10%"
    action: str  # Ex: "Alerter manager financier"
    severity: Literal["HIGH", "MEDIUM", "LOW"] = "MEDIUM"
    threshold: Optional[str] = None  # Ex: "10%", "5000€"
    applies_to_activity: Optional[str] = None

class PainPoint(BaseModel):
    """Point de friction / difficulté"""
    id: str
    description: str  # Ex: "Emails perdus dans les spams"
    impact: Literal["temps_perdu", "erreurs", "frustration", "cout", "risque"]
    severity: Literal["HIGH", "MEDIUM", "LOW"] = "MEDIUM"
    related_activity: Optional[str] = None

class ConversationalInterview(BaseModel):
    """Interview conversationnelle complète"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    # Contexte général
    perimeter: str = ""  # Ex: "Notre processus de vente B2B"
    objective: str = ""  # Ex: "Réduire le temps de traitement de 5j à 2j"
    mode: Literal["transformation", "decision"] = "transformation"
    
    # Données capturées
    activities: List[Activity] = Field(default_factory=list)
    business_objects: List[BusinessObject] = Field(default_factory=list)
    actors: List[Actor] = Field(default_factory=list)
    rules: List[BusinessRule] = Field(default_factory=list)
    signals: List[Signal] = Field(default_factory=list)
    pain_points: List[PainPoint] = Field(default_factory=list)
    
    # État de l'interview
    current_phase: Literal["discovery", "deep_dive", "consolidation", "completed"] = "discovery"
    current_activity_index: int = 0
    current_question_index: int = 0
    
    # Historique conversation
    messages: List[dict] = Field(default_factory=list)  # {role: str, content: str, timestamp: str}
    
    # Métadonnées
    status: Literal["draft", "completed", "submitted"] = "draft"
    submitted_at: Optional[datetime] = None
    notes_to_architects: str = ""  # Notes libres à transmettre aux architectes

