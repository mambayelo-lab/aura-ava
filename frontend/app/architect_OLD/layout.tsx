"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ArchitectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMainPage = pathname === "/architect";

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
        <div style={{ fontWeight: 900 }}>Architect Workspace</div>

        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/architect" style={linkStyle}>
            Interviews
          </Link>
          <Link href="/architect/initiatives" style={linkStyle}>
            Initiatives
          </Link>
          <Link href="/architect/mappings" style={linkStyle}>
            Mappings
          </Link>
          <Link href="/architect/architecture" style={linkStyle}>
            Architecture
          </Link>
          <Link href="/architect/ask" style={linkStyle}>
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
