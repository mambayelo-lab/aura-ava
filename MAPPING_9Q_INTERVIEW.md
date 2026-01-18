# 🗺️ MAPPING 9Q ↔ Interview Métier Déterministe

## Vue d'ensemble

Le framework 9Q (9 Questions) structure l'analyse métier en 9 dimensions. L'interview déterministe capture ces dimensions dans un ordre spécifique, sans jamais mentionner les concepts techniques à l'utilisateur.

---

## Mapping détaillé

### **Q1 — ACTEUR (Actor)**

**9Q :** Qui initie réellement cette action ?

**Interview déterministe :**
- ❌ **PAS de question directe** (concept technique)
- ✅ **Inféré automatiquement** depuis les événements
- ✅ **Exemple :** "Facture générée" → Acteur = "Système de facturation" (inféré)

**Capture :**
- Implicite dans les événements
- Peut être déduit de l'application utilisée

**Stockage backend :**
```json
{
  "actor": "Système de facturation",  // Inféré
  "actor_evidence": ["event_1", "app_1"]
}
```

---

### **Q2 — COMMANDE (Command)**

**9Q :** Quelle commande explicite est émise ?

**Interview déterministe :**
- ❌ **PAS de question directe**
- ✅ **Inféré depuis l'événement** (verbe d'action)
- ✅ **Exemple :** "Facture générée" → Commande = "Générer facture" (inféré)

**Capture :**
- Verbe d'action dans le libellé de l'événement
- Reformulation automatique si nécessaire

**Stockage backend :**
```json
{
  "command": "Générer facture",  // Inféré depuis "Facture générée"
  "command_evidence": ["event_1"]
}
```

---

### **Q3 — OBJET MÉTIER (Business Object)**

**9Q :** Sur quel objet métier porte cette commande ?

**Interview déterministe :**
- ❌ **PAS de question directe**
- ✅ **Inféré depuis l'événement** (nom de l'objet)
- ✅ **Exemple :** "Facture générée" → Objet = "Facture" (inféré)

**Capture :**
- Nom de l'objet dans le libellé de l'événement
- Extraction automatique

**Stockage backend :**
```json
{
  "business_object": "Facture",  // Inféré
  "business_object_evidence": ["event_1"]
}
```

---

### **Q4 — ATTRIBUTS (Object Attributes)**

**9Q :** Quels attributs sont indispensables ?

**Interview déterministe :**
- ❌ **PAS de question directe** (trop technique)
- ✅ **Inféré depuis les règles métier (Policies)**
- ✅ **Exemple :** Policy "Vérifier seuil 1000€" → Attribut = "Montant" (inféré)

**Capture :**
- Via les **Policies** (Phase 5)
- Question : "Qu'est-ce que l'entreprise doit absolument respecter ou vérifier ?"
- Réponse : "Vérifier seuil de 1000€" → Attribut "Montant" inféré

**Stockage backend :**
```json
{
  "object_attributes": ["Montant", "Date", "Client"],  // Inférés depuis policies
  "attributes_evidence": ["policy_1"]
}
```

---

### **Q5 — ÉVÉNEMENT (Event)**

**9Q :** Quel événement confirme l'exécution ?

**Interview déterministe :**
- ✅ **Question directe** (Phase 1-2)
- ✅ **Question canonique :** "Quel est le premier fait métier important qui se produit ?"
- ✅ **Capture explicite** dans `DomainEvent`

**Capture :**
- Phase 1 : Premier événement
- Phase 2 : Chaînage des événements suivants
- Stocké dans `events[]`

**Stockage backend :**
```json
{
  "events": [
    {
      "id": "event_1",
      "label": "Facture générée",  // ✅ Capturé explicitement
      "order": 0
    }
  ]
}
```

---

### **Q6 — RÉACTION (Reaction)**

**9Q :** Qu'est-ce que cela déclenche ?

**Interview déterministe :**
- ✅ **Capture via chaînage d'événements** (Phase 2)
- ✅ **Question canonique :** "Et ensuite, quel est le fait métier suivant qui se produit réellement ?"
- ✅ **Réaction = événement suivant dans la chaîne**

**Capture :**
- Phase 2 : Chaînage
- Exemple : "Facture générée" → "Client notifié" (réaction)

**Stockage backend :**
```json
{
  "events": [
    {
      "id": "event_1",
      "label": "Facture générée",
      "order": 0
    },
    {
      "id": "event_2",
      "label": "Client notifié",  // ✅ Réaction de event_1
      "order": 1
    }
  ],
  "reactions": [
    {
      "from_event": "event_1",
      "to_event": "event_2"
    }
  ]
}
```

---

### **Q7 — SYSTÈMES (Systems)**

**9Q :** Quels systèmes sont impliqués ?

**Interview déterministe :**
- ✅ **Question directe** (Phase 6)
- ✅ **Question canonique :** "Quel outil ou application est utilisé aujourd'hui quand [événement] se produit ?"
- ✅ **Capture explicite** dans `applications[]`

**Capture :**
- Phase 6 : Applications métier
- Réponse libre (nom métier)
- Stocké dans `applications[]`

**Stockage backend :**
```json
{
  "applications": [
    {
      "id": "app_1",
      "name": "ERP",  // ✅ Capturé explicitement
      "type": "SYSTEM"
    }
  ]
}
```

---

### **Q8 — VISIBILITÉ (Visibility)**

**9Q :** Qui voit quoi et quand ?

**Interview déterministe :**
- ✅ **Question directe** (Phase 7)
- ✅ **Question canonique :** "Comment sait-on que cet événement a bien eu lieu ?"
- ✅ **Capture explicite** dans `observability`

**Capture :**
- Phase 7 : Observabilité
- Réponse : "Notification email", "Statut dans le système", etc.
- Stocké dans `event.observability`

**Stockage backend :**
```json
{
  "events": [
    {
      "id": "event_1",
      "label": "Facture générée",
      "observability": "Notification email envoyée au client"  // ✅ Capturé
    }
  ]
}
```

---

### **Q9 — FRAGILITÉ (Fragility)**

**9Q :** Où ça casse ?

**Interview déterministe :**
- ✅ **Question directe** (Phase 4)
- ✅ **Question canonique :** "Est-ce qu'il arrive que [événement] se produise autrement ou pose problème ?"
- ✅ **Capture explicite** dans `variant`

**Capture :**
- Phase 4 : Variantes/exceptions
- Réponse : "Facture avec erreur", "Paiement échoué", etc.
- Stocké dans `event.variant`

**Stockage backend :**
```json
{
  "events": [
    {
      "id": "event_1",
      "label": "Facture générée",
      "variant": "Facture avec erreur de montant"  // ✅ Capturé
    }
  ]
}
```

---

## Tableau récapitulatif

| 9Q | Interview Phase | Question Utilisateur | Capture | Stockage |
|---|---|---|---|---|
| Q1 — Acteur | Inférence auto | ❌ Aucune | Implicite | `actor` (inféré) |
| Q2 — Commande | Inférence auto | ❌ Aucune | Implicite | `command` (inféré) |
| Q3 — Objet métier | Inférence auto | ❌ Aucune | Implicite | `business_object` (inféré) |
| Q4 — Attributs | Phase 5 (Policies) | ✅ "Qu'est-ce que l'entreprise doit respecter ?" | Via Policies | `object_attributes` (inféré) |
| Q5 — Événement | Phase 1-2 | ✅ "Quel est le premier fait métier ?" | Explicite | `events[]` |
| Q6 — Réaction | Phase 2 (Chaînage) | ✅ "Et ensuite, quel fait métier ?" | Explicite | `events[]` (ordre) |
| Q7 — Systèmes | Phase 6 | ✅ "Quel outil est utilisé ?" | Explicite | `applications[]` |
| Q8 — Visibilité | Phase 7 | ✅ "Comment sait-on que c'est arrivé ?" | Explicite | `event.observability` |
| Q9 — Fragilité | Phase 4 | ✅ "Est-ce qu'il arrive que ça se passe autrement ?" | Explicite | `event.variant` |

---

## Inférence automatique (backend)

### Acteur, Commande, Objet métier

```python
def infer_actor_command_object(event: DomainEvent) -> Dict:
    """
    Infère acteur, commande, objet métier depuis un événement.
    """
    label = event.label  # Ex: "Facture générée"
    
    # Extraction verbe + objet
    # "Facture générée" → command="Générer", object="Facture"
    
    # Acteur inféré depuis l'application
    actor = infer_actor_from_application(event.application)
    
    return {
        "actor": actor,
        "command": extract_command(label),
        "business_object": extract_object(label)
    }
```

### Attributs depuis Policies

```python
def infer_attributes_from_policies(policies: List[BusinessPolicy]) -> List[str]:
    """
    Infère les attributs depuis les règles métier.
    """
    attributes = []
    for policy in policies:
        # "Vérifier seuil de 1000€" → attribut "Montant"
        # "Vérifier date limite" → attribut "Date"
        attributes.extend(extract_attributes(policy.rule))
    return list(set(attributes))
```

---

## Génération 9Q Grid (backend)

Une fois l'interview complète, le backend génère la grille 9Q complète :

```json
{
  "9q_grid": {
    "actor": "Système de facturation",
    "command": "Générer facture",
    "business_object": "Facture",
    "object_attributes": ["Montant", "Date", "Client"],
    "event": "Facture générée",
    "reaction": "Client notifié",
    "systems": ["ERP", "Portail client"],
    "visibility": "Notification email",
    "fragility": "Facture avec erreur"
  }
}
```

Cette grille est utilisée pour :
- Génération d'architecture
- Inférence de capabilities
- Génération de diagrammes Mermaid

---

## Résultat

✅ **L'utilisateur ne voit jamais** les concepts 9Q techniques  
✅ **Tout est capturé** via des questions métier naturelles  
✅ **Le backend reconstruit** la grille 9Q complète  
✅ **L'architecte exploite** directement la grille 9Q

