"use client";

import { ReactNode, useState } from "react";
import TopBar from "./components/TopBar";
import LeftDrawer from "./components/LeftDrawer";

export default function ArchitectLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />

      <div style={{ flex: 1, display: "flex", background: "#0f172a" }}>
        {drawerOpen && <LeftDrawer />}

        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
