"use client";

import Link from "next/link";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "56px 1fr",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 20px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <div style={{ fontWeight: 900 }}>ABP Ops</div>

        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/ops/initiatives" style={linkStyle}>
            Initiatives
          </Link>
          <Link href="/ops/signals" style={linkStyle}>
            Signals
          </Link>
          <Link href="/ops/ask" style={linkStyle}>
            Ask Aura
          </Link>
        </nav>
      </header>

      {/* ⚠️ scroll autorisé ici */}
      <main style={{ overflowY: "auto" }}>{children}</main>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 600,
  color: "#0f172a",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

