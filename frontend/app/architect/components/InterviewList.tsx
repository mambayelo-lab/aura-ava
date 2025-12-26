"use client";

export default function InterviewList({
  interviews,
  onSelect,
}: {
  interviews: any[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 style={{ color: "#e5e7eb", marginBottom: 12 }}>Interviews</h3>

      {interviews.map(i => (
        <div
          key={i.id}
          onClick={() => onSelect(i.id)}
          style={{
            padding: 12,
            background: "#020617",
            borderRadius: 8,
            marginBottom: 8,
            cursor: "pointer",
            border: "1px solid #1e293b",
            color: "#e5e7eb",
          }}
        >
          <div style={{ fontWeight: 600 }}>{i.name}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {i.compiled_at}
          </div>
        </div>
      ))}
    </div>
  );
}
