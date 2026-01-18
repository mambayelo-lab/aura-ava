# 🎯 Interview Conversationnelle - Guide de Démarrage

## 📋 Vue d'ensemble

Le système d'interview conversationnelle utilise GenAI (Claude API) pour capturer les processus métier de manière naturelle et fluide, remplaçant l'intervention d'un consultant senior.

## 🚀 Installation

### 1. Dépendances Backend

```bash
cd backend
pip install anthropic>=0.18.0
# ou si vous utilisez uv
uv pip install anthropic
```

### 2. Variable d'environnement

Assurez-vous d'avoir la clé API Anthropic configurée :

```bash
export ANTHROPIC_API_KEY="votre-clé-api-ici"
```

Ou dans un fichier `.env` :
```
ANTHROPIC_API_KEY=votre-clé-api-ici
```

## 📁 Structure des fichiers

### Backend

- `backend/ava/models/conversational_interview.py` - Modèles Pydantic
- `backend/ava/services/conversational_ai.py` - Service GenAI (Claude)
- `backend/ava/services/conversational_storage.py` - Stockage JSON
- `backend/ava/api/conversational_interview.py` - Routes API FastAPI
- `backend/ava/data/sample_interviews.py` - Datasets test (3 secteurs)

### Frontend

- `frontend/app/interview/conversational/[id]/page.tsx` - Interface chat

## 🔧 Démarrage

### 1. Démarrer le backend

```bash
cd backend
uvicorn ava.main:app --reload --port 8000
```

### 2. Démarrer le frontend

```bash
cd frontend
npm run dev
```

### 3. Créer une nouvelle interview

```bash
curl -X POST http://localhost:8000/api/conversational-interview/create \
  -H "Content-Type: application/json" \
  -d '{"mode": "transformation"}'
```

Réponse :
```json
{
  "id": "uuid-de-l-interview",
  "status": "created",
  "initial_message": {
    "role": "assistant",
    "content": "Bonjour ! Je suis votre consultant AURA...",
    "timestamp": "2024-..."
  }
}
```

### 4. Accéder à l'interface

Ouvrir dans le navigateur :
```
http://localhost:3000/interview/conversational/{id}
```

## 🎯 Flux d'utilisation

### Phase 1 : Discovery (Découverte)

1. L'utilisateur décrit son processus métier en langage naturel
2. GenAI extrait et reformule les activités identifiées
3. L'utilisateur valide/modifie les activités proposées
4. Passage automatique en phase Deep Dive

### Phase 2 : Deep Dive (Approfondissement)

Pour chaque activité, 7 questions sont posées automatiquement :

1. **Trigger** : Qu'est-ce qui déclenche l'activité ?
2. **Output** : Qu'est-ce qui est produit ?
3. **Attributes** : Quelles informations sont nécessaires ?
4. **Actor** : Qui réalise l'activité ?
5. **Rules** : Y a-t-il des règles métier ?
6. **Signals** : Quand faut-il être alerté ?
7. **Pain Points** : Quelles sont les difficultés ?

### Phase 3 : Consolidation

- Synthèse complète du processus capturé
- Statistiques (activités, objets, acteurs, règles)
- Possibilité d'enrichir/modifier
- Soumission au Workspace Architecte

## 📊 Datasets test

3 datasets sont disponibles dans `backend/ava/data/sample_interviews.py` :

1. **Retail** : Processus de commande client e-commerce
2. **Énergie** : Processus de facturation clients énergie
3. **Logistique** : Processus de réception marchandises entrepôt

## 🔌 API Endpoints

### Créer une interview
```
POST /api/conversational-interview/create
Body: { "mode": "transformation" | "decision" }
```

### Récupérer une interview
```
GET /api/conversational-interview/{interview_id}
```

### Analyser description initiale
```
POST /api/conversational-interview/{interview_id}/analyze-initial
Body: { "text": "description du processus..." }
```

### Valider activités (passage en Deep Dive)
```
POST /api/conversational-interview/{interview_id}/validate-activities
```

### Répondre à une question Deep Dive
```
POST /api/conversational-interview/{interview_id}/answer-deep-dive
Body: { "text": "réponse utilisateur..." }
```

### Mettre à jour une activité
```
POST /api/conversational-interview/{interview_id}/update-activity
Body: {
  "activity_id": "act_0_0",
  "updates": { "label": "Nouveau libellé" }
}
```

### Soumettre l'interview
```
POST /api/conversational-interview/{interview_id}/submit
```

### Lister toutes les interviews
```
GET /api/conversational-interview/
```

## 🎨 Fonctionnalités

- ✅ Dialogue naturel (chat interface)
- ✅ Reformulation temps réel éditables
- ✅ 3 phases distinctes (Discovery, Deep Dive, Consolidation)
- ✅ Auto-save (stockage JSON persistant)
- ✅ Design moderne (gradients, animations)
- ✅ Ton professionnel consultant senior (vouvoiement)

## 🐛 Dépannage

### Erreur : "ANTHROPIC_API_KEY environment variable not set"

Solution : Vérifier que la variable d'environnement est bien définie :
```bash
echo $ANTHROPIC_API_KEY
```

### Erreur : "AI analysis failed"

Solution : Vérifier que la clé API est valide et que vous avez des crédits Anthropic.

### Erreur : "Interview not found"

Solution : Vérifier que l'ID de l'interview est correct et que le fichier JSON existe dans `backend/ava/data/conversational/`.

## 📝 Prochaines étapes

Une fois l'interview complétée et soumise, elle est prête pour le **PROMPT 2 : MAPPING ONTOLOGIQUE** qui mappera les données capturées avec les systèmes réels (SAP, Salesforce, Kaluza, WMS...).

