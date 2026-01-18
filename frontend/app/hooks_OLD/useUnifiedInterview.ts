/**
 * Hook unifié pour gérer l'Interview State Canonique
 * 
 * Remplace les deux modes (Agent/Étapes) par un seul moteur avec deux vues synchronisées
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  InterviewState,
  BusinessEvent,
  Actor,
  Command,
  BusinessObject,
  Policy,
  Capability,
  Application,
  Variant,
  Visibility,
  Risk,
  ConversationLogEntry,
  CompletionMap,
} from "../types/interviewState";
import {
  createEmptyInterviewState,
  isInterviewComplete,
  updateCompletionMap,
} from "../types/interviewState";

const API = "/api";

export function useUnifiedInterview(processId: string | null, processName: string) {
  const [state, setState] = useState<InterviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialiser ou charger l'état
  useEffect(() => {
    if (!processId || !processName) {
      setState(null);
      setLoading(false);
      return;
    }

    // Pour l'instant, créer un nouvel état vide
    // TODO: Charger depuis le backend si existe
    const newState = createEmptyInterviewState(processId, processName);
    setState(newState);
    setLoading(false);
  }, [processId, processName]);

  // Mettre à jour le completion map automatiquement
  useEffect(() => {
    if (state) {
      const updated = updateCompletionMap(state);
      setState((prev) => {
        if (!prev) return prev;
        return { ...prev, completion_map: updated, updated_at: new Date().toISOString() };
      });
    }
  }, [
    state?.events,
    state?.actors,
    state?.variants,
    state?.policies,
    state?.capabilities,
    state?.applications,
    state?.visibility,
    state?.risks,
  ]);

  // Ajouter une entrée au log conversationnel
  const addConversationLog = useCallback(
    (entry: Omit<ConversationLogEntry, "id" | "timestamp">) => {
      if (!state) return;
      const newEntry: ConversationLogEntry = {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          conversation_log: [...prev.conversation_log, newEntry],
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Ajouter un événement
  const addEvent = useCallback(
    (event: Omit<BusinessEvent, "id" | "order" | "confirmed" | "policy_ids" | "variant_ids" | "capability_ids" | "application_ids">) => {
      if (!state) return;
      const newEvent: BusinessEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        order: state.events.length,
        confirmed: false,
        policy_ids: [],
        variant_ids: [],
        capability_ids: [],
        application_ids: [],
      };
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: [...prev.events, newEvent],
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Mettre à jour un événement
  const updateEvent = useCallback(
    (eventId: string, updates: Partial<BusinessEvent>) => {
      if (!state) return;
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: prev.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Ajouter un acteur
  const addActor = useCallback(
    (actor: Omit<Actor, "id">) => {
      if (!state) return;
      const newActor: Actor = {
        ...actor,
        id: `actor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          actors: [...prev.actors, newActor],
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Ajouter une commande
  const addCommand = useCallback(
    (command: Omit<Command, "id">) => {
      if (!state) return;
      const newCommand: Command = {
        ...command,
        id: `command_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          commands: [...prev.commands, newCommand],
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Ajouter une policy
  const addPolicy = useCallback(
    (policy: Omit<Policy, "id">) => {
      if (!state) return;
      const newPolicy: Policy = {
        ...policy,
        id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      setState((prev) => {
        if (!prev) return prev;
        // Lier la policy à l'événement
        const updatedEvents = prev.events.map((e) =>
          e.id === policy.event_id ? { ...e, policy_ids: [...e.policy_ids, newPolicy.id] } : e
        );
        return {
          ...prev,
          policies: [...prev.policies, newPolicy],
          events: updatedEvents,
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Ajouter une application
  const addApplication = useCallback(
    (application: Omit<Application, "id" | "event_ids">) => {
      if (!state) return;
      const newApp: Application = {
        ...application,
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event_ids: [],
      };
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          applications: [...prev.applications, newApp],
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Lier une application à un événement
  const linkApplicationToEvent = useCallback(
    (applicationId: string, eventId: string) => {
      if (!state) return;
      setState((prev) => {
        if (!prev) return prev;
        const updatedEvents = prev.events.map((e) =>
          e.id === eventId
            ? { ...e, application_ids: [...e.application_ids, applicationId] }
            : e
        );
        const updatedApps = prev.applications.map((a) =>
          a.id === applicationId ? { ...a, event_ids: [...a.event_ids, eventId] } : a
        );
        return {
          ...prev,
          events: updatedEvents,
          applications: updatedApps,
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Ajouter une capability
  const addCapability = useCallback(
    (capability: Omit<Capability, "id" | "linked_applications" | "linked_events">) => {
      if (!state) return;
      const newCap: Capability = {
        ...capability,
        id: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        linked_applications: [],
        linked_events: [],
      };
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          capabilities: [...prev.capabilities, newCap],
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Mettre à jour une capability
  const updateCapability = useCallback(
    (capabilityId: string, updates: Partial<Capability>) => {
      if (!state) return;
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          capabilities: prev.capabilities.map((c) => (c.id === capabilityId ? { ...c, ...updates } : c)),
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Marquer un invariant comme validé
  const setInvariant = useCallback(
    (key: keyof InterviewState["invariants"], value: boolean) => {
      if (!state) return;
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          invariants: { ...prev.invariants, [key]: value },
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Vérifier si une question a déjà été posée (anti-boucle)
  const hasQuestionBeenAsked = useCallback(
    (questionId: string) => {
      if (!state) return false;
      return state.asked_questions.has(questionId);
    },
    [state]
  );

  // Marquer une question comme posée (anti-boucle)
  const markQuestionAsAsked = useCallback(
    (questionId: string) => {
      if (!state) return;
      setState((prev) => {
        if (!prev) return prev;
        const newSet = new Set(prev.asked_questions);
        newSet.add(questionId);
        return {
          ...prev,
          asked_questions: newSet,
          current_question_id: questionId,
          updated_at: new Date().toISOString(),
        };
      });
    },
    [state]
  );

  // Sauvegarder l'état
  const saveState = useCallback(async () => {
    if (!state || !processId) return;
    try {
      await fetch(`${API}/process/${processId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_state: state,
        }),
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde");
    }
  }, [state, processId]);

  // Soumettre l'interview
  const submitInterview = useCallback(async () => {
    if (!state || !isInterviewComplete(state)) {
      throw new Error("L'interview n'est pas complète. Tous les critères de completion_map doivent être remplis.");
    }

    try {
      const response = await fetch(`${API}/interview/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          process_id: state.process_id,
          interview_state: state,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Erreur soumission (${response.status}) : ${errorText}`);
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la soumission");
      throw err;
    }
  }, [state]);

  const isComplete = useMemo(() => {
    if (!state) return false;
    return isInterviewComplete(state);
  }, [state]);

  return {
    state,
    loading,
    error,
    isComplete,
    addConversationLog,
    addEvent,
    updateEvent,
    addActor,
    addCommand,
    addPolicy,
    addApplication,
    linkApplicationToEvent,
    addCapability,
    updateCapability,
    setInvariant,
    hasQuestionBeenAsked,
    markQuestionAsAsked,
    saveState,
    submitInterview,
    setState, // Pour les mises à jour directes si nécessaire
  };
}

