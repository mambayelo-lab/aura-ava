"""Modèle ontologique unique pour AURA AVA V3 - Phase 1: Decision-focused"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum

# === ENUMS ===
class InterviewType(str, Enum):
    DECISION = "decision"
    SYSTEM = "system"  # Phase 2
    TRANSFORMATION = "transformation"  # Phase 2

class ActorType(str, Enum):
    HUMAN = "human"
    SYSTEM = "system"
    EXTERNAL = "external"

class RuleType(str, Enum):
    IF_THEN = "if_then"
    WHILE = "while"

class SignalSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SignalContext(str, Enum):
    OPERATIONAL = "operational"
    DECISION = "decision"

class PainPointType(str, Enum):
    SLOW = "slow"
    ERROR = "error"
    MANUAL = "manual"
    RISKY = "risky"
    UNCLEAR = "unclear"

class FactSourceType(str, Enum):
    SYSTEM = "system"
    CALCULATION = "calculation"
    MANUAL = "manual"
    UNKNOWN = "unknown"

# === CORE MODELS (Phase 1: Decision-focused) ===

class Actor(BaseModel):
    id: str
    label: str
    type: ActorType
    role_description: Optional[str] = None

class Application(BaseModel):
    id: str
    name: str
    usage_description: Optional[str] = None

class DataObject(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

class Rule(BaseModel):
    id: str
    type: RuleType
    condition: str
    consequence: str

class Signal(BaseModel):
    id: str
    label: str
    description: str
    condition: str
    severity: SignalSeverity
    context: SignalContext
    related_activity_id: Optional[str] = None  # Phase 2
    related_decision_id: Optional[str] = None

class PainPoint(BaseModel):
    id: str
    type: PainPointType
    description: str
    impact: str
    criticality: Literal["low", "medium", "high"]

class Fact(BaseModel):
    id: str
    label: str
    source_type: FactSourceType
    source_activity_id: Optional[str] = None  # Phase 2
    source_application_id: Optional[str] = None
    description: Optional[str] = None

# === DECISION (Phase 1: Core) ===
class Decision(BaseModel):
    id: str
    label: str
    description: str
    required_facts: List[Fact] = []
    rules: List[Rule] = []
    signals: List[Signal] = []
    pain_points: List[PainPoint] = []

class DecisionBlocker(BaseModel):
    type: Literal["missing_data", "late_data", "unreliable_data", "manual", "unclear_rule"]
    description: str

# === PHASE 2: System/Transformation (COMMENTÉ POUR L'INSTANT) ===
# class Trigger(BaseModel):
#     type: Literal["human_action", "business_event", "time", "data_change"]
#     description: str

# class Result(BaseModel):
#     description: str
#     fact_candidate: Optional[Fact] = None

# class ApplicationUsage(BaseModel):
#     application_id: str
#     role_in_activity: str

# class ActivityRelation(BaseModel):
#     from_activity_id: str
#     to_activity_id: str
#     type: Literal["sequence", "dependency", "feedback"]
#     description: Optional[str] = None

# class Activity(BaseModel):
#     id: str
#     index: int
#     name: str
#     description: Optional[str] = None
#     actors: List[Actor] = []
#     trigger: Optional[Trigger] = None
#     rules: List[Rule] = []
#     result: Optional[Result] = None
#     applications: List[ApplicationUsage] = []
#     signals: List[Signal] = []
#     pain_points: List[PainPoint] = []
#     relations: List[ActivityRelation] = []
#     validation: dict = {"completed": False, "validated_by_user": False}

# class Process(BaseModel):
#     id: str
#     name: str
#     description: Optional[str] = None
#     activities: List[Activity] = []
#     relations: List[ActivityRelation] = []
#     validated: bool = False

# === INVENTORY ===
class InventorySnapshot(BaseModel):
    actors: List[Actor] = []
    applications: List[Application] = []
    data_objects: List[DataObject] = []
    signals: List[Signal] = []

# === INTERVIEW CONTEXT ===
class InterviewContext(BaseModel):
    objective: str
    motivation: Optional[str] = None
    constraints: List[str] = []
    decision_focus: Optional[str] = None
    editable_by_interviewee: bool = False
    interviewee_comments: Optional[str] = None

# === MAIN INTERVIEW (Phase 1: Decision-focused) ===
class Interview(BaseModel):
    id: str
    title: str
    type: InterviewType
    context: InterviewContext
    
    # Decision-centric (Phase 1: Core)
    decisions: List[Decision] = []
    
    # System/Transformation-centric (Phase 2: Commenté)
    # processes: List[Process] = []
    processes: List[dict] = []  # Placeholder vide pour Phase 2
    
    # Unified inventory
    inventory: InventorySnapshot = InventorySnapshot()
    
    # Validation
    validation: dict = Field(default_factory=lambda: {
        "completeness_score": 0,
        "validated_by_user": False,
        "submitted_at": None
    })
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

