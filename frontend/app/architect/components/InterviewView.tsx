"use client";

export default function InterviewView({ ontology }: { ontology: any }) {
  const entries = [
    ["Actor", ontology.actor],
    ["Intention", ontology.intention],
    ["Event", ontology.event],
    ["Fragility", ontology.fragility],
    ["Consequence", ontology.consequence],
    ["Support", ontology.support],
    ["Dependency", ontology.dependency],
  ];

  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: 20,
        color: "#e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: 16 }}>{ontology.process_name}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        {entries.map(([label, value]) => (
          <div key={label}>
            <div style={{ opacity: 0.6, fontSize: 12 }}>{label}</div>
            <div>{value || "—"}</div>
          </div>
        ))}
      </div>

      {/* Placeholder futur pour schéma fonctionnel */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 8,
          background: "#020617",
          border: "1px dashed #334155",
          opacity: 0.7,
        }}
      >
        Functional / Application View (auto-generated)
      </div>
    </div>
  );
}
