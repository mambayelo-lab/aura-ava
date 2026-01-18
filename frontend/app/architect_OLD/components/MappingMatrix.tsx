"use client";

type Props = {
  proposals: any[];
  onDecide: (p: any, d: "accept" | "reject") => void;
};

export default function MappingMatrix({ proposals = [], onDecide }: Props) {
  const byField = proposals.reduce((acc: any, p: any) => {
    acc[p.field] = acc[p.field] || [];
    acc[p.field].push(p);
    return acc;
  }, {});

  const confidenceColor = (c: number) =>
    `hsl(${Math.round(c * 120)}, 70%, 45%)`;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {Object.entries(byField).map(([field, items]: any) => (
        <div key={field} style={{ border: "1px solid #e5e7eb", borderRadius: 12 }}>
          <div style={{ padding: 12, fontWeight: 800 }}>{field}</div>

          {items.map((p: any, i: number) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 10,
                borderTop: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <div>
                <div>{p.ontology_attribute}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: confidenceColor(p.confidence ?? 0), // ✅ FIX
                    fontWeight: 700,
                  }}
                >
                  Confiance : {Math.round((p.confidence ?? 0) * 100)}%
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onDecide(p, "accept")}>✓</button>
                <button onClick={() => onDecide(p, "reject")}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
