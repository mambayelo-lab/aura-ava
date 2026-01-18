"use client";

export default function InterviewView({ ontology }: { ontology: any }) {
  // Mapping des clés AVA vers les labels français
  const entries = [
    { key: "actor", label: "Acteur", icon: "👤" },
    { key: "command", label: "Commande", icon: "⚡" },
    { key: "business_object", label: "Objet métier", icon: "📦" },
    { key: "object_attributes", label: "Attributs", icon: "🧬" },
    { key: "event", label: "Événement", icon: "🚩" },
    { key: "reaction", label: "Réaction", icon: "🔁" },
    { key: "systems", label: "Systèmes", icon: "🧩" },
    { key: "visibility", label: "Visibilité", icon: "👁️" },
    { key: "fragility", label: "Fragilité", icon: "⚠️" },
  ];

  const processName = ontology.name || ontology.process_name || "Processus";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        color: "#0f172a",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>
          Ontologie AVA compilée
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{processName}</h2>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {entries.map(({ key, label, icon }) => {
          const value = ontology.state?.[key] || ontology[key] || "";
          return (
            <div
              key={key}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 16,
                padding: 16,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div style={{ fontWeight: 900, fontSize: 14 }}>{label}</div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: value ? "#0f172a" : "#64748b" }}>
                {value || "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
