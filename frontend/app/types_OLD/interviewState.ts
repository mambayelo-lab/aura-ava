/**
 * STATE CANONIQUE UNIQUE pour AVA Interview
 * 
 * Source de vérité unique pour les deux vues (conversationnelle + structurée)
 */

/* =======================
   Entités Event Storming / DDD
======================= */

export type ConversationLogEntry = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  phase?: string;
  question_id?: string; // ID unique de la question posée (anti-boucle)
};

export type BusinessEvent = {
  id: string;
  label: string;
  order: number;
  actor_id?: string;
  command_id?: string;
  business_object_id?: string;
  policy_ids: string[];
  variant_ids: string[];
  capability_ids: string[];
  application_ids: string[];
  visibility?: string;
  confirmed: boolean;
  confirmed_at?: string;
};

export type Variant = {
  id: string;
  event_id: string;
  condition: string;
  consequence: string;
  type: "EXCEPTION" | "ALTERNATIVE" | "ERROR";
};

export type Actor = {
  id: string;
  name: string;
  type: "HUMAN" | "SYSTEM" | "EXTERNAL";
  description?: string;
};

export type Command = {
  id: string;
  name: string;
  actor_id: string;
  event_id: string;
  description?: string;
};

export type BusinessObject = {
  id: string;
  name: string;
  type: "ENTITY" | "VALUE_OBJECT" | "AGGREGATE";
  attributes?: string[];
  event_ids: string[];
};

export type Policy = {
  id: string;
  event_id: string;
  rule: string;
  type: "THRESHOLD" | "CONTROL" | "OBLIGATION" | "CALCULATION" | "TEMPORAL" | "INVARIANT" | "OTHER";
  description?: string;
};

export type Capability = {
  id: string;
  name: string;
  level: "L3" | "L2" | "L1";
  confidence: number;
  evidence: string[];
  inference_method: "EVENT" | "POLICY" | "APPLICATION" | "COMBINED";
  status: "INFERRED" | "VALIDATED" | "REJECTED" | "RENAMED";
  validated_name?: string;
  linked_applications: string[];
  linked_events: string[];
};

export type Application = {
  id: string;
  name: string; // Nom fonctionnel uniquement (pas de techno)
  type: "SYSTEM" | "TOOL" | "MANUAL" | "EXTERNAL";
  description?: string;
  event_ids: string[];
};

export type Visibility = {
  id: string;
  event_id: string;
  criteria: string; // Comment on sait que l'événement s'est produit
  type: "NOTIFICATION" | "STATUS" | "DOCUMENT" | "ALERT" | "SCREEN" | "OTHER";
};

export type Risk = {
  id: string;
  event_id?: string;
  capability_id?: string;
  application_id?: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  mitigation?: string;
};

/* =======================
   Completion Map (vérité unique)
======================= */

export type CompletionMap = {
  actor: boolean;
  events: boolean;
  variants: boolean;
  policies: boolean;
  capabilities: boolean;
  applications: boolean;
  visibility: boolean;
  risks: boolean;
};

/* =======================
   Interview State Canonique
======================= */

export type InterviewState = {
  // Log conversationnel
  conversation_log: ConversationLogEntry[];
  
  // Entités Event Storming / DDD
  events: BusinessEvent[];
  variants: Variant[];
  actors: Actor[];
  commands: Command[];
  business_objects: BusinessObject[];
  policies: Policy[];
  capabilities: Capability[];
  applications: Application[];
  visibility: Visibility[];
  risks: Risk[];
  
  // Métadonnées
  process_id: string;
  process_name: string;
  created_at: string;
  updated_at: string;
  
  // Invariants (anti-boucle)
  invariants: {
    event_chain_confirmed: boolean;
    actors_captured: boolean;
    policies_validated: boolean;
    capabilities_validated: boolean;
  };
  
  // Completion map (vérité unique)
  completion_map: CompletionMap;
  
  // Phase actuelle
  current_phase: string;
  current_event_index?: number;
  current_question_id?: string; // ID de la question actuellement posée (anti-boucle)
  
  // Questions posées (anti-boucle)
  asked_questions: Set<string>; // IDs des questions déjà posées
};

/* =======================
   Helpers
======================= */

export function createEmptyInterviewState(processId: string, processName: string): InterviewState {
  return {
    conversation_log: [],
    events: [],
    variants: [],
    actors: [],
    commands: [],
    business_objects: [],
    policies: [],
    capabilities: [],
    applications: [],
    visibility: [],
    risks: [],
    process_id: processId,
    process_name: processName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    invariants: {
      event_chain_confirmed: false,
      actors_captured: false,
      policies_validated: false,
      capabilities_validated: false,
    },
    completion_map: {
      actor: false,
      events: false,
      variants: false,
      policies: false,
      capabilities: false,
      applications: false,
      visibility: false,
      risks: false,
    },
    current_phase: "PERIMETER",
    asked_questions: new Set(),
  };
}

export function isInterviewComplete(state: InterviewState): boolean {
  return Object.values(state.completion_map).every((v) => v === true);
}

export function updateCompletionMap(state: InterviewState): CompletionMap {
  return {
    actor: state.actors.length > 0 && state.events.every((e) => e.actor_id),
    events: state.events.length > 0 && state.events.every((e) => e.confirmed),
    variants: state.variants.length > 0 || state.events.some((e) => e.variant_ids.length > 0),
    policies: state.policies.length > 0 && state.events.some((e) => e.policy_ids.length > 0),
    capabilities: state.capabilities.some((c) => c.status === "VALIDATED" || c.status === "RENAMED"),
    applications: state.applications.length > 0 && state.events.some((e) => e.application_ids.length > 0),
    visibility: state.visibility.length > 0 || state.events.some((e) => e.visibility),
    risks: state.risks.length > 0, // Optionnel, peut être false
  };
}

