"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = "/api";

type Initiative = {
  id: string;
  title: string;
  type: "TRANSFORMATION" | "DECISION";
  criticality: "LOW" | "MEDIUM" | "HIGH";
  scope: string;
  objectives: string[];
  key_issues: string[];
  status: "DRAFT" | "ACTIVE" | "DONE" | "ARCHIVED";
  linked_process_ids: string[];
  linked_interview_ids: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
};

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/initiatives`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setInitiatives(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const criticalityColors = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
  };

  const statusColors = {
    DRAFT: "#64748b",
    ACTIVE: "#3b82f6",
    DONE: "#22c55e",
    ARCHIVED: "#94a3b8",
  };

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100%" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, marginBottom: 4 }}>
              Initiatives
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              Gérer les initiatives de transformation et de décision
            </p>
          </div>
          <Link
            href="/architect/initiatives/new"
            style={{
              padding: "10px 16px",
              background: "#0f172a",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            + Nouvelle initiative
          </Link>
        </div>

        {/* Error */}
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

        {/* Loading */}
        {loading && (
          <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
            Chargement…
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && initiatives.length === 0 && (
          <div
            style={{
              padding: 48,
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, color: "#64748b", marginBottom: 8 }}>
              Aucune initiative
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>
              Crée la première initiative pour commencer
            </div>
          </div>
        )}

        {/* List */}
        {!loading && !error && initiatives.length > 0 && (
          <div style={{ display: "grid", gap: 16 }}>
            {initiatives.map((init) => (
              <Link
                key={init.id}
                href={`/architect/initiatives/${init.id}`}
                style={{
                  display: "block",
                  padding: 20,
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  color: "#0f172a",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{init.title}</h2>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: criticalityColors[init.criticality] + "20",
                          color: criticalityColors[init.criticality],
                        }}
                      >
                        {init.criticality}
                      </span>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: statusColors[init.status] + "20",
                          color: statusColors[init.status],
                        }}
                      >
                        {init.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                      {init.scope}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      Type: {init.type} • Créée le {new Date(init.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
                {init.objectives.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                      Objectifs :
                    </div>
                    <div style={{ fontSize: 13, color: "#0f172a" }}>
                      {init.objectives.join(", ")}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

