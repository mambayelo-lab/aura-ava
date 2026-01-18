"use client";

import { useState } from "react";

const API = "/api";

type Answer = {
  question: string;
  facts: string[];
  interpretation: string;
  confidence?: number;
  rules_applied?: string[];
};

export default function AskAuraPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/abp/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const data = await res.json();
      setAnswer(data);
    } catch (e: any) {
      alert(`Erreur: ${e?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: "#f6f7fb", minHeight: "100%" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>Ask Aura</h1>

        <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Posez votre question..."
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              style={{
                padding: "12px 24px",
                background: loading ? "#94a3b8" : "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "..." : "Analyser"}
            </button>
          </div>
        </div>

        {answer && (
          <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Réponse</h2>
            
            <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Interprétation</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{answer.interpretation}</div>
            </div>

            {answer.facts && answer.facts.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Faits utilisés</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {answer.facts.map((fact, i) => (
                    <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {answer.confidence !== undefined && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Confiance</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: answer.confidence > 60 ? "#22c55e" : "#f59e0b" }}>
                  {answer.confidence}%
                </div>
              </div>
            )}

            {answer.rules_applied && answer.rules_applied.length > 0 && (
              <div>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Règles appliquées</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {answer.rules_applied.map((rule, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#64748b" }}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

