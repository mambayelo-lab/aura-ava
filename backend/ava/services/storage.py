"""Module de stockage JSON pour Aura AVA V3"""
import json
import os
from typing import Any, Dict, List, Optional
from pathlib import Path
from ..models.graphs import CompilationResult, FactGraph
from ..models.ontology import Interview

# Dossier de stockage
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

COMPILATIONS_DIR = DATA_DIR / "compilations"
COMPILATIONS_DIR.mkdir(exist_ok=True)


def read_json(filename: str, default: Any = None) -> Any:
    """Lit un fichier JSON, retourne default si le fichier n'existe pas"""
    filepath = DATA_DIR / filename
    if not filepath.exists():
        return default if default is not None else []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default if default is not None else []


def write_json(filename: str, data: Any) -> None:
    """Écrit un fichier JSON de manière atomique (temp + rename)"""
    filepath = DATA_DIR / filename
    temp_filepath = DATA_DIR / f"{filename}.tmp"
    
    try:
        # Écrire dans un fichier temporaire
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Renommer atomiquement
        if filepath.exists():
            filepath.unlink()
        temp_filepath.rename(filepath)
    except Exception as e:
        # Nettoyer le fichier temporaire en cas d'erreur
        if temp_filepath.exists():
            temp_filepath.unlink()
        raise e


def read_interview(interview_id: str) -> Optional[Interview]:
    """Charge une interview depuis le stockage"""
    interviews = read_json("interviews.json", [])
    for interview_data in interviews:
        if interview_data.get("id") == interview_id:
            return Interview(**interview_data)
    return None


def write_compilation_result(interview_id: str, result: CompilationResult) -> None:
    """Sauvegarde le résultat de compilation"""
    filepath = COMPILATIONS_DIR / f"{interview_id}.json"
    temp_filepath = COMPILATIONS_DIR / f"{interview_id}.json.tmp"
    
    try:
        # Écrire dans un fichier temporaire
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            json.dump(result.model_dump(), f, indent=2, ensure_ascii=False)
        
        # Renommer atomiquement
        if filepath.exists():
            filepath.unlink()
        temp_filepath.rename(filepath)
    except Exception as e:
        # Nettoyer le fichier temporaire en cas d'erreur
        if temp_filepath.exists():
            temp_filepath.unlink()
        raise e


def read_compilation_result(interview_id: str) -> Optional[CompilationResult]:
    """Charge le résultat de compilation"""
    filepath = COMPILATIONS_DIR / f"{interview_id}.json"
    if not filepath.exists():
        return None
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return CompilationResult(**data)
    except Exception:
        return None


INVENTORY_FILE = DATA_DIR / "inventory.json"

def read_inventory_graph() -> Optional[FactGraph]:
    """Charge le Fact Graph de l'Inventory"""
    if not INVENTORY_FILE.exists():
        # Créer un Inventory vide par défaut
        return FactGraph(nodes=[], edges=[])
    
    try:
        with open(INVENTORY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return FactGraph(**data)
    except Exception:
        return FactGraph(nodes=[], edges=[])

def save_inventory_graph(inventory: FactGraph):
    """Sauvegarde le Fact Graph de l'Inventory"""
    INVENTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    temp_filepath = INVENTORY_FILE.with_suffix('.json.tmp')
    
    try:
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            json.dump(inventory.to_dict(), f, indent=2, ensure_ascii=False)
        
        if INVENTORY_FILE.exists():
            INVENTORY_FILE.unlink()
        temp_filepath.rename(INVENTORY_FILE)
    except Exception as e:
        if temp_filepath.exists():
            temp_filepath.unlink()
        raise e


ONTOLOGY_DIR = DATA_DIR / "ontologies"
ONTOLOGY_DIR.mkdir(exist_ok=True)

def read_ontology_graph(interview_id: str) -> Optional[FactGraph]:
    """Charge l'ontologie d'une interview"""
    filepath = ONTOLOGY_DIR / f"{interview_id}.json"
    if not filepath.exists():
        return None
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return FactGraph(**data)
    except Exception:
        return None

def save_ontology_graph(interview_id: str, ontology: FactGraph):
    """Sauvegarde l'ontologie d'une interview"""
    ONTOLOGY_DIR.mkdir(parents=True, exist_ok=True)
    filepath = ONTOLOGY_DIR / f"{interview_id}.json"
    temp_filepath = ONTOLOGY_DIR / f"{interview_id}.json.tmp"
    
    try:
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            json.dump(ontology.to_dict(), f, indent=2, ensure_ascii=False)
        
        if filepath.exists():
            filepath.unlink()
        temp_filepath.rename(filepath)
    except Exception as e:
        if temp_filepath.exists():
            temp_filepath.unlink()
        raise e
