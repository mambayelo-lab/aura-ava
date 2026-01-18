"""Modèles pour l'interview décisionnelle"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class InfoRequirement(BaseModel):
    """Information nécessaire pour la décision"""
    id: str
    label: str
    source: Literal["manuel", "erp", "crm", "excel", "api", "database"]

class BusinessRule(BaseModel):
    """Règle métier structurée"""
    id: str
    type: Literal["SI_ALORS", "TANT_QUE"]
    condition: str
    consequence: str

class AlertSignal(BaseModel):
    """Signal d'alerte"""
    id: str
    event: str
    action: str
    severity: Optional[Literal["HIGH", "MEDIUM", "LOW"]] = None

class DecisionInterview(BaseModel):
    """Interview décisionnelle complète"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    # Données collectées
    decision: str = ""
    context: str = ""
    infos: List[InfoRequirement] = Field(default_factory=list)
    rules: List[BusinessRule] = Field(default_factory=list)
    signals: List[AlertSignal] = Field(default_factory=list)
    risks: str = ""
    
    # Métadonnées
    status: Literal["draft", "completed", "submitted"] = "draft"
    submitted_at: Optional[datetime] = None

