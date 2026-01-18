# ANALYSE BACKEND AURA-AVA-V3

## Vue d'ensemble
Backend FastAPI avec 5 fichiers Python principaux. Analyse selon critères de "sanité" pour migration V3.

---

## FICHIER : storage.py
**Statut** : ✅ **SAIN**
**Raison** : 
- Code propre et déterministe
- Fonctions utilitaires simples et bien isolées
- Écriture atomique (temp + rename) pour éviter corruption
- Gestion d'erreurs correcte
- Pas de dépendances complexes

**Classes/Fonctions clés** :
- `read_json(filename, default)` : Lecture JSON avec fallback
- `write_json(filename, data)` : Écriture atomique

**Dépendances** :
- `json`, `os`, `pathlib` (stdlib)
- Aucune dépendance externe

**À migrer vers** : `backend/services/storage.py` ou `backend/core/storage.py`
**Actions** : ✅ **COPIER TEL QUEL** (peut-être ajouter type hints plus stricts)

---

## FICHIER : capability_inference.py
**Statut** : ❌ **SUPPRIMER DÉFINITIVEMENT**
**Raison** :
- ⚠️ **VA À L'ENCONTRE DU PRINCIPE DÉTERMINISTE DE LA V3**
- Code d'inférence heuristique (patterns regex, mappings de mots-clés)
- Inférence automatique depuis événements/policies/applications
- Dans la V3, les capabilities doivent venir directement de l'interview déterministe, pas être inférées
- L'utilisateur fournit les capabilities dans l'état d'interview, pas besoin d'inférence

**Classes/Fonctions clés** :
- `normalize_text(text)` : Normalisation de texte
- `extract_verb_from_event(event_label)` : Extraction verbe depuis événement
- `extract_object_from_event(event_label)` : Extraction objet métier
- `infer_capability_from_event(event)` : Inférence depuis événement
- `infer_capability_from_policy(policy, event)` : Inférence depuis règle métier
- `infer_capability_from_application(application, events)` : Inférence depuis application
- `merge_capabilities(capabilities)` : Fusion des capabilities similaires
- `infer_capabilities_from_events(events, policies, applications)` : Fonction principale

**Dépendances** :
- `typing`, `re`, `uuid` (stdlib)
- Aucune dépendance externe

**Utilisé dans** :
- `main.py` ligne 11 : `from .capability_inference import infer_capabilities_from_events`
- `main.py` ligne 936-965 : Endpoint `/api/infer-capabilities`

**Actions** : ❌ **SUPPRIMER** :
1. Supprimer le fichier `capability_inference.py`
2. Supprimer l'import dans `main.py` (ligne 11)
3. Supprimer l'endpoint `/api/infer-capabilities` dans `main.py` (lignes 936-965)
4. Les capabilities doivent venir directement de `interview_state.capabilities` (fourni par le frontend)

---

## FICHIER : architecture.py
**Statut** : ⚠️ **INCERTAIN** (partiellement sain)
**Raison** :
- ✅ Fonctions de génération Mermaid : SAINES (déterministes, robustes avec fallbacks)
- ✅ `normalize_text`, `sanitize_mermaid_id` : SAINES
- ⚠️ `infer_capability_l3` : Heuristique simple mais fonctionnelle
- ⚠️ `group_capabilities_l2_l1` : Logique très simpliste, extraction business_object fragile
- ⚠️ `generate_architecture_package` : Import circulaire avec `main.py` (ligne 388)
- ⚠️ Utilise `hash()` pour générer IDs (lignes 59, 79, 124, 426) - non-déterministe entre runs Python
- ✅ `generate_architecture_from_events` : SAINE (nouveau format déterministe)

**Classes/Fonctions clés** :
- `normalize_text(text)` : Normalisation
- `sanitize_mermaid_id(text)` : Nettoyage pour Mermaid
- `infer_capability_l3(process_state)` : Inférence L3 (ancien format)
- `group_capabilities_l2_l1(capabilities_l3)` : Groupement hiérarchique (fragile)
- `build_functional_static_mermaid(...)` : Diagramme fonctionnel statique
- `build_functional_dynamic_mermaid(...)` : Diagramme séquence
- `build_integration_mermaid(...)` : Diagramme d'intégration
- `generate_architecture_from_events(...)` : Génération depuis événements (nouveau format)
- `generate_architecture_package(...)` : Génération package complet

**Dépendances** :
- `typing`, `re` (stdlib)
- `.storage` (read_json, write_json)
- `.main` (PROCESSES, load_initiatives) - ⚠️ **IMPORT CIRCULAIRE**

**À migrer vers** : `backend/services/architecture.py`
**Actions** : ⚠️ **REFACTORER** :
1. Remplacer `hash()` par `uuid4()` pour IDs déterministes
2. Supprimer dépendance circulaire avec `main.py` (passer PROCESSES en paramètre)
3. Améliorer `group_capabilities_l2_l1` (logique plus robuste)
4. Séparer ancien format (`infer_capability_l3`) du nouveau format (`generate_architecture_from_events`)

---

## FICHIER : semantic_router.py
**Statut** : ⚠️ **INCERTAIN** (fonctionnel mais très basique)
**Raison** :
- ✅ Code déterministe, pas de LLM
- ✅ Logique simple et claire
- ⚠️ Router très basique (mots-clés simples)
- ⚠️ Dépend de `main.py` (PROCESSES, SUBMITTED_PROCESSES, FACTS) - couplage fort
- ⚠️ Logique de réponse très simpliste (extraction brute depuis state)

**Classes/Fonctions clés** :
- `route_question(question)` : Routing basé sur mots-clés
- `answer_question(question, route)` : Génération réponse depuis routing

**Dépendances** :
- `typing` (stdlib)
- `.main` (PROCESSES, SUBMITTED_PROCESSES, FACTS, load_initiatives) - ⚠️ **COUPLAGE FORT**
- `.architecture` (CAPABILITIES) - ⚠️ **COUPLAGE FORT**

**À migrer vers** : `backend/services/semantic_router.py`
**Actions** : ⚠️ **REFACTORER** :
1. Supprimer dépendances directes à `main.py` (injecter dépendances)
2. Améliorer le router (peut-être utiliser embeddings simples ou règles plus sophistiquées)
3. Extraire logique de réponse dans service séparé

---

## FICHIER : main.py
**Statut** : ⚠️ **INCERTAIN** (fonctionnel mais nécessite refactoring)
**Raison** :
- ✅ Pas de boucles LLM, tout déterministe
- ✅ Endpoints FastAPI bien structurés
- ✅ Modèles Pydantic propres (Process, Initiative)
- ⚠️ **GROS FICHIER** (966 lignes) - mélange routes, logique métier, stockage
- ⚠️ Logique métier dans les routes (mappings, facts, confidence)
- ⚠️ Variables globales en mémoire (PROCESSES, MAPPING_PROPOSALS, etc.)
- ⚠️ Fonctions utilitaires mélangées avec routes (load_dataset, extract_fields, etc.)
- ✅ Gestion d'erreurs correcte (HTTPException)
- ⚠️ Import circulaire potentiel (architecture.py importe depuis main.py)

**Endpoints API** :
- **Interview** : `/process`, `/process/{id}`, `/interview/submit`
- **Architect** : `/architect/interviews`
- **ABP (Architecture Business Process)** :
  - `/abp/datasets`
  - `/abp/asce` (Architecture State Change Event)
  - `/abp/acv` (Architecture Control View)
  - `/abp/mappings/proposals_by_source`
  - `/abp/mappings/propose`
  - `/abp/mappings/decide`
  - `/abp/facts`
  - `/abp/facts/build`
  - `/abp/signals`
  - `/abp/ask`
- **Initiatives** : `/initiatives`, `/initiatives/{id}`, `/initiatives/{id}/link_process`, etc.
- **Architecture** : `/architect/architecture/generate`, `/architect/architecture/latest`
- ~~**Capabilities** : `/api/infer-capabilities`~~ ❌ **À SUPPRIMER** (inférence non-déterministe)

**Dépendances** :
- FastAPI, Pydantic (externes)
- `.storage`, `.semantic_router`, `.architecture`
- ⚠️ `.capability_inference` - **À SUPPRIMER** (ligne 11)
- `uuid`, `datetime`, `os`, `json`, `re` (stdlib)

**À migrer vers** : `backend/main.py` (routes) + services séparés
**Actions** : ⚠️ **REFACTORER LOURDEMENT** :
1. **Extraire services** :
   - `backend/services/process_service.py` : Gestion processes
   - `backend/services/initiative_service.py` : Gestion initiatives
   - `backend/services/mapping_service.py` : Logique mappings ABP
   - `backend/services/fact_service.py` : Logique facts
   - `backend/services/dataset_service.py` : Chargement datasets
2. **Séparer routes** :
   - `backend/routes/interview.py`
   - `backend/routes/architect.py`
   - `backend/routes/abp.py`
   - `backend/routes/initiatives.py`
   - `backend/routes/architecture.py`
3. **Remplacer stockage mémoire** par service de stockage (peut-être garder JSON pour V3)
4. **Supprimer import circulaire** (architecture.py ne doit plus importer depuis main.py)

---

## FICHIER : __init__.py
**Statut** : ✅ **SAIN** (vide, normal)
**Actions** : ✅ **COPIER TEL QUEL**

---

## RÉSUMÉ PAR STATUT

### ✅ SAINS (à copier tels quels)
1. **storage.py** - Utilitaires JSON propres
2. **__init__.py** - Vide, normal

### ⚠️ INCERTAINS (à refactorer)
1. **architecture.py** - Bonne base mais :
   - IDs non-déterministes (hash)
   - Import circulaire
   - Logique de groupement fragile
2. **semantic_router.py** - Fonctionnel mais :
   - Trop basique
   - Couplage fort avec main.py
3. **main.py** - Fonctionnel mais :
   - Trop gros (966 lignes)
   - Logique métier dans routes
   - Variables globales

### ❌ SUPPRIMER
1. **capability_inference.py** - ❌ **SUPPRIMER DÉFINITIVEMENT**
   - Va à l'encontre du principe déterministe de la V3
   - Les capabilities doivent venir directement de l'interview_state, pas être inférées
2. **Endpoint `/api/infer-capabilities`** dans main.py (lignes 936-965) - ❌ **SUPPRIMER**
3. **Fonction `infer_capability_l3`** dans architecture.py - ❌ **SUPPRIMER** (ancien format, remplacé par `generate_architecture_from_events`)

---

## PLAN DE MIGRATION BACKEND V3

### 1. Structure proposée

```
backend/
├── main.py                    # Point d'entrée FastAPI (routes uniquement)
├── core/
│   ├── __init__.py
│   ├── storage.py             # ✅ Copier storage.py
│   └── models.py              # Modèles Pydantic (Process, Initiative, etc.)
├── services/
│   ├── __init__.py
│   ├── architecture.py         # ⚠️ Refactorer architecture.py
│   ├── semantic_router.py       # ⚠️ Refactorer semantic_router.py
│   ├── process_service.py       # ⚠️ Extraire de main.py
│   ├── initiative_service.py    # ⚠️ Extraire de main.py
│   ├── mapping_service.py      # ⚠️ Extraire logique ABP mappings
│   ├── fact_service.py         # ⚠️ Extraire logique facts
│   └── dataset_service.py      # ⚠️ Extraire logique datasets
├── routes/
│   ├── __init__.py
│   ├── interview.py            # Routes interview
│   ├── architect.py            # Routes architect
│   ├── abp.py                  # Routes ABP
│   ├── initiatives.py           # Routes initiatives
│   └── architecture.py          # Routes génération architecture
└── data/                         # ✅ Conserver (JSON storage)
    ├── processes.json
    ├── initiatives.json
    ├── architecture_packages.json
    └── ...
```

### 2. Fichiers à copier tels quels
- ✅ `storage.py` → `core/storage.py`
- ✅ `__init__.py` → `core/__init__.py`, `services/__init__.py`, `routes/__init__.py`

### 2b. Fichiers à supprimer
- ❌ `capability_inference.py` - **SUPPRIMER DÉFINITIVEMENT**
- ❌ Endpoint `/api/infer-capabilities` dans `main.py` - **SUPPRIMER**
- ❌ Fonction `infer_capability_l3` dans `architecture.py` - **SUPPRIMER** (ancien format)

### 3. Fichiers à refactorer

#### architecture.py → services/architecture.py
**Actions** :
1. Remplacer `hash()` par `uuid4()` pour IDs (lignes 59, 79, 124, 426)
2. Supprimer import `from .main import PROCESSES, load_initiatives`
3. Passer `processes` et `initiatives` en paramètres à `generate_architecture_package`
4. Améliorer `group_capabilities_l2_l1` (logique plus robuste)
5. Documenter séparation ancien/nouveau format

#### semantic_router.py → services/semantic_router.py
**Actions** :
1. Supprimer imports depuis `main.py`
2. Injecter dépendances (processes, facts, initiatives) via paramètres
3. Améliorer router (règles plus sophistiquées ou embeddings simples)
4. Extraire logique de réponse dans méthode séparée

#### main.py → routes/ + services/
**Actions** :
1. **Extraire modèles** → `core/models.py` :
   - `Process`
   - `Initiative`
2. **Extraire services** :
   - `process_service.py` : `load_processes()`, `save_processes()`, CRUD processes
   - `initiative_service.py` : `load_initiatives()`, `save_initiatives()`, CRUD initiatives
   - `mapping_service.py` : `generate_mapping_proposals()`, `calculate_confidence()`, `generate_ontology_attributes()`
   - `fact_service.py` : `generate_fact_from_mapping()`, `build_fact_graph()`, CRUD facts
   - `dataset_service.py` : `load_dataset()`, `extract_fields_from_dataset()`, `list_datasets()`
3. **Créer routes séparées** :
   - `routes/interview.py` : `/process`, `/interview/submit`
   - `routes/architect.py` : `/architect/interviews`
   - `routes/abp.py` : Toutes les routes `/abp/*`
   - `routes/initiatives.py` : Toutes les routes `/initiatives/*`
   - `routes/architecture.py` : Routes génération architecture
4. **Refactorer main.py** :
   - Importer et enregistrer toutes les routes
   - Configuration CORS
   - Point d'entrée minimal

### 4. Nouveaux fichiers à créer

#### core/models.py
```python
# Modèles Pydantic extraits de main.py
from pydantic import BaseModel, Field
from typing import Dict, List, Literal

class Process(BaseModel):
    id: str
    name: str
    state: Dict[str, str] = Field(default_factory=dict)

class Initiative(BaseModel):
    id: str
    title: str
    type: Literal["TRANSFORMATION", "DECISION"]
    # ... etc
```

#### services/process_service.py
```python
# Service de gestion des processes
from typing import Dict, List
from ..core.storage import read_json, write_json
from ..core.models import Process

class ProcessService:
    def __init__(self):
        self.processes: Dict[str, Process] = {}
        self.submitted_processes: set = set()
        self.load()
    
    def load(self):
        # Logique de chargement
        pass
    
    def save(self):
        # Logique de sauvegarde
        pass
    # ... CRUD methods
```

#### services/mapping_service.py
```python
# Service de gestion des mappings ABP
# Extraire : generate_mapping_proposals, calculate_confidence, etc.
```

#### routes/interview.py
```python
# Routes interview
from fastapi import APIRouter, HTTPException
from ..services.process_service import ProcessService

router = APIRouter(prefix="/process", tags=["interview"])

@router.get("")
def list_processes():
    # ...
    pass
```

### 5. Ordre de migration recommandé

1. **Phase 1 : Copier les sains + Supprimer les obsolètes**
   - Copier `storage.py` → `core/storage.py`
   - ❌ Supprimer `capability_inference.py`
   - ❌ Supprimer endpoint `/api/infer-capabilities` dans `main.py`
   - ❌ Supprimer fonction `infer_capability_l3` dans `architecture.py`

2. **Phase 2 : Extraire modèles**
   - Créer `core/models.py` avec Process, Initiative

3. **Phase 3 : Refactorer architecture.py**
   - Corriger IDs (hash → uuid)
   - Supprimer import circulaire
   - Améliorer groupement

4. **Phase 4 : Extraire services depuis main.py**
   - `process_service.py`
   - `initiative_service.py`
   - `mapping_service.py`
   - `fact_service.py`
   - `dataset_service.py`

5. **Phase 5 : Créer routes séparées**
   - Extraire routes dans fichiers séparés
   - Refactorer `main.py` en point d'entrée minimal

6. **Phase 6 : Refactorer semantic_router.py**
   - Supprimer couplage avec main.py
   - Améliorer router

---

## POINTS D'ATTENTION

### ⚠️ Problèmes identifiés
1. **Inférence non-déterministe** : `capability_inference.py` doit être supprimé (capabilities viennent de l'interview_state)
2. **Import circulaire** : `architecture.py` importe `main.py` (ligne 388)
3. **IDs non-déterministes** : Utilisation de `hash()` dans architecture.py
4. **Couplage fort** : `semantic_router.py` dépend directement de variables globales de `main.py`
5. **Fichier trop gros** : `main.py` (966 lignes) mélange routes, logique métier, stockage
6. **Variables globales** : PROCESSES, MAPPING_PROPOSALS, etc. en mémoire (OK pour V3 mais à documenter)

### ✅ Points positifs
1. **Pas de boucles LLM** : Tout le code est déterministe
2. **Gestion d'erreurs** : HTTPException bien utilisées
3. **Modèles Pydantic** : Types propres
4. **Stockage atomique** : Écriture JSON sécurisée
5. **Code fonctionnel** : Le backend fonctionne, juste besoin de restructuration

---

## RECOMMANDATIONS FINALES

1. **Priorité CRITIQUE** : ❌ Supprimer `capability_inference.py` et endpoint `/api/infer-capabilities`
   - Les capabilities doivent venir directement de `interview_state.capabilities` (fourni par le frontend)
   - Pas d'inférence heuristique dans la V3
2. **Priorité haute** : Supprimer import circulaire et remplacer hash() par uuid
3. **Priorité moyenne** : Extraire services et routes pour maintenir le code
4. **Priorité basse** : Améliorer semantic_router (peut rester simple pour V3)

**Le code est globalement SAIN et migrable, mais nécessite refactoring pour structure propre et suppression de l'inférence non-déterministe.**

