"use client";

import { useEffect, useMemo, useState } from "react";
import InterviewList from "./components/InterviewList";
import ArchitectureCanvas from "./components/ArchitectureCanvas";
import MermaidDiagram from "./components/MermaidDiagram";
import MappingMatrix from "./components/MappingMatrix";

const API = "/api";

/* =======================
   Types
======================= */

type Process = {
  id: string;
  name: string;
  state?: any;
  interview_data?: any;
  compiled_at?: string;
};

type ActiveView = "inventory" | "capabilities" | "architecture" | "mappings" | "ask";

/* =======================
   Page unifiée Architecte (Layout 3 colonnes)
======================= */

export default function ArchitectPage() {
  const [activeView, setActiveView] = useState<ActiveView>("inventory");
  const [submittedInterviews, setSubmittedInterviews] = useState<Process[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  
  // Mappings state
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [asce, setAsce] = useState<any | null>(null);
  const [acv, setAcv] = useState<any | null>(null);
  
  // Architecture state
  const [architecture, setArchitecture] = useState<any>(null);
  const [architectureView, setArchitectureView] = useState<"static" | "dynamic" | "integration">("static");
  
  // Ask Aura state
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  
  // Selection state (pour le panneau droit)
  const [selectedElement, setSelectedElement] = useState<{ type: string; id: string; data: any } | null>(null);

  const selectedInterview = useMemo(
    () => submittedInterviews.find((i) => i.id === selectedInterviewId) || null,
    [submittedInterviews, selectedInterviewId]
  );

  /* =======================
     Load data
  ======================= */

  useEffect(() => {
    fetch(`${API}/architect/interviews`)
      .then((r) => r.json())
      .then((data) => {
        setSubmittedInterviews(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedInterviewId) {
          setSelectedInterviewId(data[0].id);
        }
      })
      .catch(() => setSubmittedInterviews([]))
      .finally(() => setLoadingInterviews(false));

    fetch(`${API}/abp/datasets`)
      .then((r) => r.json())
      .then(setDatasets)
      .catch(() => setDatasets([]));
  }, []);

  /* =======================
     Mappings functions
  ======================= */

  function loadProposals(source: string) {
    if (!selectedInterviewId) return;
    fetch(
      `${API}/abp/mappings/proposals_by_source?process_id=${selectedInterviewId}&source_name=${encodeURIComponent(source)}`
    )
      .then((r) => r.json())
      .then(setProposals)
      .catch(() => setProposals([]));
  }

  function loadFacts(source?: string) {
    if (!selectedInterviewId) return;
    const url = source
      ? `${API}/abp/facts?process_id=${selectedInterviewId}&source_name=${encodeURIComponent(source)}`
      : `${API}/abp/facts?process_id=${selectedInterviewId}`;
    fetch(url)
      .then((r) => r.json())
      .then(setFacts)
      .catch(() => setFacts([]));
  }

  function refreshASCE_ACV() {
    if (!selectedInterviewId) return;
    fetch(`${API}/abp/asce?process_id=${selectedInterviewId}`)
      .then((r) => r.json())
      .then(setAsce);
    fetch(`${API}/abp/acv?process_id=${selectedInterviewId}`)
      .then((r) => r.json())
      .then(setAcv);
  }

  function handleMappingDecide(proposal: any, decision: "accept" | "reject") {
    if (!selectedInterviewId) return;
    fetch(`${API}/abp/mappings/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        process_id: selectedInterviewId,
        proposal_id: proposal.id,
        decision,
      }),
    })
      .then(() => {
        loadProposals(selectedSource || "");
        loadFacts(selectedSource);
        refreshASCE_ACV();
      });
  }

  /* =======================
     Architecture functions
  ======================= */

  useEffect(() => {
    if (activeView === "architecture" && selectedInterviewId) {
      fetch(`${API}/architect/architecture/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ process_id: selectedInterviewId }),
      })
        .then((r) => r.json())
        .then(setArchitecture)
        .catch(() => setArchitecture(null));
    }
  }, [activeView, selectedInterviewId]);

  /* =======================
     Ask Aura functions
  ======================= */

  function handleAskAura() {
    if (!askQuestion.trim() || !selectedInterviewId) return;
    setAskLoading(true);
    setAskAnswer(null);
    
    fetch(`${API}/abp/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: askQuestion,
        process_id: selectedInterviewId,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAskAnswer(data.interpretation || data.answer || "Aucune réponse disponible.");
      })
      .catch(() => {
        setAskAnswer("Erreur lors de la requête.");
      })
      .finally(() => {
        setAskLoading(false);
      });
  }

  /* =======================
     Render Inventory (colonne gauche)
  ======================= */

  const renderInventory = () => {
    if (!selectedInterview?.interview_data) {
      return (
        <div style={{ padding: 20, color: "#64748b", textAlign: "center" }}>
          Sélectionnez une interview pour voir l'inventory
        </div>
      );
    }

    const data = selectedInterview.interview_data;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Events */}
        {data.events && data.events.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
              ⚡ Events ({data.events.length})
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {data.events.map((e: any, i: number) => (
                <button
                  key={e.id || i}
                  onClick={() => setSelectedElement({ type: "event", id: e.id || `event_${i}`, data: e })}
                  style={{
                    padding: 8,
                    textAlign: "left",
                    background: selectedElement?.type === "event" && selectedElement.id === (e.id || `event_${i}`) ? "#f8fafc" : "#ffffff",
                    border: `1px solid ${selectedElement?.type === "event" && selectedElement.id === (e.id || `event_${i}`) ? "#0f172a" : "#e5e7eb"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#0f172a",
                  }}
                >
                  {i + 1}. {e.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities */}
        {data.capabilities && data.capabilities.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
              🧠 Capabilities ({data.capabilities.filter((c: any) => c.status === "VALIDATED" || c.status === "RENAMED").length})
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {data.capabilities
                .filter((c: any) => c.status === "VALIDATED" || c.status === "RENAMED")
                .map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedElement({ type: "capability", id: c.id, data: c })}
                    style={{
                      padding: 8,
                      textAlign: "left",
                      background: selectedElement?.type === "capability" && selectedElement.id === c.id ? "#f8fafc" : "#ffffff",
                      border: `1px solid ${selectedElement?.type === "capability" && selectedElement.id === c.id ? "#0f172a" : "#e5e7eb"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 12,
                      color: "#0f172a",
                    }}
                  >
                    {c.name} ({c.confidence}%)
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Applications */}
        {data.applications && data.applications.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
              🧩 Applications ({data.applications.length})
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {data.applications.map((app: any) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedElement({ type: "application", id: app.id, data: app })}
                  style={{
                    padding: 8,
                    textAlign: "left",
                    background: selectedElement?.type === "application" && selectedElement.id === app.id ? "#f8fafc" : "#ffffff",
                    border: `1px solid ${selectedElement?.type === "application" && selectedElement.id === app.id ? "#0f172a" : "#e5e7eb"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#0f172a",
                  }}
                >
                  {app.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Policies */}
        {data.policies && data.policies.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
              📏 Policies ({data.policies.length})
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {data.policies.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedElement({ type: "policy", id: p.id, data: p })}
                  style={{
                    padding: 8,
                    textAlign: "left",
                    background: selectedElement?.type === "policy" && selectedElement.id === p.id ? "#f8fafc" : "#ffffff",
                    border: `1px solid ${selectedElement?.type === "policy" && selectedElement.id === p.id ? "#0f172a" : "#e5e7eb"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#0f172a",
                  }}
                >
                  {p.rule}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* =======================
     Render Design Central
  ======================= */

  const renderDesignCentral = () => {
    if (activeView === "architecture") {
      const mermaidCode =
        architecture && architectureView === "static"
          ? architecture.functional_static_mermaid || ""
          : architectureView === "dynamic"
          ? architecture.functional_dynamic_mermaid || ""
          : architecture.integration_mermaid || "";

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Architecture</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["static", "dynamic", "integration"].map((view) => (
                <button
                  key={view}
                  onClick={() => setArchitectureView(view as any)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: architectureView === view ? "#0f172a" : "#ffffff",
                    color: architectureView === view ? "#ffffff" : "#0f172a",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          {architecture ? (
            <MermaidDiagram mermaidCode={mermaidCode} />
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              Sélectionnez une interview pour générer l'architecture
            </div>
          )}
        </div>
      );
    }

    if (activeView === "mappings") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Mappings</div>
          
          {/* Sélection source */}
          {selectedInterviewId && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, display: "block" }}>
                Source de données
              </label>
              <select
                value={selectedSource || ""}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  if (e.target.value) {
                    loadProposals(e.target.value);
                    loadFacts(e.target.value);
                  }
                }}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              >
                <option value="">Sélectionner une source</option>
                {datasets.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Proposals */}
          {selectedSource && proposals.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Propositions de mapping</div>
              <MappingMatrix proposals={proposals} onDecide={handleMappingDecide} />
            </div>
          )}

          {/* Facts */}
          {selectedInterviewId && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Facts instanciés</div>
              {facts.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>Aucun fact.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ textAlign: "left", padding: 8 }}>Attribut</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Valeur</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Source</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Champ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facts.map((f, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 8 }}>{f.attribute}</td>
                        <td style={{ padding: 8, fontWeight: 700 }}>{String(f.value)}</td>
                        <td style={{ padding: 8 }}>{f.source}</td>
                        <td style={{ padding: 8 }}>{f.source_field}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ASCE / ACV */}
          {selectedInterviewId && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>ASCE</div>
                {asce ? (
                  <div style={{ fontSize: 13 }}>
                    <div>Mapping : {Math.round((asce.coverage_mapping || 0) * 100)}%</div>
                    <div>Observé : {Math.round((asce.coverage_observed || 0) * 100)}%</div>
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontSize: 12 }}>—</div>
                )}
              </div>
              <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>ACV</div>
                {acv?.issues?.length ? (
                  <div style={{ fontSize: 13 }}>
                    {acv.issues.map((i: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 4 }}>
                        <b>{i.severity}</b> — {i.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontSize: 12 }}>Aucune incohérence</div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeView === "ask") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Ask Aura</div>
          <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Questions contextuelles sur les interviews
            </div>
            <textarea
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder="Ex: Quelles sont les capabilities identifiées ?"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                fontSize: 13,
                minHeight: 100,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleAskAura}
              disabled={!askQuestion.trim() || !selectedInterviewId || askLoading}
              style={{
                marginTop: 12,
                padding: "10px 20px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: askQuestion.trim() && selectedInterviewId && !askLoading ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 700,
                opacity: askQuestion.trim() && selectedInterviewId && !askLoading ? 1 : 0.5,
              }}
            >
              {askLoading ? "Chargement..." : "Poser la question"}
            </button>
          </div>
          {askAnswer && (
            <div style={{ padding: 16, background: "#ecfdf5", borderRadius: 8, border: "1px solid #86efac" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Réponse</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "#0f172a" }}>{askAnswer}</div>
            </div>
          )}
        </div>
      );
    }

    // Default: Inventory view
    return selectedInterview ? (
      <ArchitectureCanvas interview={selectedInterview} />
    ) : (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Aucune interview sélectionnée</div>
        <div style={{ fontSize: 14 }}>Sélectionnez une interview dans la liste</div>
      </div>
    );
  };

  /* =======================
     Render Panneau Droit
  ======================= */

  const renderRightPanel = () => {
    if (selectedElement) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Propriétés de l'élément sélectionné */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
              Propriétés
            </div>
            <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>
                {selectedElement.type === "event" && "⚡ "}
                {selectedElement.type === "capability" && "🧠 "}
                {selectedElement.type === "application" && "🧩 "}
                {selectedElement.type === "policy" && "📏 "}
                {selectedElement.data.name || selectedElement.data.label || selectedElement.data.rule || "Élément"}
              </div>
              {selectedElement.type === "event" && (
                <>
                  {selectedElement.data.variant && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      ⚠️ Variante: {selectedElement.data.variant}
                    </div>
                  )}
                  {selectedElement.data.application && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      🧩 Application: {selectedElement.data.application}
                    </div>
                  )}
                  {selectedElement.data.policy && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      📏 Règle: {selectedElement.data.policy}
                    </div>
                  )}
                </>
              )}
              {selectedElement.type === "capability" && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Confiance: {selectedElement.data.confidence}%
                </div>
              )}
            </div>
          </div>

          {/* Ask Aura contextuel */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
              Ask Aura
            </div>
            <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                Questions sur cet élément
              </div>
              <textarea
                placeholder={`Ex: Quels sont les détails de ce ${selectedElement.type} ?`}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                  fontSize: 11,
                  minHeight: 60,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <button
                style={{
                  marginTop: 8,
                  padding: "6px 12px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  width: "100%",
                }}
              >
                Poser la question
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Vue par défaut : propriétés de l'interview
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {selectedInterview ? (
          <>
            {/* Propriétés */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
                Propriétés
              </div>
              <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>{selectedInterview.name}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  Compilé le: {selectedInterview.compiled_at || "N/A"}
                </div>
                {selectedInterview.interview_data?.events && (
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    {selectedInterview.interview_data.events.length} événement(s)
                  </div>
                )}
                {selectedInterview.interview_data?.capabilities && (
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    {selectedInterview.interview_data.capabilities.length} capability(s)
                  </div>
                )}
                {selectedInterview.interview_data?.applications && (
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {selectedInterview.interview_data.applications.length} application(s)
                  </div>
                )}
              </div>
            </div>

            {/* Dernières interviews */}
            {submittedInterviews.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
                  Dernières interviews
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {submittedInterviews.slice(0, 5).map((interview) => (
                    <button
                      key={interview.id}
                      onClick={() => setSelectedInterviewId(interview.id)}
                      style={{
                        padding: 8,
                        textAlign: "left",
                        background: selectedInterviewId === interview.id ? "#f8fafc" : "#ffffff",
                        border: `1px solid ${selectedInterviewId === interview.id ? "#0f172a" : "#e5e7eb"}`,
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 11,
                        color: "#0f172a",
                      }}
                    >
                      {interview.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 20 }}>
            Sélectionnez une interview pour voir ses propriétés
          </div>
        )}
      </div>
    );
  };

  /* =======================
     Render
  ======================= */

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr 360px",
        gap: 0,
        height: "100vh",
        background: "#f6f7fb",
      }}
    >
      {/* Left panel - Menu navigation + Inventory */}
      <aside
        style={{
          borderRight: "1px solid #e5e7eb",
          background: "#ffffff",
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
          Navigation
        </div>
        <div style={{ display: "grid", gap: 4, marginBottom: 24 }}>
          {[
            { key: "inventory", label: "📋 Inventory", icon: "📋" },
            { key: "capabilities", label: "🧠 Capabilities", icon: "🧠" },
            { key: "architecture", label: "🏗️ Architecture", icon: "🏗️" },
            { key: "mappings", label: "🔗 Mappings", icon: "🔗" },
            { key: "ask", label: "💬 Ask Aura", icon: "💬" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key as ActiveView)}
              style={{
                padding: "8px 12px",
                textAlign: "left",
                background: activeView === item.key ? "#0f172a" : "transparent",
                color: activeView === item.key ? "#fff" : "#0f172a",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeView === item.key ? 700 : 400,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
          Interviews
        </div>
        <InterviewList
          interviews={submittedInterviews}
          onSelect={setSelectedInterviewId}
          selectedId={selectedInterviewId}
        />

        {/* Inventory détaillé (si vue inventory) */}
        {activeView === "inventory" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
              Inventory
            </div>
            {renderInventory()}
          </div>
        )}
      </aside>

      {/* Center panel - Design central */}
      <main
        style={{
          background: "#ffffff",
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {loadingInterviews ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Chargement…</div>
        ) : (
          renderDesignCentral()
        )}
        
        {/* Ask Aura sticky en bas à droite */}
        {selectedInterviewId && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 400, // À droite du panneau droit (360px + padding)
              width: 320,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 1000,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
              💬 Ask Aura
            </div>
            <input
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder="Posez une question sur l'architecture..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && askQuestion.trim() && !askLoading) {
                  handleAskAura();
                }
              }}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 13,
                outline: "none",
                marginBottom: 8,
              }}
            />
            <button
              onClick={handleAskAura}
              disabled={!askQuestion.trim() || askLoading}
              style={{
                width: "100%",
                padding: "8px 16px",
                background: askQuestion.trim() && !askLoading ? "#0f172a" : "#e5e7eb",
                color: askQuestion.trim() && !askLoading ? "#fff" : "#9ca3af",
                border: "none",
                borderRadius: 8,
                cursor: askQuestion.trim() && !askLoading ? "pointer" : "not-allowed",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {askLoading ? "Chargement..." : "Poser la question"}
            </button>
            {askAnswer && (
              <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, lineHeight: 1.6 }}>
                {askAnswer}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Right panel - Properties + Ask Aura */}
      <aside
        style={{
          borderLeft: "1px solid #e5e7eb",
          background: "#ffffff",
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {renderRightPanel()}
      </aside>
    </div>
  );
}
