"use client";

export default function InterviewList({
  interviews,
  onSelect,
  selectedId,
}: {
  interviews: any[];
  onSelect: (id: string) => void;
  selectedId?: string | null;
}) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>
          Architect Workspace
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Interviews compilées</h2>
      </div>

      {interviews.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>Aucune interview compilée</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {interviews.map((i) => {
            const isSelected = i.id === selectedId;
            // Formater la date de compilation si disponible
            const compiledDate = i.compiled_at || i.submitted_at || new Date().toLocaleString("fr-FR");
            
            return (
              <div
                key={i.id}
                onClick={() => onSelect(i.id)}
                style={{
                  padding: 16,
                  background: isSelected ? "#f1f5f9" : "#ffffff",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: `1px solid ${isSelected ? "#0f172a" : "#e5e7eb"}`,
                  color: "#0f172a",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{i.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Compilé le {compiledDate}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
