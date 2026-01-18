"use client";

import { useState } from "react";

export default function AskAura() {
  const [q, setQ] = useState("");

  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        gap: 12,
      }}
    >
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Ask Aura…"
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          border: "1px solid #1e293b",
          background: "#020617",
          color: "#e5e7eb",
        }}
      />
      <button
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          background: "#047857",
          color: "#fff",
          border: "none",
        }}
      >
        Ask
      </button>
    </div>
  );
}
