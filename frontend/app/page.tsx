"use client";

import { useEffect, useMemo, useState } from "react";

type InterviewState = {
  actor?: string;
  system?: string;
  command?: string;
  event?: string;
  reaction?: string;
  visibility?: string;
  dependency?: string;
};

type CompiledNode = { id: string; type: string; label: string; step: string };
type CompileResponse = {
  ok: boolean;
  missing_step?: string | null;
  compiled: {
    actor: CompiledNode;
    system: CompiledNode;
    command: CompiledNode;
    event: CompiledNode;
    reaction: CompiledNode;
    visibility: CompiledNode;
    dependency: CompiledNode;
  };
  hints: string[];
};

const STEPS: Array<keyof InterviewState> = [
  "actor",
  "system",
  "command",
  "event",
  "reaction",
  "visibility",
  "dependency",
];

const LABELS: Record<string, string> = {
  actor: "Acteur",
  system: "Système",
  command: "Commande",
  event: "Événement",
  reaction: "Réaction",
  visibility: "Visibilité",
  dependency: "Dépendance",
};

export default function Page() {
  const [examples, setExamples] = useState<Record<string, string>>({});
  const [state, setState] = useState<InterviewState>({});
  const [activeStep, setActiveStep] = useState<keyof InterviewState>("actor");
  const [compiled, setCompiled] = useState<CompileResponse | null>(null);

  const backendBase = useMemo(() => {
    // In Codespaces, you will expose port 8000; simplest is same-origin proxy later.
    // For now: user sets NEXT_PUBLIC_BACKEND_URL in Codespaces env if needed.
    return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
  }, []);

  useEffect(() => {
    fetch(`${backendBase}/examples`)
      .then((r) => r.json())
      .then(setExamples)
      .catch(() => setExamples({}));
  }, [backendBase]);

  useEffect(() => {
    // compile on every state change (live right pane)
    fetch(`${backendBase}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    })
      .then((r) => r.json())
      .then(setCompiled)
      .catch(() => setCompiled(null));
  }, [state, backendBase]);

  const currentValue = state[activeStep] ?? "";
  const placeholder = examples[String(activeStep)] ?? "";

  function setValue(v: string) {
    setState((s) => ({ ...s, [activeStep]: v }));
  }

  function next() {
    const idx = STEPS.indexOf(activeStep);
    if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1]);
  }

  function back() {
    const idx = STEPS.indexOf(activeStep);
    if (idx > 0) setActiveStep(STEPS[idx - 1]);
  }

  function goToStep(step: keyof InterviewState) {
    setActiveStep(step);
    // Optional: scroll/focus improvements later
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", height: "100vh" }}>
      {/* Left pane */}
      <div style={{ padding: 24, borderRight: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700 }}>AVA v0</div>
          <div style={{ color: "#6b7280" }}>7Q Guided Compiler</div>
        </div>

        {/* Step chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {STEPS.map((s) => {
            const isActive = s === activeStep;
            const isDone = Boolean(state[s] && String(state[s]).trim().length > 0);
            return (
              <button
                key={String(s)}
                onClick={() => setActiveStep(s)}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: isActive ? "#111827" : "#fff",
                  color: isActive ? "#fff" : "#111827",
                  cursor: "pointer",
                  opacity: isDone ? 1 : 0.9,
                }}
                title={isDone ? "Complété" : "À compléter"}
              >
                {LABELS[String(s)]}
              </button>
            );
          })}
        </div>

        {/* Active question */}
        <div style={{ marginBottom: 10, color: "#111827", fontWeight: 650 }}>
          {LABELS[String(activeStep)]} (étape {STEPS.indexOf(activeStep) + 1}/7)
        </div>

        <textarea
          value={currentValue}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            outline: "none",
            fontSize: 14,
            lineHeight: 1.4,
            resize: "vertical",
          }}
        />

        {/* micro-hints */}
        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
          {activeStep === "command" && "Verbe à l’infinitif + objet (ex: “Créer commande”)."}
          {activeStep === "event" && "Fait observable, datable (ex: “Commande créée”)."}
          {activeStep === "dependency" && "Exprime ce qui casse si l’événement change."}
        </div>

        {/* nav buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={back}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Back
          </button>
          <button
            onClick={next}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #111827",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>

        {/* validation */}
        <div style={{ marginTop: 16 }}>
          {compiled?.hints?.length ? (
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid #f59e0b", background: "#fffbeb" }}>
              <div style={{ fontWeight: 650, marginBottom: 6 }}>À clarifier</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {compiled.hints.map((h, i) => (
                  <li key={i} style={{ color: "#92400e", fontSize: 13 }}>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <div style={{ fontWeight: 650, marginBottom: 4 }}>Compilation</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                {compiled?.missing_step ? `Prochaine étape : ${LABELS[compiled.missing_step]}` : "Prêt."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right pane */}
      <div style={{ padding: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Compilation live</div>
        <div style={{ color: "#6b7280", marginBottom: 18 }}>
          Clique sur un concept pour revenir à son étape et le modifier.
        </div>

        {compiled ? (
          <div style={{ display: "grid", gap: 10 }}>
            {(["actor","system","command","event","reaction","visibility","dependency"] as const).map((k) => {
              const node = compiled.compiled[k];
              const label = node?.label?.trim() ? node.label : "—";
              return (
                <div
                  key={k}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 14,
                    background: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ color: "#6b7280", width: 110 }}>{LABELS[k]}</div>

                  <button
                    onClick={() => goToStep(node.step as keyof InterviewState)}
                    style={{
                      textAlign: "left",
                      flex: 1,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      padding: "8px 10px",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontWeight: 650,
                    }}
                    title={`Modifier ${LABELS[k]}`}
                  >
                    {label}
                  </button>

                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{node.type}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: "#6b7280" }}>En attente de compilation…</div>
        )}

        <div style={{ marginTop: 20, padding: 14, border: "1px solid #e5e7eb", borderRadius: 16, background: "#f9fafb" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Prochaines features AVA (après v0)</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#374151" }}>
            <li>Détection de capabilities (Command + Event).</li>
            <li>Suggestions de décisions structurantes après plusieurs processus.</li>
            <li>Association décision ↔ processus (pré-remplie, ajustable).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
