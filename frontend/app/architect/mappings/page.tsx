"use client";

import { useEffect, useState } from "react";
import MappingMatrix from "../components/MappingMatrix";


const API = "/api";

/* =======================
   Layout & styles
======================= */

const pageStyle: React.CSSProperties = {
  minHeight: "100%",
  padding: 22,
  background: "#f6f7fb",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
};

const button: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: "8px 12px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#fff",
};

const primary: React.CSSProperties = {
  ...button,
  background: "#111827",
  color: "#fff",
  border: "1px solid #111827",
};

const muted: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};

/* =======================
   Page
======================= */

export default function MappingPage() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);

  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const [proposals, setProposals] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);

  const [asce, setAsce] = useState<any | null>(null);
  const [acv, setAcv] = useState<any | null>(null);

  const [status, setStatus] = useState<string>("");

  /* =======================
     Initial load
  ======================= */

  useEffect(() => {
    fetch(`${API}/architect/interviews`)
      .then((r) => r.json())
      .then(setProcesses)
      .catch(() => setProcesses([]));

    fetch(`${API}/abp/datasets`)
      .then((r) => r.json())
      .then(setDatasets)
      .catch(() => setDatasets([]));
  }, []);

  /* =======================
     Helpers
  ======================= */

  function refreshASCE_ACV() {
    if (!selectedProcess) return;

    fetch(`${API}/abp/asce?process_id=${selectedProcess}`)
      .then((r) => r.json())
      .then(setAsce);

    fetch(`${API}/abp/acv?process_id=${selectedProcess}`)
      .then((r) => r.json())
      .then(setAcv);
  }

  function loadProposals(source: string) {
    if (!selectedProcess) return;

    fetch(
      `${API}/abp/mappings/proposals_by_source?process_id=${selectedProcess}&source_name=${encodeURIComponent(
        source
      )}`
    )
      .then((r) => r.json())
      .then(setProposals)
      .catch(() => setProposals([]));
  }

  function loadFacts(source?: string) {
    if (!selectedProcess) return;

    const url = source
      ? `${API}/abp/facts?process_id=${selectedProcess}&source_name=${source}`
      : `${API}/abp/facts?process_id=${selectedProcess}`;

    fetch(url)
      .then((r) => r.json())
      .then(setFacts)
      .catch(() => setFacts([]));
  }

  /* =======================
     Actions
  ======================= */

  async function proposeMappings(dataset: any) {
    if (!selectedProcess) return;

    setSelectedSource(dataset.name);
    setStatus(`Génération des propositions pour ${dataset.name}…`);

    await fetch(
      `${API}/abp/mappings/propose?process_id=${selectedProcess}&dataset_id=${dataset.dataset_id}`,
      { method: "POST" }
    );

    loadProposals(dataset.name);
    refreshASCE_ACV();

    setStatus(`Propositions prêtes pour ${dataset.name}.`);
  }

  async function decide(p: any, decision: "accept" | "reject") {
    if (!selectedProcess) return;

    await fetch(`${API}/abp/mappings/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        process_id: selectedProcess,
        decision,
        source_name: p.source_name,
        field: p.field,
        ontology_attribute: p.ontology_attribute,
        confidence: p.confidence,
      }),
    });

    if (selectedSource) loadProposals(selectedSource);
    refreshASCE_ACV();
  }

  async function buildFactGraph() {
    if (!selectedProcess || !selectedSource) return;

    const ds = datasets.find((d) => d.name === selectedSource);
    if (!ds) return;

    setStatus(`Construction des facts depuis ${selectedSource}…`);

    await fetch(
      `${API}/abp/facts/build?process_id=${selectedProcess}&dataset_id=${ds.dataset_id}`,
      { method: "POST" }
    );

    loadFacts(selectedSource);
    refreshASCE_ACV();

    setStatus(`Fact Graph construit pour ${selectedSource}.`);
  }

  /* =======================
     Render
  ======================= */

  return (
    <div style={pageStyle}>
      {/* 1. Process */}
      <div style={card}>
        <div style={{ fontWeight: 900 }}>1. Processus</div>
        <select
          value={selectedProcess || ""}
          onChange={(e) => {
            setSelectedProcess(e.target.value || null);
            setSelectedSource(null);
            setProposals([]);
            setFacts([]);
            setAsce(null);
            setAcv(null);
          }}
        >
          <option value="">— Sélectionner —</option>
          {processes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Sources */}
      <div style={card}>
        <div style={{ fontWeight: 900 }}>2. Sources observées</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {datasets.map((d) => (
            <button
              key={d.dataset_id}
              style={button}
              disabled={!selectedProcess}
              onClick={() => proposeMappings(d)}
            >
              Proposer mappings ({d.name})
            </button>
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          <button
            style={primary}
            disabled={!selectedSource}
            onClick={buildFactGraph}
          >
            Build Fact Graph
          </button>
        </div>

        {status && <div style={{ ...muted, marginTop: 6 }}>{status}</div>}
      </div>

      {/* 3. Mapping matrix */}
      <div style={card}>
        <div style={{ fontWeight: 900 }}>
          3. Propositions de mapping{" "}
          {selectedSource ? `— ${selectedSource}` : ""}
        </div>

        {!selectedSource ? (
          <div style={muted}>Sélectionne une source.</div>
        ) : (
          <MappingMatrix proposals={proposals} onDecide={decide} />
        )}
      </div>

      {/* 4. Facts */}
      <div style={card}>
        <div style={{ fontWeight: 900 }}>Facts instanciés</div>

        {facts.length === 0 ? (
          <div style={muted}>Aucun fact.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Attribut</th>
                <th>Valeur</th>
                <th>Source</th>
                <th>Champ</th>
              </tr>
            </thead>
            <tbody>
              {facts.map((f, i) => (
                <tr key={i}>
                  <td>{f.attribute}</td>
                  <td>{String(f.value)}</td>
                  <td>{f.source}</td>
                  <td>{f.source_field}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. ASCE / ACV */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <div style={{ fontWeight: 900 }}>ASCE</div>
          {asce ? (
            <>
              <div>Mapping : {Math.round(asce.coverage_mapping * 100)}%</div>
              <div>Observé : {Math.round(asce.coverage_observed * 100)}%</div>
            </>
          ) : (
            <div style={muted}>—</div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900 }}>ACV</div>
          {acv?.issues?.length ? (
            acv.issues.map((i: any, idx: number) => (
              <div key={idx}>
                <b>{i.severity}</b> — {i.message}
              </div>
            ))
          ) : (
            <div style={muted}>Aucune incohérence</div>
          )}
        </div>
      </div>
    </div>
  );
}
