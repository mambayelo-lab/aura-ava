"use client";

import { useEffect, useState } from "react";

const API = "/api";

export default function ArchitecturePage() {
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [architecture, setArchitecture] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"capabilities" | "static" | "dynamic" | "coverage" | "integration">("capabilities");

  useEffect(() => {
    fetch(`${API}/initiatives`)
      .then((r) => r.json())
      .then(setInitiatives)
      .catch(() => setInitiatives([]));

    fetch(`${API}/process`)
      .then((r) => r.json())
      .then(setProcesses)
      .catch(() => setProcesses([]));
  }, []);

  const handleGenerate = async () => {
    if (!selectedInitiativeId && !selectedProcessId) {
      setError("Sélectionnez une initiative ou un processus");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/architect/architecture/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiative_id: selectedInitiativeId,
          process_id: selectedProcessId,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Erreur ${res.status}: ${txt}`);
      }

      const pkg = await res.json();
      setArchitecture(pkg);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100%" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>Génération d'architecture</h1>

        {/* Sélection */}
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Initiative</label>
              <select
                value={selectedInitiativeId || ""}
                onChange={(e) => {
                  setSelectedInitiativeId(e.target.value || null);
                  setSelectedProcessId(null);
                }}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              >
                <option value="">— Aucune —</option>
                {initiatives.map((init) => (
                  <option key={init.id} value={init.id}>
                    {init.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Processus</label>
              <select
                value={selectedProcessId || ""}
                onChange={(e) => {
                  setSelectedProcessId(e.target.value || null);
                  setSelectedInitiativeId(null);
                }}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              >
                <option value="">— Aucun —</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || (!selectedInitiativeId && !selectedProcessId)}
            style={{
              padding: "12px 24px",
              background: loading ? "#94a3b8" : "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Génération..." : "Générer (v0)"}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 8,
              color: "#7c2d12",
              marginBottom: 16,
            }}
          >
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {architecture && (
          <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
              {(["capabilities", "static", "dynamic", "coverage", "integration"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 16px",
                    background: activeTab === tab ? "#0f172a" : "transparent",
                    color: activeTab === tab ? "#fff" : "#0f172a",
                    border: "none",
                    borderBottom: activeTab === tab ? "2px solid #0f172a" : "2px solid transparent",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {tab === "capabilities" && "Capabilities"}
                  {tab === "static" && "Fonctionnelle statique"}
                  {tab === "dynamic" && "Fonctionnelle dynamique"}
                  {tab === "coverage" && "Couverture applicative"}
                  {tab === "integration" && "Intégration"}
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === "capabilities" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Capability Map</h3>
                {architecture.capability_map?.L3?.map((cap: any) => (
                  <div
                    key={cap.id}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      background: "#f8fafc",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{cap.name}</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Confiance: {cap.confidence}% • Status: {cap.status}
                        </div>
                      </div>
                      <div>
                        <button
                          style={{
                            padding: "6px 12px",
                            background: "#22c55e",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            marginRight: 8,
                          }}
                        >
                          Valider
                        </button>
                        <button
                          style={{
                            padding: "6px 12px",
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "static" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Fonctionnelle statique</h3>
                <pre
                  style={{
                    padding: 16,
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    overflow: "auto",
                    fontSize: 12,
                  }}
                >
                  {architecture.functional_static_mermaid}
                </pre>
                <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                  (Rendu Mermaid à implémenter en v1)
                </div>
              </div>
            )}

            {activeTab === "dynamic" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Fonctionnelle dynamique</h3>
                <pre
                  style={{
                    padding: 16,
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    overflow: "auto",
                    fontSize: 12,
                  }}
                >
                  {architecture.functional_dynamic_mermaid}
                </pre>
              </div>
            )}

            {activeTab === "coverage" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Couverture applicative</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: 12, textAlign: "left" }}>Capability</th>
                      <th style={{ padding: 12, textAlign: "left" }}>Applications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(architecture.app_coverage || {}).map(([capId, apps]: [string, any]) => (
                      <tr key={capId} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: 12 }}>{capId}</td>
                        <td style={{ padding: 12 }}>{Array.isArray(apps) ? apps.join(", ") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "integration" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Intégration</h3>
                <pre
                  style={{
                    padding: 16,
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    overflow: "auto",
                    fontSize: 12,
                  }}
                >
                  {architecture.integration_mermaid}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

