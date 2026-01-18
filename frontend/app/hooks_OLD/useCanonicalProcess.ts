/**
 * Hook pour gérer le Process canonique unifié
 * 
 * Ce hook synchronise Agent et Étapes sur le même modèle de données
 */

import { useState, useCallback, useMemo } from "react";
import type { Process, DomainEvent, Actor, Command, Policy, Capability, Application } from "../types/canonical";

const API = "/api";

/**
 * Convertit un Process legacy (mode Étapes) vers le modèle canonique
 */
function legacyToCanonical(legacy: any): Process {
  return {
    id: legacy.id,
    name: legacy.name,
    actors: [],
    commands: [],
    events: [],
    variants: [],
    policies: [],
    capabilities: [],
    applications: [],
    data_objects: [],
    integrations: [],
    created_at: legacy.created_at || new Date().toISOString(),
    updated_at: legacy.updated_at || new Date().toISOString(),
    submitted: legacy.submitted || false,
    submitted_at: legacy.submitted_at,
    completion_9q: {
      why: false,
      what: false,
      who: false,
      when: false,
      how: false,
      with_what: false,
      rules: false,
      variants: false,
      impacts: false,
    },
  };
}

/**
 * Convertit un Process canonique vers le format legacy (mode Étapes)
 */
function canonicalToLegacy(canonical: Process): any {
  // Mapper les événements vers les steps AVA
  const state: Record<string, string> = {};
  
  if (canonical.events.length > 0) {
    state.event = canonical.events[0].label;
  }
  
  if (canonical.actors.length > 0) {
    state.actor = canonical.actors[0].name;
  }
  
  if (canonical.commands.length > 0) {
    state.command = canonical.commands[0].name;
  }
  
  // Mapper les applications vers systems
  if (canonical.applications.length > 0) {
    state.systems = canonical.applications.map((a) => a.name).join(", ");
  }
  
  return {
    id: canonical.id,
    name: canonical.name,
    state,
  };
}

export function useCanonicalProcess(processId: string | null) {
  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le processus
  const loadProcess = useCallback(async () => {
    if (!processId) {
      setProcess(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/process/${processId}`);
      if (!res.ok) throw new Error("Process not found");
      
      const data = await res.json();
      // Convertir depuis le format legacy ou canonique
      const canonical = data.interview_data 
        ? data // Déjà au format canonique
        : legacyToCanonical(data);
      
      setProcess(canonical);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setProcess(null);
    } finally {
      setLoading(false);
    }
  }, [processId]);

  // Sauvegarder le processus
  const saveProcess = useCallback(async (updated: Process) => {
    if (!processId) return;

    try {
      // Sauvegarder au format canonique
      const res = await fetch(`${API}/process/${processId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_data: updated,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setProcess(updated);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [processId]);

  // Ajouter un événement
  const addEvent = useCallback(async (event: Omit<DomainEvent, "id" | "order" | "confirmed">) => {
    if (!process) return;

    const newEvent: DomainEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: process.events.length,
      confirmed: false,
    };

    const updated: Process = {
      ...process,
      events: [...process.events, newEvent],
      updated_at: new Date().toISOString(),
    };

    await saveProcess(updated);
  }, [process, saveProcess]);

  // Mettre à jour un événement
  const updateEvent = useCallback(async (eventId: string, updates: Partial<DomainEvent>) => {
    if (!process) return;

    const updated: Process = {
      ...process,
      events: process.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
      updated_at: new Date().toISOString(),
    };

    await saveProcess(updated);
  }, [process, saveProcess]);

  // Ajouter un acteur
  const addActor = useCallback(async (actor: Omit<Actor, "id">) => {
    if (!process) return;

    const newActor: Actor = {
      ...actor,
      id: `actor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updated: Process = {
      ...process,
      actors: [...process.actors, newActor],
      updated_at: new Date().toISOString(),
    };

    await saveProcess(updated);
  }, [process, saveProcess]);

  // Ajouter une policy
  const addPolicy = useCallback(async (policy: Omit<Policy, "id">) => {
    if (!process) return;

    const newPolicy: Policy = {
      ...policy,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updated: Process = {
      ...process,
      policies: [...process.policies, newPolicy],
      updated_at: new Date().toISOString(),
    };

    await saveProcess(updated);
  }, [process, saveProcess]);

  // Ajouter une application
  const addApplication = useCallback(async (application: Omit<Application, "id">) => {
    if (!process) return;

    const newApp: Application = {
      ...application,
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updated: Process = {
      ...process,
      applications: [...process.applications, newApp],
      updated_at: new Date().toISOString(),
    };

    await saveProcess(updated);
  }, [process, saveProcess]);

  // Mettre à jour les capabilities
  const updateCapabilities = useCallback(async (capabilities: Capability[]) => {
    if (!process) return;

    const updated: Process = {
      ...process,
      capabilities,
      updated_at: new Date().toISOString(),
    };

    await saveProcess(updated);
  }, [process, saveProcess]);

  // Calculer la complétude 9Q
  const completion9Q = useMemo(() => {
    if (!process) {
      return {
        why: false,
        what: false,
        who: false,
        when: false,
        how: false,
        with_what: false,
        rules: false,
        variants: false,
        impacts: false,
      };
    }

    return {
      why: process.events.length > 0, // Pourquoi : événements métier
      what: process.events.length > 0 && process.events.every((e) => e.confirmed), // Quoi : événements validés
      who: process.actors.length > 0 && process.events.every((e) => e.actor_id), // Qui : acteurs identifiés
      when: process.events.length > 0, // Quand : ordre des événements
      how: process.capabilities.some((c) => c.status === "VALIDATED" || c.status === "RENAMED"), // Comment : capabilities
      with_what: process.applications.length > 0, // Avec quoi : applications
      rules: process.policies.length > 0, // Règles : policies
      variants: process.variants.length > 0 || process.events.some((e) => e.variants && e.variants.length > 0), // Variantes
      impacts: process.integrations.length > 0, // Impacts : intégrations
    };
  }, [process]);

  // Mettre à jour la complétude 9Q
  const updateCompletion9Q = useCallback(async () => {
    if (!process) return;

    const updated: Process = {
      ...process,
      completion_9q: completion9Q,
      updated_at: new Date().toISOString(),
    };

    await saveProcess(updated);
  }, [process, completion9Q, saveProcess]);

  return {
    process,
    loading,
    error,
    loadProcess,
    saveProcess,
    addEvent,
    updateEvent,
    addActor,
    addPolicy,
    addApplication,
    updateCapabilities,
    completion9Q,
    updateCompletion9Q,
    // Format legacy pour compatibilité
    legacyFormat: process ? canonicalToLegacy(process) : null,
  };
}

