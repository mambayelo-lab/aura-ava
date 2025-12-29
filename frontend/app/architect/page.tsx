"use client";

import { useEffect, useMemo, useState } from "react";
import InterviewList from "./components/InterviewList";
import InterviewView from "./components/InterviewView";

const API = "/api";

/* =======================
   Types
======================= */

type StepKey =
  | "actor"
  | "command"
  | "business_object"
  | "object_attributes"
  | "event"
  | "reaction"
  | "systems"
  | "visibility"
  | "fragility";

type InterviewState = Partial<Record<StepKey, string>>;

type Process = {
  id: string;
  name: string;
  state?: InterviewState; // ✅ FIX : optionnel
};

/* =======================
   Steps AVA
======================= */

const STEPS = [
  { key: "actor", title: "Acteur", icon: "👤", question: "Qui initie réellement cette action ?" },
  { key: "command", title: "Commande", icon: "⚡", question: "Quelle commande explicite est émise ?" },
  { key: "business_object", title: "Objet métier", icon: "📦", question: "Sur quel objet métier porte cette commande ?" },
  { key: "object_attributes", title: "Attributs", icon: "🧬", question: "Quels attributs sont indispensables ?" },
  { key: "event", title: "Événement", icon: "🚩", question: "Quel événement confirme l’exécution ?" },
  { key: "reaction", title: "Réaction", icon: "🔁", question: "Qu’est-ce que cela déclenche ?" },
  { key: "systems", title: "Systèmes", icon: "🧩", question: "Quels systèmes sont impliqués ?" },
  { key: "visibility", title: "Visibilité", icon: "👁️", question: "Qui voit quoi et quand ?" },
  { key: "fragility", title: "Fragilité", icon: "⚠️", question: "Où ça casse ?" },
] as const;

/* =======================
   Helpers
======================= */

function isFilled(v?: string) {
  return !!v && v.trim().length > 0;
}

function processCompletion(p: Process) {
  const safeState = p.state ?? {}; // ✅ FIX
  const filled = STEPS.filter((s) => isFilled(safeState[s.key])).length;
  return { filled, total: STEPS.length, done: filled === STEPS.length };
}

function safeJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

/* =======================
   Page
======================= */

export default function Page() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProcess = useMemo(
    () => processes.find((p) => p.id === currentProcessId) || null,
    [processes, currentProcessId]
  );

  const activeStep = STEPS[activeStepIndex];

  const currentCompletion = useMemo(() => {
    if (!currentProcess) return { filled: 0, total: STEPS.length, done: false };
    return processCompletion(currentProcess);
  }, [currentProcess]);

  /* =======================
     Load processes
  ======================= */

  useEffect(() => {
    fetch(`${API}/process`)
      .then((r) => r.json())
      .then((data) =>
        setProcesses(
          Array.isArray(data)
            ? data.map((p) => ({ ...p, state: p.state ?? {} })) // ✅ FIX
            : []
        )
      )
      .catch(() => setProcesses([]))
      .finally(() => setLoading(false));
  }, []);

  /* =======================
     Sync input
  ======================= */

  useEffect(() => {
    if (!currentProcess) {
      setInput("");
      return;
    }
    const key = STEPS[activeStepIndex]?.key;
    setInput((currentProcess.state ?? {})[key] ?? ""); // ✅ FIX
  }, [currentProcessId, activeStepIndex]);

  /* =======================
     Actions
  ======================= */

  async function createProcess() {
    const name = window.prompt("Nom du processus ?");
    if (!name) return;

    setBusy(true);
    const res = await fetch(`${API}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const p = await safeJson<Process>(res);
    setProcesses((ps) => [...ps, { ...p, state: p.state ?? {} }]); // ✅ FIX
    setCurrentProcessId(p.id);
    setActiveStepIndex(0);
    setBusy(false);
  }

  async function saveAnswer() {
    if (!currentProcess) return;

    const key = activeStep.key;
    const updated: Process = {
      ...currentProcess,
      state: { ...(currentProcess.state ?? {}), [key]: input.trim() }, // ✅ FIX
    };

    setBusy(true);
    await fetch(`${API}/process/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated.state),
    });

    setProcesses((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    setActiveStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    setBusy(false);
  }

  async function submitInterview() {
    if (!currentProcess) return;

    await fetch(`${API}/interview/submit?process_id=${currentProcess.id}`, {
      method: "POST",
    });

    alert("Interview soumise.");
  }

  /* =======================
     Load submitted interviews
  ======================= */

  const [submittedInterviews, setSubmittedInterviews] = useState<Process[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  useEffect(() => {
    fetch(`${API}/architect/interviews`)
      .then((r) => r.json())
      .then((data) => {
        setSubmittedInterviews(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedInterviewId) {
          setSelectedInterviewId(data[0].id);
        }
      })
      .catch(() => setSubmittedInterviews([]))
      .finally(() => setLoadingInterviews(false));
  }, []);

  const selectedInterview = useMemo(
    () => submittedInterviews.find((i) => i.id === selectedInterviewId) || null,
    [submittedInterviews, selectedInterviewId]
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: 24,
        padding: 24,
        background: "#f6f7fb",
        minHeight: "100%",
      }}
    >
      {/* Left panel - Interviews list */}
      <aside>
        <InterviewList
          interviews={submittedInterviews}
          onSelect={setSelectedInterviewId}
          selectedId={selectedInterviewId}
        />
      </aside>

      {/* Right panel - Ontology view */}
      <main>
        {loadingInterviews ? (
          <div style={{ color: "#64748b" }}>Chargement…</div>
        ) : selectedInterview ? (
          <InterviewView ontology={selectedInterview} />
        ) : (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#64748b",
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>Aucune interview sélectionnée</div>
            <div style={{ fontSize: 14 }}>
              Sélectionnez une interview dans la liste pour voir son ontologie AVA compilée
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
