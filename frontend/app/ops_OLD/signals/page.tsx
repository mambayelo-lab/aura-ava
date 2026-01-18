"use client";

import { useEffect, useState } from "react";

const API = "/api";

type Signal = {
  id: string;
  title: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ACK" | "MITIGATED" | "RESOLVED" | "OBSOLETE";
  initiative_id?: string;
  impacted_capabilities?: string[];
  facts?: string[];
  reasoning?: string;
  created_at: string;
};

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/abp/signals`)
      .then((r) => r.json())
      .then((data) => {
        setSignals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setSignals([]);
        setLoading(false);
      });
  }, []);

  const severityColors = {
    INFO: "#3b82f6",
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
  };

  const statusColors = {
    OPEN: "#ef4444",
    ACK: "#f59e0b",
    MITIGATED: "#3b82f6",
    RESOLVED: "#22c55e",
    OBSOLETE: "#94a3b8",
  };

  const groupedBySeverity = signals.reduce((acc, s) => {
    if (!acc[s.severity]) acc[s.severity] = [];
    acc[s.severity].push(s);
    return acc;
  }, {} as Record<string, Signal[]>);

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100%", display: "grid", gridTemplateColumns: "1fr 400px", gap: 24 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Signals</h1>
          <button
            onClick={() => {
              const title = window.prompt("Titre du signal ?");
              if (!title) return;
              const severity = window.prompt("Sévérité (INFO/LOW/MEDIUM/HIGH) ?", "MEDIUM");
              if (!severity) return;

              fetch(`${API}/signals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, severity }),
              })
                .then((r) => r.json())
                .then((newSignal) => {
                  setSignals([...signals, newSignal]);
                  setSelectedSignal(newSignal);
                })
                .catch(alert);
            }}
            style={{
              padding: "10px 16px",
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Nouveau Signal
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Chargement…</div>
        ) : signals.length === 0 ? (
          <div
            style={{
              padding: 48,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, color: "#64748b" }}>Aucun signal</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {(["HIGH", "MEDIUM", "LOW", "INFO"] as const).map((sev) => {
              const group = groupedBySeverity[sev] || [];
              if (group.length === 0) return null;

              return (
                <div key={sev} style={{ background: "#ffffff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: severityColors[sev],
                      marginBottom: 12,
                    }}
                  >
                    {sev} ({group.length})
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {group.map((signal) => (
                      <div
                        key={signal.id}
                        onClick={() => setSelectedSignal(signal)}
                        style={{
                          padding: 12,
                          background: selectedSignal?.id === signal.id ? "#f1f5f9" : "#f8fafc",
                          borderRadius: 8,
                          border: `1px solid ${selectedSignal?.id === signal.id ? "#0f172a" : "#e5e7eb"}`,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{signal.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {signal.status} • {new Date(signal.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel */}
      {selectedSignal && (
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>{selectedSignal.title}</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Sévérité</div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  background: severityColors[selectedSignal.severity] + "20",
                  color: severityColors[selectedSignal.severity],
                }}
              >
                {selectedSignal.severity}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Status</div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  background: statusColors[selectedSignal.status] + "20",
                  color: statusColors[selectedSignal.status],
                }}
              >
                {selectedSignal.status}
              </div>
            </div>
            {selectedSignal.reasoning && (
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Raisonnement</div>
                <div style={{ fontSize: 14 }}>{selectedSignal.reasoning}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Créé le</div>
              <div style={{ fontSize: 14 }}>{new Date(selectedSignal.created_at).toLocaleString("fr-FR")}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

