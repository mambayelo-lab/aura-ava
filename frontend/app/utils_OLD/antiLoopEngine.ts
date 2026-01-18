/**
 * Moteur Anti-Boucle pour AVA Interview
 * 
 * Garantit qu'une question ne peut être posée qu'une seule fois par état
 * Les invariants validés sont figés
 */

import type { InterviewState } from "../types/interviewState";

export type QuestionId = string;

/**
 * Génère un ID unique pour une question basé sur la phase et le contexte
 */
export function generateQuestionId(
  phase: string,
  context?: {
    eventIndex?: number;
    eventId?: string;
    capabilityIndex?: number;
  }
): QuestionId {
  const parts = [phase];
  if (context?.eventIndex !== undefined) parts.push(`event_${context.eventIndex}`);
  if (context?.eventId) parts.push(context.eventId);
  if (context?.capabilityIndex !== undefined) parts.push(`cap_${context.capabilityIndex}`);
  return parts.join("_");
}

/**
 * Vérifie si une question peut être posée (anti-boucle)
 */
export function canAskQuestion(state: InterviewState | null, questionId: QuestionId): boolean {
  if (!state) return false;
  
  // Vérifier si la question a déjà été posée
  if (state.asked_questions.has(questionId)) {
    return false;
  }
  
  // Vérifier les invariants
  const phase = state.current_phase;
  
  // Si la chaîne est confirmée, on ne peut plus revenir à EVENT_CHAINING
  if (phase === "EVENT_CHAINING" && state.invariants.event_chain_confirmed) {
    return false;
  }
  
  // Si les acteurs sont capturés, on ne peut plus revenir à ACTORS_COMMANDS
  if (phase === "ACTORS_COMMANDS" && state.invariants.actors_captured) {
    return false;
  }
  
  // Si les policies sont validées, on ne peut plus revenir à EVENT_POLICIES
  if (phase === "EVENT_POLICIES" && state.invariants.policies_validated) {
    return false;
  }
  
  // Si les capabilities sont validées, on ne peut plus revenir à CAPABILITY_CONFIRMATION
  if (phase === "CAPABILITY_CONFIRMATION" && state.invariants.capabilities_validated) {
    return false;
  }
  
  return true;
}

/**
 * Vérifie si on peut revenir à une phase précédente
 */
export function canReturnToPhase(state: InterviewState | null, targetPhase: string): boolean {
  if (!state) return false;
  
  // Si la chaîne est confirmée, on ne peut plus revenir à EVENT_CHAINING
  if (targetPhase === "EVENT_CHAINING" && state.invariants.event_chain_confirmed) {
    return false;
  }
  
  // Si les acteurs sont capturés, on ne peut plus revenir à ACTORS_COMMANDS
  if (targetPhase === "ACTORS_COMMANDS" && state.invariants.actors_captured) {
    return false;
  }
  
  // Si les policies sont validées, on ne peut plus revenir à EVENT_POLICIES
  if (targetPhase === "EVENT_POLICIES" && state.invariants.policies_validated) {
    return false;
  }
  
  // Si les capabilities sont validées, on ne peut plus revenir à CAPABILITY_CONFIRMATION
  if (targetPhase === "CAPABILITY_CONFIRMATION" && state.invariants.capabilities_validated) {
    return false;
  }
  
  return true;
}

