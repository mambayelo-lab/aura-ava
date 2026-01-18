"use client";

export default function LeftDrawer() {
  return (
    <div
      style={{
        width: 240,
        background: "#020617",
        color: "#cbd5f5",
        padding: 16,
        borderRight: "1px solid #1e293b",
      }}
    >
      <div style={{ marginBottom: 20, fontWeight: 600 }}>Navigation</div>

      {[
        "Interviews",
        "Dashboard",
        "Initiatives",
        "Blueprints",
        "Inventory",
      ].map(item => (
        <div
          key={item}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
