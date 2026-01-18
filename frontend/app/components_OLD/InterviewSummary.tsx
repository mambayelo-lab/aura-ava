/**
 * Résumé structuré éditable (colonne droite)
 * 
 * Affiche et permet d'éditer les éléments capturés
 */

import type { InterviewState } from "../types/interviewState";

interface InterviewSummaryProps {
  state: InterviewState | null;
  onEdit?: (type: string, id: string, field: string, value: string) => void;
}

export default function InterviewSummary({ state, onEdit }: InterviewSummaryProps) {
  if (!state) {
    return (
      <div style={{ padding: 20, color: "#64748b", textAlign: "center" }}>
        Aucune donnée capturée
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "100vh", overflowY: "auto" }}>
      {/* Événements */}
      {state.events.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            ⚡ Événements ({state.events.length})
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {state.events
              .sort((a, b) => a.order - b.order)
              .map((event, idx) => (
                <div
                  key={event.id}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: event.confirmed ? "#ecfdf5" : "#f8fafc",
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>
                    {idx + 1}. {event.label}
                  </div>
                  {event.actor_id && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      👤 {state.actors.find((a) => a.id === event.actor_id)?.name || "Acteur"}
                    </div>
                  )}
                  {event.application_ids.length > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      🖥️ {event.application_ids.map((appId) => state.applications.find((a) => a.id === appId)?.name).filter(Boolean).join(", ")}
                    </div>
                  )}
                  {event.policy_ids.length > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      📜 {event.policy_ids.length} règle(s)
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Acteurs */}
      {state.actors.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            👤 Acteurs ({state.actors.length})
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {state.actors.map((actor) => (
              <div
                key={actor.id}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  fontSize: 12,
                  color: "#0f172a",
                }}
              >
                {actor.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capabilities */}
      {state.capabilities.filter((c) => c.status === "VALIDATED" || c.status === "RENAMED").length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            🧠 Capabilities ({state.capabilities.filter((c) => c.status === "VALIDATED" || c.status === "RENAMED").length})
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {state.capabilities
              .filter((c) => c.status === "VALIDATED" || c.status === "RENAMED")
              .map((cap) => (
                <div
                  key={cap.id}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                    fontSize: 12,
                    color: "#0f172a",
                  }}
                >
                  {cap.validated_name || cap.name}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Applications */}
      {state.applications.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            🖥️ Applications ({state.applications.length})
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {state.applications.map((app) => (
              <div
                key={app.id}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  fontSize: 12,
                  color: "#0f172a",
                }}
              >
                {app.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies */}
      {state.policies.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            📜 Règles métier ({state.policies.length})
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {state.policies.map((policy) => (
              <div
                key={policy.id}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  fontSize: 12,
                  color: "#0f172a",
                }}
              >
                {policy.rule}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

