/**
 * State Machine Déterministe pour AVA
 * 
 * RÈGLE ABSOLUE : Pas de LLM dans les transitions
 * Toutes les décisions sont basées sur des règles explicites
 */

import type { InterviewPhase, Process } from "../types/canonical";

export type StateMachineAction =
  | "next"
  | "back"
  | "confirm"
  | "reject"
  | "finish_chaining"
  | "start_variants"
  | "start_actors_commands"
  | "start_policies"
  | "start_applications"
  | "start_data_integrations"
  | "start_capabilities"
  | "inference_complete"
  | "capabilities_validated"
  | "complete"
  | "submit";

export type StateMachineContext = {
  eventsCount?: number;
  chainConfirmed?: boolean;
  currentEventIndex?: number;
  allEventsProcessed?: boolean;
  allVariantsProcessed?: boolean;
  allPoliciesProcessed?: boolean;
  allApplicationsProcessed?: boolean;
};

/**
 * Transition déterministe entre phases
 * 
 * RÈGLES :
 * - Une seule question par phase
 * - Condition d'entrée vérifiée
 * - Condition de sortie vérifiée avant transition
 * - Pas de boucle
 */
export function transitionPhase(
  currentPhase: InterviewPhase,
  action: StateMachineAction,
  process: Process,
  context?: StateMachineContext
): InterviewPhase {
  // Import dynamique pour éviter les dépendances circulaires
  const { PHASE_CONDITIONS } = require("../types/canonical");

  // Vérifier condition d'entrée
  const currentCondition = PHASE_CONDITIONS[currentPhase];
  if (!currentCondition.entry(process)) {
    // Si condition d'entrée non remplie, rester dans la phase précédente valide
    return getPreviousValidPhase(currentPhase, process);
  }

  switch (currentPhase) {
    case "PERIMETER":
      if (action === "next" && process.name) {
        return "EVENT_CAPTURE";
      }
      return currentPhase;

    case "EVENT_CAPTURE":
      if (action === "next" && process.events.length >= 1) {
        return "EVENT_CHAINING";
      }
      return currentPhase;

    case "EVENT_CHAINING":
      if (action === "finish_chaining" && process.events.length >= 1) {
        return "CHAIN_VISUAL_CONFIRM";
      }
      return currentPhase;

    case "CHAIN_VISUAL_CONFIRM":
      if (action === "confirm" && context?.chainConfirmed) {
        return "EVENT_VARIANTS";
      }
      if (action === "reject") {
        return "EVENT_CHAINING";
      }
      return currentPhase;

    case "EVENT_VARIANTS":
      if (action === "start_actors_commands" && context?.allVariantsProcessed) {
        return "ACTORS_COMMANDS";
      }
      return currentPhase;

    case "ACTORS_COMMANDS":
      if (action === "start_policies" && process.events.every((e) => e.actor_id && e.command_id)) {
        return "POLICIES";
      }
      return currentPhase;

    case "POLICIES":
      if (action === "start_capabilities" && context?.allPoliciesProcessed) {
        return "CAPABILITIES";
      }
      return currentPhase;

    case "CAPABILITIES":
      if (action === "inference_complete") {
        return "CAPABILITIES"; // Reste dans la phase pour validation
      }
      if (action === "capabilities_validated" && process.capabilities.some((c) => c.status === "VALIDATED" || c.status === "RENAMED")) {
        return "APPLICATIONS";
      }
      return currentPhase;

    case "APPLICATIONS":
      if (action === "start_data_integrations" && context?.allApplicationsProcessed) {
        return "DATA_INTEGRATIONS";
      }
      return currentPhase;

    case "DATA_INTEGRATIONS":
      if (action === "complete") {
        return "COMPLETENESS_CHECK";
      }
      return currentPhase;

    case "COMPLETENESS_CHECK":
      if (action === "complete" && Object.values(process.completion_9q).every((v) => v === true)) {
        return "SUBMISSION_READY";
      }
      return currentPhase;

    case "SUBMISSION_READY":
      // Pas de sortie, c'est la phase finale
      return currentPhase;

    default:
      return currentPhase;
  }
}

/**
 * Trouve la phase précédente valide si la condition d'entrée n'est pas remplie
 */
function getPreviousValidPhase(phase: InterviewPhase, process: Process): InterviewPhase {
  const phaseOrder: InterviewPhase[] = [
    "PERIMETER",
    "EVENT_CAPTURE",
    "EVENT_CHAINING",
    "CHAIN_VISUAL_CONFIRM",
    "EVENT_VARIANTS",
    "ACTORS_COMMANDS",
    "POLICIES",
    "CAPABILITIES",
    "APPLICATIONS",
    "DATA_INTEGRATIONS",
    "COMPLETENESS_CHECK",
    "SUBMISSION_READY",
  ];

  const currentIndex = phaseOrder.indexOf(phase);
  if (currentIndex <= 0) return "PERIMETER";

  // Remonter jusqu'à trouver une phase valide
  for (let i = currentIndex - 1; i >= 0; i--) {
    const candidatePhase = phaseOrder[i];
    const { PHASE_CONDITIONS } = require("../types/canonical");
    if (PHASE_CONDITIONS[candidatePhase].entry(process)) {
      return candidatePhase;
    }
  }

  return "PERIMETER";
}

/**
 * Vérifie si une phase peut être quittée
 */
export function canExitPhase(phase: InterviewPhase, process: Process, context?: StateMachineContext): boolean {
  const { PHASE_CONDITIONS } = require("../types/canonical");
  const condition = PHASE_CONDITIONS[phase];
  return condition.exit(process);
}

/**
 * Vérifie si une phase peut être entrée
 */
export function canEnterPhase(phase: InterviewPhase, process: Process): boolean {
  const { PHASE_CONDITIONS } = require("../types/canonical");
  const condition = PHASE_CONDITIONS[phase];
  return condition.entry(process);
}

