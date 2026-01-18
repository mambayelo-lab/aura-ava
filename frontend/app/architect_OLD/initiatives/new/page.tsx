"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InitiativeForm from "../components/InitiativeForm";

export default function NewInitiativePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      const res = await fetch("/api/initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Erreur ${res.status}: ${txt}`);
      }

      const initiative = await res.json();
      router.push(`/architect/initiatives/${initiative.id}`);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la création");
    }
  };

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100%" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>Nouvelle initiative</h1>

        {error && (
          <div
            style={{
              padding: 12,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 8,
              color: "#7c2d12",
              marginBottom: 16,
            }}
          >
            <strong>Erreur :</strong> {error}
          </div>
        )}

        <InitiativeForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

