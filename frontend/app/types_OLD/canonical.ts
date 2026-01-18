/**
 * MODÈLE CANONIQUE DDD/Event Storming/9Q pour AVA
 * 
 * Ce modèle est la source de vérité unique pour Agent et Étapes
 */

/* =======================
   Entités cœur (DDD)
======================= */

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

export type DomainEvent = {
  id: string;
  label: string;
  order: number;
  confirmed: boolean;
  
  // Relations DDD
  actor_id?: string;
  command_id?: string;
  
  // Variantes
  variants?: Variant[];
  
  // Règles métier
  policies?: string[]; // IDs des policies
  
  // Applications
  applications?: string[]; // IDs des applications
  
  // Observabilité
  observability?: string;
  
  // Capabilities
  capability_ids?: string[];
  
  // Données
  data_objects?: string[]; // IDs des DataObject
  
  // Intégrations
  integration_ids?: string[];
};

export type Variant = {
  id: string;
  event_id: string;
  condition: string;
  consequence: string;
  type: "EXCEPTION" | "ALTERNATIVE" | "ERROR";
};

export type Policy = {
  id: string;
  event_id: string;
  rule: string;
  type: "THRESHOLD" | "CONTROL" | "OBLIGATION" | "CALCULATION" | "TEMPORAL" | "OTHER";
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
  name: string;
  type: "SYSTEM" | "TOOL" | "MANUAL" | "EXTERNAL";
  description?: string;
};

export type DataObject = {
  id: string;
  name: string;
  type: "ENTITY" | "VALUE_OBJECT" | "AGGREGATE";
  attributes?: string[];
  event_ids: string[]; // Événements qui produisent/modifient cette donnée
};

export type Integration = {
  id: string;
  source_application_id: string;
  target_application_id: string;
  data_flow: string[];
  event_ids: string[]; // Événements déclencheurs
  type: "API" | "FILE" | "MESSAGE" | "DATABASE";
};

/* =======================
   Modèle Process unifié
======================= */

export type Process = {
  id: string;
  name: string;
  
  // Modèle canonique
  actors: Actor[];
  commands: Command[];
  events: DomainEvent[];
  variants: Variant[];
  policies: Policy[];
  capabilities: Capability[];
  applications: Application[];
  data_objects: DataObject[];
  integrations: Integration[];
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  submitted: boolean;
  submitted_at?: string;
  
  // 9Q Completion
  completion_9q: {
    why: boolean;
    what: boolean;
    who: boolean;
    when: boolean;
    how: boolean;
    with_what: boolean;
    rules: boolean;
    variants: boolean;
    impacts: boolean;
  };
};

/* =======================
   Phases d'interview (ordre strict)
======================= */

export type InterviewPhase =
  | "PERIMETER"              // Phase 0 : Périmètre
  | "EVENT_CAPTURE"          // Phase 1 : Premier événement
  | "EVENT_CHAINING"         // Phase 1 : Chaîne d'événements
  | "CHAIN_VISUAL_CONFIRM"   // Phase 2 : Confirmation visuelle
  | "EVENT_VARIANTS"         // Phase 3 : Variantes
  | "ACTORS_COMMANDS"        // Phase 4 : Acteurs & Commandes (NOUVEAU)
  | "POLICIES"               // Phase 5 : Règles métier
  | "CAPABILITIES"           // Phase 6 : Capabilities
  | "APPLICATIONS"           // Phase 7 : Applications (CORRIGÉ)
  | "DATA_INTEGRATIONS"      // Phase 8 : Données & Intégrations (NOUVEAU)
  | "COMPLETENESS_CHECK"     // Phase 9 : Vérification 9Q
  | "SUBMISSION_READY";      // Phase 10 : Prêt à soumettre

/* =======================
   Conditions d'entrée/sortie par phase
======================= */

export type PhaseConditions = {
  entry: (process: Process) => boolean;
  exit: (process: Process) => boolean;
  question: string; // Question canonique unique
};

export type PhaseQuestionGenerator = (process: Process, context?: { eventIndex?: number; capabilityIndex?: number }) => string;

export const PHASE_CONDITIONS: Record<InterviewPhase, Omit<PhaseConditions, "question"> & { question: string | PhaseQuestionGenerator }> = {
  PERIMETER: {
    entry: () => true,
    exit: (p) => !!p.name,
    question: "Quel est le périmètre métier à analyser ?",
  },
  EVENT_CAPTURE: {
    entry: (p) => !!p.name,
    exit: (p) => p.events.length >= 1,
    question: "Quel est le premier fait métier important qui se produit ?",
  },
  EVENT_CHAINING: {
    entry: (p) => p.events.length >= 1,
    exit: (p) => false, // Sortie manuelle via "finish_chaining"
    question: (p, ctx) => {
      const lastEvent = p.events[p.events.length - 1];
      return `Une fois que "${lastEvent?.label || "cet événement"}" s'est produit, quel est le fait métier suivant qui se produit réellement ?`;
    },
  },
  CHAIN_VISUAL_CONFIRM: {
    entry: (p) => p.events.length >= 1,
    exit: (p) => p.events.every((e) => e.confirmed),
    question: "Cette séquence reflète-t-elle correctement la réalité métier ?",
  },
  EVENT_VARIANTS: {
    entry: (p) => p.events.every((e) => e.confirmed),
    exit: (p) => false, // Sortie manuelle via "start_actors_commands"
    question: (p, ctx) => {
      const event = p.events[ctx?.eventIndex ?? 0];
      return `Est-ce que "${event?.label || "cet événement"}" peut se produire autrement, échouer, ou poser problème ?`;
    },
  },
  ACTORS_COMMANDS: {
    entry: (p) => p.events.length >= 1,
    exit: (p) => p.events.every((e) => e.actor_id && e.command_id),
    question: (p, ctx) => {
      const event = p.events[ctx?.eventIndex ?? 0];
      return `Qui est à l'origine de "${event?.label || "cet événement"}" et quelle action déclenche ce fait métier ?`;
    },
  },
  POLICIES: {
    entry: (p) => p.events.length >= 1,
    exit: (p) => false, // Sortie manuelle
    question: (p, ctx) => {
      const event = p.events[ctx?.eventIndex ?? 0];
      return `Y a-t-il une règle métier, une condition ou une décision qui gouverne "${event?.label || "cet événement"}" ?`;
    },
  },
  CAPABILITIES: {
    entry: (p) => p.events.length >= 1,
    exit: (p) => p.capabilities.some((c) => c.status === "VALIDATED" || c.status === "RENAMED"),
    question: "Quelle capacité métier l'entreprise doit-elle avoir pour que ces événements se produisent correctement ?",
  },
  APPLICATIONS: {
    entry: (p) => p.capabilities.some((c) => c.status === "VALIDATED" || c.status === "RENAMED"),
    exit: (p) => {
      return p.capabilities
        .filter((c) => c.status === "VALIDATED" || c.status === "RENAMED")
        .every((c) => c.linked_applications.length > 0);
    },
    question: (p, ctx) => {
      const cap = p.capabilities[ctx?.capabilityIndex ?? 0];
      return `Avec quel outil ou application la capacité "${cap?.name || "cette capacité"}" est-elle réalisée aujourd'hui ?`;
    },
  },
  DATA_INTEGRATIONS: {
    entry: (p) => p.applications.length > 0,
    exit: (p) => false, // Sortie manuelle
    question: "Quelles données clés sont produites ou modifiées ? D'autres systèmes consomment-ils ou produisent-ils ces informations ?",
  },
  COMPLETENESS_CHECK: {
    entry: (p) => {
      return (
        p.events.length >= 1 &&
        p.events.every((e) => e.confirmed) &&
        p.policies.length >= 1 &&
        p.capabilities.some((c) => c.status === "VALIDATED" || c.status === "RENAMED") &&
        p.applications.length > 0
      );
    },
    exit: (p) => {
      return Object.values(p.completion_9q).every((v) => v === true);
    },
    question: "Vérification de complétude selon le framework 9Q",
  },
  SUBMISSION_READY: {
    entry: (p) => {
      return Object.values(p.completion_9q).every((v) => v === true);
    },
    exit: () => false,
    question: "L'interview est complète et prête à être soumise.",
  },
};

/**
 * Génère la question canonique pour une phase donnée
 */
export function getCanonicalQuestion(
  phase: InterviewPhase,
  process: Process,
  context?: { eventIndex?: number; capabilityIndex?: number }
): string {
  const condition = PHASE_CONDITIONS[phase];
  if (typeof condition.question === "string") {
    return condition.question;
  }
  return condition.question(process, context);
}

