"""Module de stockage JSON pour Aura v0"""
import json
import os
from typing import Any, Dict, List
from pathlib import Path

# Dossier de stockage
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)


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

