"use client";

export default function TopBar({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  return (
    <div
      style={{
        height: 56,
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onToggleDrawer}>☰</button>
        <strong>Aura Architect</strong>
      </div>

      <div style={{ cursor: "pointer" }}>
        👤 Mambaye ▾
      </div>
    </div>
  );
}
