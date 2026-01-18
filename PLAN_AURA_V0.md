# Plan d'implémentation Aura v0/v1

## ÉTAPE 1 — Corriger les 404 architect (interviews, datasets)
**Fichiers à modifier :**
- `backend/ava/main.py` : Vérifier/corriger endpoints `/architect/interviews` et `/abp/datasets`
- Tests : Vérifier que les endpoints retournent des réponses valides (même vides)

## ÉTAPE 2 — Initiatives backend + stockage JSON + endpoints
**Fichiers à créer :**
- `backend/ava/storage.py` : Module de stockage JSON (read_json, write_json)
- `backend/ava/data/` : Dossier pour les fichiers JSON
- `backend/ava/data/initiatives.json` : Fichier de stockage (créé automatiquement)

**Fichiers à modifier :**
- `backend/ava/main.py` : Ajouter endpoints Initiatives (GET, POST, GET/{id}, PUT/{id}, POST/{id}/link_process, POST/{id}/link_interview)

## ÉTAPE 3 — Initiatives UI (Architect)
**Fichiers à créer :**
- `frontend/app/architect/initiatives/page.tsx` : Liste des initiatives
- `frontend/app/architect/initiatives/[id]/page.tsx` : Détail initiative
- `frontend/app/architect/initiatives/components/InitiativeForm.tsx` : Formulaire create/edit
- `frontend/app/architect/initiatives/components/InitiativeOverviewCard.tsx` : Carte résumé
- `frontend/app/architect/initiatives/components/DecisionGuidePanel.tsx` : Panneau guide décision

**Fichiers à modifier :**
- `frontend/app/architect/layout.tsx` : Ajouter lien "Initiatives" dans le menu

## ÉTAPE 4 — Initiatives UI (Ops)
**Fichiers à créer :**
- `frontend/app/ops/layout.tsx` : Layout Ops (menu gauche)
- `frontend/app/ops/initiatives/page.tsx` : Liste initiatives (réutilise composants Architect)
- `frontend/app/ops/initiatives/[id]/page.tsx` : Détail initiative

## ÉTAPE 5 — Lien initiative <-> process/interview
**Fichiers à modifier :**
- `backend/ava/main.py` : Endpoints link_process, link_interview
- `frontend/app/page.tsx` : Permettre de démarrer interview avec initiative_id
- `frontend/app/architect/initiatives/[id]/page.tsx` : Bouton "Créer Interview AVA"

## ÉTAPE 6 — Architecture generation v0 (backend)
**Fichiers à créer :**
- `backend/ava/architecture.py` : Module génération (capabilities, mermaid, trace)
- `backend/ava/data/architecture_packages.json` : Stockage packages

**Fichiers à modifier :**
- `backend/ava/main.py` : Endpoints POST /architect/architecture/generate, GET /architect/architecture/latest

## ÉTAPE 7 — Architecture UI (Architect)
**Fichiers à créer :**
- `frontend/app/architect/architecture/page.tsx` : Page génération
- `frontend/app/architect/architecture/components/MermaidRenderer.tsx` : Rendu Mermaid (ou code)
- `frontend/app/architect/architecture/components/CapabilityMap.tsx` : Carte capabilities
- `frontend/app/architect/architecture/components/ArchitectureTabs.tsx` : Onglets (statique, dynamique, couverture, intégration)

## ÉTAPE 8 — Signals v0 (backend + ops UI)
**Fichiers à créer :**
- `backend/ava/data/signals.json` : Stockage signals

**Fichiers à modifier :**
- `backend/ava/main.py` : Endpoints GET /signals, POST /signals, PUT /signals/{id}
- `frontend/app/ops/signals/page.tsx` : Liste signals
- `frontend/app/architect/components/RightPanel.tsx` : Panneau droit avec signals

## ÉTAPE 9 — Ask Aura v0 (ops + architect)
**Fichiers à créer :**
- `backend/ava/semantic_router.py` : Router simple (heuristiques)
- `frontend/app/ops/ask/page.tsx` : Page Ask Aura
- `frontend/app/architect/ask/page.tsx` : Page Ask Aura (Architect)

**Fichiers à modifier :**
- `backend/ava/main.py` : Endpoint POST /abp/ask (améliorer l'existant)

