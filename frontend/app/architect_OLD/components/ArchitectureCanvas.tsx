"use client";

import { useEffect, useState } from "react";
import MermaidDiagram from "./MermaidDiagram";

const API = "/api";

interface Interview {
  id: string;
  name: string;
  interview_data?: {
    events?: Array<{ label: string; order: number; application?: string; variant?: string; policy?: string }>;
    capabilities?: Array<{ id: string; name: string; status: string; confidence: number }>;
    applications?: Array<{ id: string; name: string; type: string }>;
    policies?: Array<{ id: string; rule: string; event_id: string }>;
  };
  compiled_at?: string;
}

interface ArchitectureCanvasProps {
  interview: Interview;
}

export default function ArchitectureCanvas({ interview }: ArchitectureCanvasProps) {
  const [architecture, setArchitecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"static" | "dynamic" | "integration">("static");

  useEffect(() => {
    if (!interview?.id) return;

    setLoading(true);
    setError(null);

    // Générer l'architecture depuis l'interview
    fetch(`${API}/architect/architecture/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        process_id: interview.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setArchitecture(data);
      })
      .catch((err) => {
        setError(err.message || "Erreur lors de la génération de l'architecture");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [interview?.id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Génération de l'architecture...</div>
        <div style={{ fontSize: 12 }}>Analyse des événements, capabilities et applications</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Erreur</div>
        <div style={{ fontSize: 12 }}>{error}</div>
      </div>
    );
  }

  if (!architecture) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 14 }}>Aucune architecture disponible</div>
      </div>
    );
  }

  const mermaidCode =
    activeView === "static"
      ? architecture.functional_static_mermaid || ""
      : activeView === "dynamic"
      ? architecture.functional_dynamic_mermaid || ""
      : architecture.integration_mermaid || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header avec sélecteur de vue */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{interview.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveView("static")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: activeView === "static" ? "#0f172a" : "#ffffff",
              color: activeView === "static" ? "#ffffff" : "#0f172a",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Statique
          </button>
          <button
            onClick={() => setActiveView("dynamic")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: activeView === "dynamic" ? "#0f172a" : "#ffffff",
              color: activeView === "dynamic" ? "#ffffff" : "#0f172a",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Dynamique
          </button>
          <button
            onClick={() => setActiveView("integration")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: activeView === "integration" ? "#0f172a" : "#ffffff",
              color: activeView === "integration" ? "#ffffff" : "#0f172a",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Intégration
          </button>
        </div>
      </div>

      {/* Zone de rendu Mermaid */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <MermaidDiagram
          mermaidCode={mermaidCode}
          title={
            activeView === "static"
              ? "Vue fonctionnelle statique"
              : activeView === "dynamic"
              ? "Vue fonctionnelle dynamique"
              : "Vue d'intégration"
          }
        />
      </div>

      {/* Informations supplémentaires */}
      {architecture.capability_map && (
        <div style={{ padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
            Capabilities identifiées
          </div>
          <div style={{ fontSize: 12, color: "#0f172a" }}>
            {Object.keys(architecture.capability_map).length} niveau(x) de capabilities
          </div>
        </div>
      )}
    </div>
  );
}

