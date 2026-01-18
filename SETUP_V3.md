# SETUP AURA AVA V3 - Instructions

## ✅ Backend - Structure créée

La structure backend V3 a été créée avec :
- ✅ Modèle ontologique (`backend/ava/models/ontology.py`)
- ✅ Connexion Neo4j (`backend/ava/db/neo4j.py`)
- ✅ Routes API implémentées (`backend/ava/api/interview.py` avec CRUD JSON)
- ✅ Service de stockage (`backend/ava/services/storage.py` - read_json/write_json)
- ✅ Point d'entrée (`backend/ava/main.py`)
- ✅ Configuration (`backend/pyproject.toml` mis à jour)
- ✅ Stockage JSON (`backend/ava/data/interviews.json`)

## 📋 Actions requises

### 1. Backend - Installation dépendances

```bash
cd backend
# Si vous utilisez Poetry
poetry install

# Ou avec pip
pip install fastapi uvicorn pydantic neo4j python-dotenv
```

### 2. Backend - Fichier .env

Créer `backend/.env` (déjà créé mais peut nécessiter ajustement) :
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=aura2025
```

### 3. Backend - Lancer le serveur

```bash
cd backend
# Avec Poetry
poetry run uvicorn ava.main:app --reload

# Ou avec uvicorn directement
uvicorn ava.main:app --reload
```

Ouvrir http://localhost:8000/docs pour vérifier l'API.

### 4. Frontend - Installation dépendances

Le frontend existe déjà. Installer les dépendances manquantes :

```bash
cd frontend

# Installer shadcn/ui
npx shadcn-ui@latest init
# Réponses :
# - Style : Default
# - Color : Slate
# - CSS variables : Yes

# Installer composants de base
npx shadcn-ui@latest add button card dialog form input label select textarea

# Installer dépendances additionnelles
npm install reactflow lucide-react @tanstack/react-query axios zod
```

### 5. Frontend - Fichier .env.local

Créer `frontend/.env.local` :
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 6. Frontend - Lancer le serveur

```bash
cd frontend
npm run dev
```

Ouvrir http://localhost:3000

## 📁 Structure créée

```
backend/
├── ava/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── interview.py      ✅ Créé (CRUD implémenté avec JSON)
│   │   ├── ontology.py       ✅ Créé (squelette)
│   │   └── compilation.py     ✅ Créé (squelette)
│   ├── models/
│   │   ├── __init__.py
│   │   └── ontology.py       ✅ Créé (Decision-focused)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ava_compiler.py   ✅ Créé (squelette)
│   │   └── storage.py        ✅ Créé (read_json/write_json)
│   ├── db/
│   │   ├── __init__.py
│   │   └── neo4j.py          ✅ Créé
│   ├── data/                  ✅ Existant (copié depuis ancien)
│   │   └── interviews.json   ✅ Créé (stockage interviews)
│   ├── datasets/              ✅ Existant (copié depuis ancien)
│   └── main.py               ✅ Créé (point d'entrée V3)
├── pyproject.toml            ✅ Mis à jour
└── .env                       ⚠️ À créer manuellement (voir ci-dessus)

frontend/
├── lib/
│   └── types/
│       └── ontology.ts       ✅ Créé (Decision-focused)
└── .env.local                 ⚠️ À créer manuellement (voir ci-dessus)
```

## ⚠️ Notes importantes

1. **Phase 1: Decision-focused uniquement**
   - Types implémentés : Decision, Fact, Rule, Signal, PainPoint, Actor, Application
   - Types commentés (Phase 2) : Activity, Process, Trigger, Result, ActivityRelation

2. **Point d'entrée backend**
   - Utiliser `ava.main:app` pour la V3
   - L'ancien code reste dans le repo mais n'est plus utilisé

3. **Stockage**
   - **Phase actuelle** : Stockage JSON dans `backend/ava/data/interviews.json`
   - **Phase future** : Migration vers Neo4j (connexion déjà préparée)
   - Service `storage.py` avec `read_json()` et `write_json()` atomiques

4. **Routes API Interview**
   - ✅ **CRUD complet implémenté** avec stockage JSON :
     - `POST /api/interview/` - Créer interview
     - `GET /api/interview/` - Lister toutes les interviews
     - `GET /api/interview/{id}` - Récupérer une interview
     - `PUT /api/interview/{id}` - Mettre à jour une interview
     - `DELETE /api/interview/{id}` - Supprimer une interview
     - `POST /api/interview/{id}/submit` - Soumettre une interview

5. **Neo4j**
   - Connexion préparée mais non utilisée pour l'instant
   - Test de connexion disponible sur `/health`
   - Migration vers Neo4j prévue pour Phase 2

## ✅ Vérifications

### Backend
```bash
curl http://localhost:8000/
# Devrait retourner : {"message":"AURA AVA V3 API","status":"running"}

curl http://localhost:8000/health
# Devrait retourner : {"status":"healthy","neo4j":true/false}
```

### Frontend
- Ouvrir http://localhost:3000
- Vérifier qu'il n'y a pas d'erreurs dans la console

## 🚀 Prochaines étapes

Une fois le setup validé, passer à **PROMPT 3** pour :
- Implémenter l'UI d'interview Aide à la Décision
- Implémenter la logique de compilation AVA
- Connecter le frontend au backend

