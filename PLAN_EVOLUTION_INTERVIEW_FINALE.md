# 🎯 PLAN D'ÉVOLUTION — Interview Métier Déterministe + Restitution Architecte

## 📋 Vue d'ensemble

Cette évolution transforme l'interview AVA actuelle en un système complet et robuste, avec :
- **10 phases déterministes** (au lieu de 7)
- **Inférence automatique des capabilities** (sans question utilisateur)
- **Restitution architecte restructurée** (layout 3 colonnes)
- **Génération graphique robuste** (Mermaid compatible, style Ardoq)

---

## 🗂️ FICHIERS À MODIFIER / CRÉER

### **FRONTEND — Interview (page.tsx)**

#### 1. **Types étendus** (`frontend/app/page.tsx`)

**Modifications :**
- Ajouter `policy?: string` à `DomainEvent`
- Ajouter `capabilities?: string[]` à `DomainEvent` (capabilities inférées)
- Étendre `InterviewPhase` avec :
  - `"EVENT_POLICIES"` (Phase 5)
  - `"CAPABILITY_INFERENCE"` (Phase 7 - automatique, pas de question)
  - `"CAPABILITY_CONFIRMATION"` (Phase 8)
  - `"COMPLETENESS_CHECK"` (Phase 9)
  - `"SUBMISSION_READY"` (Phase 10)

**Lignes concernées :** ~34-54

---

#### 2. **Machine à états étendue** (`frontend/app/page.tsx`)

**Modifications :**
- Mettre à jour `transitionPhase()` pour gérer les nouvelles phases
- Ajouter la logique de transition :
  - `EVENT_OBSERVABILITY` → `EVENT_POLICIES`
  - `EVENT_POLICIES` → `CAPABILITY_INFERENCE` (automatique)
  - `CAPABILITY_INFERENCE` → `CAPABILITY_CONFIRMATION`
  - `CAPABILITY_CONFIRMATION` → `COMPLETENESS_CHECK`
  - `COMPLETENESS_CHECK` → `SUBMISSION_READY`

**Lignes concernées :** ~100-120

---

#### 3. **Questions canoniques** (`frontend/app/page.tsx`)

**Modifications :**
- Ajouter dans `getCanonicalQuestion()` :
  - `EVENT_POLICIES`: "Qu'est-ce que l'entreprise doit absolument respecter ou vérifier à ce moment-là ?"
  - `CAPABILITY_CONFIRMATION`: "Est-ce que l'entreprise doit savoir faire ces choses dans ce périmètre ?"
  - `COMPLETENESS_CHECK`: "L'interview est-elle complète ?"
  - `SUBMISSION_READY`: "Prêt à soumettre l'interview ?"

**Lignes concernées :** ~123-180

---

#### 4. **Handlers pour nouvelles phases** (`frontend/app/page.tsx`)

**Nouveaux handlers :**
- `handleEventPolicy()` — Capture des règles métier
- `handleCapabilityInference()` — Inférence automatique (appel API backend)
- `handleCapabilityConfirm()` — Validation des capabilities proposées
- `handleCompletenessCheck()` — Vérification des critères
- `handleSubmitInterview()` — Soumission finale

**Lignes concernées :** ~750-850 (nouveaux handlers)

---

#### 5. **UI — Phase Policies** (`frontend/app/page.tsx`)

**Modifications :**
- Ajouter le rendu conditionnel pour `EVENT_POLICIES`
- Afficher la question + input texte
- Badge 📏 Règle métier dans la restitution

**Lignes concernées :** ~1700-1750

---

#### 6. **UI — Phase Capability Confirmation** (`frontend/app/page.tsx`)

**Modifications :**
- Liste des capabilities inférées (chips)
- Boutons : ✅ Valider, ✏️ Renommer, ❌ Supprimer
- Édition inline pour renommer

**Lignes concernées :** ~1750-1800

---

#### 7. **UI — Phase Completeness Check** (`frontend/app/page.tsx`)

**Modifications :**
- Checklist visuelle :
  - ✅ ≥ 1 événement
  - ✅ Chaîne validée
  - ✅ Applications renseignées
  - ✅ Règles métiers capturées
  - ✅ Capabilities validées
- Bouton "Continuer" si complet

**Lignes concernées :** ~1800-1850

---

#### 8. **UI — Phase Submission Ready** (`frontend/app/page.tsx`)

**Modifications :**
- Bouton unique 🟢 **Soumettre l'interview**
- Résumé final avant soumission
- Appel API `POST /api/submit_interview`

**Lignes concernées :** ~1850-1900

---

#### 9. **Composant CapabilityChip** (NOUVEAU)

**Fichier :** `frontend/app/components/CapabilityChip.tsx`

**Fonctionnalités :**
- Affichage d'une capability avec badge
- Édition inline (renommer)
- Boutons Valider/Supprimer
- Style moderne (chips arrondis)

---

### **BACKEND — API Endpoints**

#### 10. **Inférence des capabilities** (`backend/ava/main.py`)

**Nouveau endpoint :**
```python
@app.post("/api/infer-capabilities")
def infer_capabilities_from_events(payload: Dict[str, Any] = Body(...)):
    """
    Infère les capabilities depuis une chaîne d'événements.
    Payload: { "events": [...], "policies": [...], "applications": [...] }
    Returns: { "capabilities": [...] }
    """
```

**Lignes concernées :** ~850-900 (nouveau endpoint)

---

#### 11. **Soumission interview** (`backend/ava/main.py`)

**Modification endpoint existant :**
- Étendre `submit_interview` pour accepter :
  - `events[]` (chaîne complète)
  - `policies[]` (règles métier)
  - `capabilities[]` (validées)
  - `applications[]` (inventory)
  - `executive_summary` (résumé)

**Lignes concernées :** ~200-250 (modifier endpoint)

---

#### 12. **Module d'inférence capabilities** (`backend/ava/capability_inference.py` - NOUVEAU)

**Fichier :** `backend/ava/capability_inference.py`

**Fonctionnalités :**
- `infer_capabilities_from_events(events, policies, applications)`
- Règles heuristiques :
  - Événement → Capability (ex: "Facture générée" → "Émettre une facture")
  - Policy → Capability (ex: "Vérifier seuil" → "Contrôler les seuils")
  - Application → Capability (ex: "CRM" → "Gérer les clients")
- Retourne liste de capabilities avec confidence

---

### **FRONTEND — Espace Architecte**

#### 13. **Layout restructuré** (`frontend/app/architect/layout.tsx`)

**Modifications :**
- Layout 3 colonnes :
  - Menu gauche (Inventory, Events, Capabilities, Applications, Interfaces)
  - Zone centrale (Canvas d'architecture)
  - Panneau droit (Propriétés + Ask Aura)

**Lignes concernées :** ~10-50

---

#### 14. **Page principale architecte** (`frontend/app/architect/page.tsx`)

**Refonte complète :**
- Menu gauche avec navigation
- Canvas central avec Mermaid
- Panneau droit avec propriétés sélectionnées
- Ask Aura contextuel

**Lignes concernées :** ~70-250 (refonte)

---

#### 15. **Composant Canvas Architecture** (NOUVEAU)

**Fichier :** `frontend/app/architect/components/ArchitectureCanvas.tsx`

**Fonctionnalités :**
- Rendu Mermaid robuste (gestion d'erreurs)
- Objets arrondis (style Ardoq)
- Interaction (sélection d'éléments)
- Zoom/Pan (optionnel)

---

#### 16. **Composant PropertiesPanel** (NOUVEAU)

**Fichier :** `frontend/app/architect/components/PropertiesPanel.tsx`

**Fonctionnalités :**
- Affichage des propriétés de l'élément sélectionné
- Édition inline
- Liens vers l'interview source

---

#### 17. **Composant AskAura contextuel** (`frontend/app/architect/components/AskAura.tsx`)

**Modifications :**
- Intégration dans le panneau droit
- Contexte basé sur l'élément sélectionné
- Lecture seule sur l'interview
- Suggestions architecturales uniquement

**Lignes concernées :** ~1-100 (modifier)

---

### **BACKEND — Génération Architecture**

#### 18. **Génération Mermaid robuste** (`backend/ava/architecture.py`)

**Modifications :**
- Validation des diagrammes Mermaid avant génération
- Gestion d'erreurs (fallback si diagramme invalide)
- Style Ardoq (objets arrondis, couleurs sobres)
- Support des événements multiples (chaîne)

**Lignes concernées :** ~135-220 (modifier fonctions Mermaid)

---

#### 19. **Génération depuis événements** (`backend/ava/architecture.py`)

**Nouvelle fonction :**
```python
def generate_architecture_from_events(events: List[Dict], capabilities: List[Dict], applications: List[str]) -> Dict:
    """
    Génère l'architecture depuis la chaîne d'événements (nouveau format).
    """
```

**Lignes concernées :** ~300-400 (nouvelle fonction)

---

## 📊 SCHÉMA JSON D'ÉTAT

```json
{
  "interview_id": "int_xxx",
  "process_id": "proc_xxx",
  "process_name": "Gestion facturation",
  "phase": "SUBMISSION_READY",
  "events": [
    {
      "id": "event_1",
      "label": "Facture générée",
      "order": 0,
      "variant": "Facture avec erreur",
      "application": "ERP",
      "observability": "Notification email",
      "policy": "Vérifier seuil de 1000€",
      "capabilities": ["cap_1", "cap_2"],
      "confirmed": true
    }
  ],
  "capabilities": [
    {
      "id": "cap_1",
      "name": "Émettre une facture",
      "confidence": 85,
      "evidence": ["event_1"],
      "status": "VALIDATED"
    }
  ],
  "policies": [
    {
      "id": "policy_1",
      "event_id": "event_1",
      "rule": "Vérifier seuil de 1000€",
      "type": "THRESHOLD"
    }
  ],
  "applications": ["ERP", "CRM", "Portail client"],
  "executive_summary": "...",
  "submitted": false,
  "submitted_at": null
}
```

---

## 🧪 CHECK-LIST DE TESTS

### Interview
- [ ] Phase 1 : Capture premier événement
- [ ] Phase 2 : Chaînage (plusieurs événements)
- [ ] Phase 3 : Confirmation visuelle (édition, réordonnancement)
- [ ] Phase 4 : Variantes (par événement)
- [ ] Phase 5 : Policies (par événement)
- [ ] Phase 6 : Applications (par événement)
- [ ] Phase 7 : Observabilité (par événement)
- [ ] Phase 8 : Inférence capabilities (automatique, pas de question)
- [ ] Phase 9 : Confirmation capabilities (validation/renommage/suppression)
- [ ] Phase 10 : Completeness check (checklist)
- [ ] Phase 11 : Soumission (bouton unique)

### Backend
- [ ] Endpoint `/api/infer-capabilities` fonctionne
- [ ] Endpoint `/api/submit_interview` accepte nouveau format
- [ ] Génération Mermaid robuste (pas de crash si données incomplètes)
- [ ] Persistance JSON correcte

### Architecte
- [ ] Layout 3 colonnes s'affiche
- [ ] Menu gauche navigation fonctionne
- [ ] Canvas Mermaid rendu correctement
- [ ] Panneau droit affiche propriétés
- [ ] Ask Aura contextuel fonctionne

---

## 🚀 ORDRE D'IMPLÉMENTATION

1. **Backend — Inférence capabilities** (fichiers 12, 10)
2. **Frontend — Types + Machine à états** (fichiers 1, 2, 3)
3. **Frontend — Handlers nouvelles phases** (fichier 4)
4. **Frontend — UI nouvelles phases** (fichiers 5, 6, 7, 8, 9)
5. **Backend — Soumission interview** (fichier 11)
6. **Backend — Génération architecture** (fichiers 18, 19)
7. **Frontend — Espace Architecte** (fichiers 13, 14, 15, 16, 17)

---

## ⚠️ CONTRAINTES

- **Aucun reset** : conserver l'existant
- **Mode "Étapes" intact** : ne pas casser le mode actuel
- **Déterminisme strict** : LLM uniquement pour reformulation
- **Mermaid robuste** : jamais de crash, fallback si invalide
- **Pas de concepts DDD** dans l'UI utilisateur

---

## ✅ VALIDATION

Après validation de ce plan, je procéderai à l'implémentation étape par étape.

