"use client";

import { useEffect, useState } from "react";
import InterviewList from "./components/InterviewList";
import InterviewView from "./components/InterviewView";
import AskAura from "./components/AskAura";

const API = process.env.NEXT_PUBLIC_BACKEND_URL!;


export default function ArchitectPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API}/architect/interviews`)
      .then(r => r.json())
      .then(setInterviews);
  }, []);

  async function openInterview(id: string) {
    const data = await fetch(`${API}/architect/interviews/${id}`).then(r => r.json());
    setSelected(data);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
      <InterviewList interviews={interviews} onSelect={openInterview} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {selected ? (
          <>
            <InterviewView ontology={selected} />
            <AskAura />
          </>
        ) : (
          <div style={{ color: "#94a3b8" }}>
            Sélectionne une interview dans le menu.
          </div>
        )}
      </div>
    </div>
  );
}
