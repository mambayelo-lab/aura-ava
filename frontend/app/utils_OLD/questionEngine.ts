/**
 * Moteur de Questions Déterministe
 * 
 * Définit les questions canoniques pour chaque phase
 * Une question = un état déterministe
 */

import type { InterviewState } from "../types/interviewState";
import { generateQuestionId } from "./antiLoopEngine";

export type QuestionContext = {
  eventIndex?: number;
  eventId?: string;
  capabilityIndex?: number;
  previousEventLabel?: string;
};

/**
 * Retourne la question canonique pour une phase donnée
 */
export function getCanonicalQuestionForPhase(
  phase: string,
  state: InterviewState | null,
  context?: QuestionContext
): { question: string; questionId: string } | null {
  if (!state) return null;

  const questionId = generateQuestionId(phase, context);

  switch (phase) {
    case "PERIMETER":
      return {
        question: "Quel est le périmètre métier à analyser ?",
        questionId,
      };

    case "EVENT_CAPTURE":
      return {
        question: "Quel est le premier fait métier important qui se produit dans ce périmètre ?",
        questionId,
      };

    case "EVENT_CHAINING":
      const previousEvent = context?.previousEventLabel || state.events[state.events.length - 1]?.label;
      return {
        question: previousEvent
          ? `Une fois que "${previousEvent}" s'est produit, quel est le fait métier suivant qui se produit réellement ?`
          : "Quel est le fait métier suivant qui se produit réellement ?",
        questionId,
      };

    case "CHAIN_VISUAL_CONFIRM":
      return {
        question: "Cette séquence reflète-t-elle correctement la réalité métier ?",
        questionId,
      };

    case "EVENT_VARIANTS":
      const eventForVariant = context?.eventId
        ? state.events.find((e) => e.id === context.eventId)
        : state.events[context?.eventIndex ?? 0];
      return {
        question: eventForVariant
          ? `Est-ce qu'il arrive que "${eventForVariant.label}" se produise autrement ou pose problème ?`
          : "Est-ce qu'il arrive que cet événement se produise autrement ou pose problème ?",
        questionId,
      };

    case "ACTORS_COMMANDS":
      const eventForActor = context?.eventId
        ? state.events.find((e) => e.id === context.eventId)
        : state.events[context?.eventIndex ?? 0];
      return {
        question: eventForActor
          ? `Qui est à l'origine de "${eventForActor.label}" et quelle action déclenche ce fait métier ?`
          : "Qui est à l'origine de cet événement et quelle action déclenche ce fait métier ?",
        questionId,
      };

    case "EVENT_POLICIES":
      const eventForPolicy = context?.eventId
        ? state.events.find((e) => e.id === context.eventId)
        : state.events[context?.eventIndex ?? 0];
      return {
        question: eventForPolicy
          ? `Qu'est-ce que l'entreprise doit absolument respecter ou vérifier quand "${eventForPolicy.label}" se produit ?`
          : "Qu'est-ce que l'entreprise doit absolument respecter ou vérifier à ce moment-là ?",
        questionId,
      };

    case "EVENT_APPLICATIONS":
      const eventForApp = context?.eventId
        ? state.events.find((e) => e.id === context.eventId)
        : state.events[context?.eventIndex ?? 0];
      return {
        question: eventForApp
          ? `Avec quel outil ou système le fait "${eventForApp.label}" est-il réalisé aujourd'hui ?`
          : "Avec quel outil ou système ce fait est-il réalisé aujourd'hui ?",
        questionId,
      };

    case "EVENT_OBSERVABILITY":
      const eventForObs = context?.eventId
        ? state.events.find((e) => e.id === context.eventId)
        : state.events[context?.eventIndex ?? 0];
      return {
        question: eventForObs
          ? `Comment sait-on que l'événement "${eventForObs.label}" a bien eu lieu ?`
          : "Comment sait-on que cet événement a bien eu lieu ?",
        questionId,
      };

    case "CAPABILITY_INFERENCE":
      return null; // Pas de question, phase automatique

    case "CAPABILITY_CONFIRMATION":
      return {
        question: "Est-ce que l'entreprise doit savoir faire ces choses dans ce périmètre ?",
        questionId,
      };

    case "COMPLETENESS_CHECK":
      return {
        question: "Vérification de complétude selon le framework 9Q. Tous les critères sont-ils remplis ?",
        questionId,
      };

    case "SUBMISSION_READY":
      return {
        question: "L'interview est complète et prête à être soumise.",
        questionId,
      };

    default:
      return null;
  }
}

