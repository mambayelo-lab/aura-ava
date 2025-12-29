"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function DecisionPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<any | null>(null);

  async function loadSignals() {
    const data = await fetch(`${API}/abp/signals`).then(r => r.json());
    setSignals(data);
  }

  async function askAura() {
    const res = await fetch(`${API}/abp/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data);
    loadSignals();
  }

  useEffect(() => {
    loadSignals();
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
      <div>
        <h2>Ask Aura</h2>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Question métier"
        />
        <button onClick={askAura}>Analyser</button>

        {answer && (
          <>
            <h3>Facts observés</h3>
            <ul>
              {answer.facts.map((f: any, i: number) => (
                <li key={i}>
                  <strong>{f.label}</strong> : {f.value}
                </li>
              ))}
            </ul>
            <p><em>{answer.interpretation}</em></p>
          </>
        )}
      </div>

      <div>
        <h3>Signals</h3>
        <ul>
          {signals.map((s, i) => (
            <li key={i}>
              <strong>{s.label}</strong> ({s.severity})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
