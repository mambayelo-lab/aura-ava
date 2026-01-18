# 📐 SCHÉMA JSON D'ÉTAT — Interview Métier Déterministe

## Structure complète

```typescript
// Type principal de l'interview
type InterviewState = {
  // Identifiants
  interview_id: string;              // UUID généré
  process_id: string;                // ID du processus/périmètre
  process_name: string;              // Nom du périmètre métier
  
  // État de la machine
  phase: InterviewPhase;             // Phase actuelle
  completed_phases: InterviewPhase[]; // Phases complétées
  
  // Données capturées
  events: DomainEvent[];             // Chaîne d'événements métier
  policies: BusinessPolicy[];        // Règles métier
  capabilities: Capability[];        // Capabilities inférées et validées
  applications: Application[];        // Inventory applicatif
  
  // Métadonnées
  executive_summary: string[];       // Résumé exécutif (bullets)
  conversation_transcript: ConversationMessage[]; // Q/A complet
  
  // Statut
  submitted: boolean;                // Soumis à l'architecte
  submitted_at: string | null;      // ISO timestamp
  created_at: string;                // ISO timestamp
  updated_at: string;                // ISO timestamp
};

// Événement métier (Domain Event)
type DomainEvent = {
  id: string;                         // UUID
  label: string;                     // Libellé métier (ex: "Facture générée")
  order: number;                      // Ordre dans la chaîne (0, 1, 2...)
  
  // Attributs optionnels
  variant?: string;                   // Variante/exception (ex: "Facture avec erreur")
  application?: string;                // Application utilisée (ex: "ERP")
  observability?: string;             // Comment on sait que c'est arrivé (ex: "Notification email")
  policy?: string;                   // Règle métier associée (ex: "Vérifier seuil 1000€")
  capabilities?: string[];            // IDs des capabilities inférées
  
  // Métadonnées
  confirmed: boolean;                 // Confirmé par l'utilisateur
  created_at: string;                 // ISO timestamp
};

// Règle métier (Business Policy)
type BusinessPolicy = {
  id: string;                         // UUID
  event_id: string;                   // ID de l'événement associé
  rule: string;                       // Libellé de la règle (ex: "Vérifier seuil de 1000€")
  type: "THRESHOLD" | "CONTROL" | "OBLIGATION" | "CALCULATION" | "TEMPORAL" | "OTHER";
  description?: string;                // Description détaillée
  created_at: string;                 // ISO timestamp
};

// Capability (inférée puis validée)
type Capability = {
  id: string;                         // UUID
  name: string;                       // Nom de la capability (ex: "Émettre une facture")
  level: "L3" | "L2" | "L1";          // Niveau hiérarchique (9Q)
  
  // Inférence
  confidence: number;                   // 0-100
  evidence: string[];                  // IDs des événements/policies sources
  inference_method: "EVENT" | "POLICY" | "APPLICATION" | "COMBINED";
  
  // Validation
  status: "INFERRED" | "VALIDATED" | "REJECTED" | "RENAMED";
  validated_name?: string;             // Nom validé/renommé par l'utilisateur
  
  // Relations
  parent_capability_id?: string;       // Capability L2/L1 parente
  linked_applications: string[];       // Applications liées
  linked_events: string[];            // Événements liés
  
  // Métadonnées
  created_at: string;                  // ISO timestamp
  validated_at?: string;               // ISO timestamp
};

// Application (inventory)
type Application = {
  id: string;                         // UUID
  name: string;                       // Nom métier (ex: "ERP", "CRM", "Portail client")
  type: "SYSTEM" | "TOOL" | "PLATFORM" | "SERVICE" | "UNKNOWN";
  description?: string;                // Description optionnelle
  linked_events: string[];            // Événements utilisant cette app
  linked_capabilities: string[];        // Capabilities réalisées par cette app
  created_at: string;                  // ISO timestamp
};

// Message de conversation
type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;                   // ISO timestamp
  phase: InterviewPhase;               // Phase au moment du message
  event_id?: string;                   // Événement concerné (si applicable)
};
```

---

## Exemple JSON complet

```json
{
  "interview_id": "int_abc123",
  "process_id": "proc_xyz789",
  "process_name": "Gestion facturation client",
  "phase": "SUBMISSION_READY",
  "completed_phases": [
    "PERIMETER",
    "EVENT_CAPTURE",
    "EVENT_CHAINING",
    "CHAIN_VISUAL_CONFIRM",
    "EVENT_VARIANTS",
    "EVENT_POLICIES",
    "EVENT_APPLICATIONS",
    "EVENT_OBSERVABILITY",
    "CAPABILITY_INFERENCE",
    "CAPABILITY_CONFIRMATION",
    "COMPLETENESS_CHECK"
  ],
  "events": [
    {
      "id": "event_1",
      "label": "Facture générée",
      "order": 0,
      "variant": "Facture avec erreur de montant",
      "application": "ERP",
      "observability": "Notification email envoyée au client",
      "policy": "Vérifier seuil de 1000€",
      "capabilities": ["cap_1", "cap_2"],
      "confirmed": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "event_2",
      "label": "Client notifié",
      "order": 1,
      "application": "Portail client",
      "observability": "Statut 'Notifié' dans le système",
      "capabilities": ["cap_2"],
      "confirmed": true,
      "created_at": "2024-01-15T10:35:00Z"
    },
    {
      "id": "event_3",
      "label": "Paiement reçu",
      "order": 2,
      "application": "Solution de paiement",
      "observability": "Confirmation bancaire",
      "capabilities": ["cap_3"],
      "confirmed": true,
      "created_at": "2024-01-15T10:40:00Z"
    }
  ],
  "policies": [
    {
      "id": "policy_1",
      "event_id": "event_1",
      "rule": "Vérifier seuil de 1000€ avant validation",
      "type": "THRESHOLD",
      "description": "Toute facture supérieure à 1000€ doit être validée manuellement",
      "created_at": "2024-01-15T10:32:00Z"
    }
  ],
  "capabilities": [
    {
      "id": "cap_1",
      "name": "Émettre une facture",
      "level": "L3",
      "confidence": 85,
      "evidence": ["event_1"],
      "inference_method": "EVENT",
      "status": "VALIDATED",
      "validated_name": "Émettre une facture",
      "linked_applications": ["ERP"],
      "linked_events": ["event_1"],
      "created_at": "2024-01-15T10:45:00Z",
      "validated_at": "2024-01-15T10:46:00Z"
    },
    {
      "id": "cap_2",
      "name": "Notifier le client",
      "level": "L3",
      "confidence": 80,
      "evidence": ["event_1", "event_2"],
      "inference_method": "COMBINED",
      "status": "VALIDATED",
      "linked_applications": ["Portail client"],
      "linked_events": ["event_2"],
      "created_at": "2024-01-15T10:45:00Z",
      "validated_at": "2024-01-15T10:47:00Z"
    },
    {
      "id": "cap_3",
      "name": "Recevoir un paiement",
      "level": "L3",
      "confidence": 75,
      "evidence": ["event_3"],
      "inference_method": "EVENT",
      "status": "VALIDATED",
      "linked_applications": ["Solution de paiement"],
      "linked_events": ["event_3"],
      "created_at": "2024-01-15T10:45:00Z",
      "validated_at": "2024-01-15T10:48:00Z"
    }
  ],
  "applications": [
    {
      "id": "app_1",
      "name": "ERP",
      "type": "SYSTEM",
      "description": "Système de gestion intégré",
      "linked_events": ["event_1"],
      "linked_capabilities": ["cap_1"],
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "app_2",
      "name": "Portail client",
      "type": "PLATFORM",
      "linked_events": ["event_2"],
      "linked_capabilities": ["cap_2"],
      "created_at": "2024-01-15T10:35:00Z"
    },
    {
      "id": "app_3",
      "name": "Solution de paiement",
      "type": "SERVICE",
      "linked_events": ["event_3"],
      "linked_capabilities": ["cap_3"],
      "created_at": "2024-01-15T10:40:00Z"
    }
  ],
  "executive_summary": [
    "📋 Périmètre : Gestion facturation client",
    "🚩 3 événement(s) métier identifié(s)",
    "   1. Facture générée",
    "      → Application : ERP",
    "      → Observabilité : Notification email envoyée au client",
    "      → Variante : Facture avec erreur de montant",
    "   2. Client notifié",
    "      → Application : Portail client",
    "      → Observabilité : Statut 'Notifié' dans le système",
    "   3. Paiement reçu",
    "      → Application : Solution de paiement",
    "      → Observabilité : Confirmation bancaire",
    "📏 1 règle métier : Vérifier seuil de 1000€",
    "🧠 3 capabilities validées : Émettre une facture, Notifier le client, Recevoir un paiement"
  ],
  "conversation_transcript": [
    {
      "role": "assistant",
      "content": "Bonjour ! Je vais vous aider à capturer le périmètre \"Gestion facturation client\"...",
      "timestamp": "2024-01-15T10:30:00Z",
      "phase": "EVENT_CAPTURE"
    },
    {
      "role": "user",
      "content": "Facture générée",
      "timestamp": "2024-01-15T10:30:15Z",
      "phase": "EVENT_CAPTURE"
    }
    // ... autres messages
  ],
  "submitted": false,
  "submitted_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:50:00Z"
}
```

---

## Mapping avec le backend

### Endpoint `POST /api/submit_interview`

**Payload attendu :**
```json
{
  "process_id": "proc_xyz789",
  "interview_state": {
    // ... structure InterviewState complète
  }
}
```

**Réponse :**
```json
{
  "interview_id": "int_abc123",
  "status": "submitted",
  "submitted_at": "2024-01-15T10:50:00Z"
}
```

---

## Persistance backend

Le backend stocke l'interview dans :
- `backend/ava/data/interviews.json` (liste des interviews soumises)
- Format identique à `InterviewState`

