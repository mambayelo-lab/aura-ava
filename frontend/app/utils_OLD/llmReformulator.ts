/**
 * LLM Wrapper pour reformulation uniquement
 * 
 * STRICTEMENT ENCADRÉ :
 * - Le LLM ne décide JAMAIS de la prochaine étape
 * - Le LLM ne modifie JAMAIS la structure
 * - Le LLM reformule uniquement pour améliorer la clarté
 */

type ReformulationContext = {
  processName: string;
  events: Array<{ label: string; order: number }>;
  currentPhase?: string;
};

/**
 * Reformule une question canonique en langage naturel plus fluide
 * 
 * @param canonicalQuestion - Question fixe du moteur déterministe
 * @param context - Contexte (nom du processus, événements capturés)
 * @returns Question reformulée (ou question originale si LLM indisponible)
 */
export async function reformulateQuestion(
  canonicalQuestion: string,
  context: ReformulationContext
): Promise<string> {
  // Fallback si pas de LLM disponible
  if (typeof window === "undefined") {
    return canonicalQuestion;
  }

  // TODO: Intégrer avec API LLM (OpenAI, Anthropic, etc.)
  // Pour l'instant, retourner la question originale avec amélioration simple
  
  // Amélioration simple (sans LLM) : personnaliser avec le nom du processus
  if (context.processName && canonicalQuestion.includes("ce périmètre")) {
    return canonicalQuestion.replace("ce périmètre", `le périmètre "${context.processName}"`);
  }
  
  if (context.processName && canonicalQuestion.includes("dans ce périmètre")) {
    return canonicalQuestion.replace("dans ce périmètre", `dans le périmètre "${context.processName}"`);
  }

  return canonicalQuestion;
}

/**
 * Reformule la réponse utilisateur pour confirmation
 * 
 * @param userAnswer - Réponse brute de l'utilisateur
 * @param phase - Phase courante de l'interview
 * @returns Réponse reformulée pour confirmation
 */
export async function reformulateAnswer(
  userAnswer: string,
  phase: string
): Promise<string> {
  // Fallback si pas de LLM disponible
  if (typeof window === "undefined") {
    return userAnswer;
  }

  // TODO: Intégrer avec API LLM pour reformulation intelligente
  // Pour l'instant, retourner la réponse originale
  
  // Amélioration simple : nettoyer les espaces et capitaliser
  const cleaned = userAnswer.trim();
  if (cleaned.length === 0) return cleaned;
  
  // Capitaliser la première lettre si nécessaire
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Génère un résumé lisible en langage naturel
 * 
 * @param events - Liste des événements capturés
 * @param processName - Nom du processus/périmètre
 * @returns Résumé en langage naturel
 */
export async function generateSummary(
  events: Array<{ label: string; order: number; variant?: string; application?: string; observability?: string; policy?: string }>,
  processName: string
): Promise<string> {
  // Fallback si pas de LLM disponible
  if (typeof window === "undefined") {
    return generateSimpleSummary(events, processName);
  }

  // TODO: Intégrer avec API LLM pour résumé intelligent
  // Pour l'instant, utiliser le résumé simple
  
  return generateSimpleSummary(events, processName);
}

/**
 * Génère un résumé simple sans LLM (fallback)
 */
function generateSimpleSummary(
  events: Array<{ label: string; order: number; variant?: string; application?: string; observability?: string; policy?: string }>,
  processName: string
): string {
  const sortedEvents = [...events].sort((a, b) => a.order - b.order);
  
  let summary = `Dans le périmètre "${processName}", ${sortedEvents.length} événement(s) métier ont été identifiés :\n\n`;
  
  sortedEvents.forEach((event, i) => {
    summary += `${i + 1}. ${event.label}\n`;
    if (event.application) {
      summary += `   → Réalisé avec : ${event.application}\n`;
    }
    if (event.observability) {
      summary += `   → On le sait par : ${event.observability}\n`;
    }
    if (event.variant) {
      summary += `   → Variante : ${event.variant}\n`;
    }
    if (event.policy) {
      summary += `   → Règle métier : ${event.policy}\n`;
    }
    summary += "\n";
  });
  
  return summary.trim();
}

