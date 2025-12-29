"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InitiativeForm from "../components/InitiativeForm";
import DecisionGuidePanel from "../components/DecisionGuidePanel";

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

export default function InitiativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`${API}/initiatives/${id}`).then((r) => r.json()),
      fetch(`${API}/initiatives/${id}/overview`).then((r) => r.json()),
    ])
      .then(([init, ov]) => {
        setInitiative(init);
        setOverview(ov);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const handleUpdate = async (data: any) => {
    try {
      const res = await fetch(`${API}/initiatives/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const updated = await res.json();
      setInitiative(updated);
      setEditing(false);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la mise à jour");
    }
  };

  const handleCreateInterview = async () => {
    const name = window.prompt("Nom du processus/interview ?");
    if (!name) return;

    try {
      const res = await fetch(`${API}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, initiative_id: id }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const process = await res.json();

      // Lier le process à l'initiative
      await fetch(`${API}/initiatives/${id}/link_process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ process_id: process.id }),
      });

      // Rediriger vers l'interview
      router.push(`/?process_id=${process.id}&initiative_id=${id}`);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la création");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
        Chargement…
      </div>
    );
  }

  if (error || !initiative) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            padding: 12,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 8,
            color: "#7c2d12",
          }}
        >
          <strong>Erreur :</strong> {error || "Initiative non trouvée"}
        </div>
      </div>
    );
  }

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
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 400px", gap: 24 }}>
        {/* Main content */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
            <div>
              <Link
                href="/architect/initiatives"
                style={{ color: "#64748b", textDecoration: "none", fontSize: 14, marginBottom: 8, display: "block" }}
              >
                ← Retour aux initiatives
              </Link>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, marginBottom: 8 }}>
                {initiative.title}
              </h1>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: criticalityColors[initiative.criticality] + "20",
                    color: criticalityColors[initiative.criticality],
                  }}
                >
                  {initiative.criticality}
                </span>
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: statusColors[initiative.status] + "20",
                    color: statusColors[initiative.status],
                  }}
                >
                  {initiative.status}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {initiative.type}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: "8px 16px",
                background: editing ? "#f1f5f9" : "#0f172a",
                color: editing ? "#0f172a" : "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {editing ? "Annuler" : "Modifier"}
            </button>
          </div>

          {editing ? (
            <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb" }}>
              <InitiativeForm
                onSubmit={handleUpdate}
                initialData={initiative}
                submitLabel="Enregistrer"
              />
            </div>
          ) : (
            <>
              <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Périmètre</h2>
                <p style={{ color: "#0f172a", lineHeight: 1.6 }}>{initiative.scope}</p>
              </div>

              {initiative.objectives.length > 0 && (
                <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Objectifs</h2>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {initiative.objectives.map((obj, i) => (
                      <li key={i} style={{ marginBottom: 8, color: "#0f172a" }}>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {initiative.key_issues.length > 0 && (
                <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Enjeux clés</h2>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {initiative.key_issues.map((issue, i) => (
                      <li key={i} style={{ marginBottom: 8, color: "#0f172a" }}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {overview && (
                <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Éléments liés</h2>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <strong>Processus :</strong> {overview.summary?.processes_count || 0}
                    </div>
                    <div>
                      <strong>Interviews :</strong> {overview.summary?.interviews_count || 0}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right panel */}
        <div>
          <DecisionGuidePanel initiative={initiative} overview={overview} onCreateInterview={handleCreateInterview} />
        </div>
      </div>
    </div>
  );
}

