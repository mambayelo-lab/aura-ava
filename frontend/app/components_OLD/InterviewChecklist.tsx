/**
 * Checklist dynamique des étapes (colonne gauche)
 * 
 * Affiche la progression de l'interview avec indicateurs visuels
 */

import type { InterviewState, CompletionMap } from "../types/interviewState";

interface InterviewChecklistProps {
  state: InterviewState | null;
  currentPhase: string;
  onPhaseClick?: (phase: string) => void;
}

const PHASES = [
  { key: "PERIMETER", label: "Périmètre", icon: "📍" },
  { key: "EVENT_CAPTURE", label: "Capture événements", icon: "⚡" },
  { key: "CHAIN_VISUAL_CONFIRM", label: "Confirmation chaîne", icon: "✅" },
  { key: "ACTORS_COMMANDS", label: "Acteurs & Commandes", icon: "👤" },
  { key: "EVENT_POLICIES", label: "Règles métier", icon: "📜" },
  { key: "EVENT_APPLICATIONS", label: "Applications", icon: "🖥️" },
  { key: "CAPABILITY_CONFIRMATION", label: "Capabilities", icon: "🧠" },
  { key: "COMPLETENESS_CHECK", label: "Vérification", icon: "🔍" },
  { key: "SUBMISSION_READY", label: "Soumission", icon: "🚀" },
];

export default function InterviewChecklist({ state, currentPhase, onPhaseClick }: InterviewChecklistProps) {
  if (!state) {
    return (
      <div style={{ padding: 20, color: "#64748b", textAlign: "center" }}>
        Sélectionnez un processus pour commencer
      </div>
    );
  }

  const getPhaseStatus = (phaseKey: string): "completed" | "current" | "pending" => {
    if (phaseKey === currentPhase) return "current";
    
    const phaseIndex = PHASES.findIndex((p) => p.key === phaseKey);
    const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);
    
    if (phaseIndex < currentIndex) return "completed";
    return "pending";
  };

  const getCompletionStatus = (phaseKey: string, completionMap: CompletionMap): boolean => {
    switch (phaseKey) {
      case "PERIMETER":
        return !!state?.process_name;
      case "EVENT_CAPTURE":
      case "CHAIN_VISUAL_CONFIRM":
        return completionMap.events;
      case "ACTORS_COMMANDS":
        return completionMap.actor;
      case "EVENT_POLICIES":
        return completionMap.policies;
      case "EVENT_APPLICATIONS":
        return completionMap.applications;
      case "CAPABILITY_CONFIRMATION":
        return completionMap.capabilities;
      case "COMPLETENESS_CHECK":
        return Object.values(completionMap).every((v) => v === true);
      default:
        return false;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
        Progression de l'interview
      </div>
      
      {PHASES.map((phase) => {
        const status = getPhaseStatus(phase.key);
        const isComplete = getCompletionStatus(phase.key, state.completion_map);
        const isClickable = onPhaseClick && (status === "current" || status === "completed");

        return (
          <button
            key={phase.key}
            onClick={() => isClickable && onPhaseClick?.(phase.key)}
            disabled={!isClickable}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${
                status === "current" ? "#0f172a" : status === "completed" ? "#10b981" : "#e5e7eb"
              }`,
              background:
                status === "current"
                  ? "#f8fafc"
                  : status === "completed"
                  ? "#ecfdf5"
                  : "#ffffff",
              color: status === "current" ? "#0f172a" : status === "completed" ? "#059669" : "#64748b",
              cursor: isClickable ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              fontWeight: status === "current" ? 700 : 400,
            }}
          >
            <div style={{ fontSize: 16 }}>{phase.icon}</div>
            <div style={{ flex: 1 }}>{phase.label}</div>
            {status === "completed" && (
              <div style={{ fontSize: 14 }}>✓</div>
            )}
            {status === "current" && (
              <div style={{ fontSize: 10, color: "#0f172a" }}>●</div>
            )}
          </button>
        );
      })}

      {/* Completion Map Summary */}
      <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
          Complétude
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {Object.entries(state.completion_map).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                color: value ? "#059669" : "#64748b",
              }}
            >
              <div style={{ fontSize: 12 }}>{value ? "✓" : "○"}</div>
              <div style={{ textTransform: "capitalize" }}>{key}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

