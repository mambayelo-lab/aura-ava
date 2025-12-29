"use client";

import { useEffect, useMemo, useState } from "react";

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
  state: InterviewState;
};

/* =======================
   Steps AVA — orientés objets/événements
======================= */

const STEPS: {
  key: StepKey;
  title: string;
  question: string;
  helper?: string;
  icon: string;
  placeholder?: string;
}[] = [
  {
    key: "actor",
    title: "Acteur",
    icon: "👤",
    question: "Qui initie réellement cette action ?",
    helper: "Personne, rôle, équipe… ou système (si automatisé).",
    placeholder: "Ex : Gestionnaire SAV, Client, WMS, Batch nocturne…",
  },
  {
    key: "command",
    title: "Commande",
    icon: "⚡",
    question: "Quelle commande explicite est émise ?",
    helper: "Verbe à l’infinitif. Une action claire.",
    placeholder: "Ex : Créer commande, Valider facture, Allouer stock…",
  },
  {
    key: "business_object",
    title: "Objet métier",
    icon: "📦",
    question: "Sur quel objet métier porte cette commande ?",
    helper: "Le “noyau” sémantique : commande, facture, contrat, livraison…",
    placeholder: "Ex : Commande, Facture, Contrat, Stock, Livraison…",
  },
  {
    key: "object_attributes",
    title: "Attributs",
    icon: "🧬",
    question: "Quels attributs sont indispensables pour que ça fonctionne ?",
    helper: "Liste courte. Statut, date, montant, quantité, priorité…",
    placeholder: "Ex : statut, dateCréation, montant, devise, canal…",
  },
  {
    key: "event",
    title: "Événement",
    icon: "🚩",
    question: "Quel événement observable confirme que la commande est exécutée ?",
    helper: "Un fait réel, traçable, datable (pas une intention).",
    placeholder: "Ex : Commande créée, Stock réservé, Facture validée…",
  },
  {
    key: "reaction",
    title: "Réaction",
    icon: "🔁",
    question: "Qu’est-ce que cet événement déclenche ailleurs ?",
    helper: "Propagation : notifications, allocations, déclenchements, workflows…",
    placeholder: "Ex : Lancer préparation, Notifier logistique, Créer livraison…",
  },
  {
    key: "systems",
    title: "Systèmes",
    icon: "🧩",
    question: "Quels systèmes sont impliqués à chaque étape ?",
    helper: "Nomme les applications (et si possible leur rôle).",
    placeholder: "Ex : E-Collect (capture), WMS (allocation), ERP (facturation)…",
  },
  {
    key: "visibility",
    title: "Visibilité",
    icon: "👁️",
    question: "Qui voit quoi, et à quel moment ?",
    helper: "Audience + timing : temps réel, batch, délai, dépendances…",
    placeholder: "Ex : Logistique voit en temps réel; Finance J+1; Client J0…",
  },
  {
    key: "fragility",
    title: "Fragilité",
    icon: "⚠️",
    question: "Dans quels cas ça se passe mal, trop tard, ou pas du tout ?",
    helper: "Cas concrets + impact : cash, client, opérations, conformité…",
    placeholder: "Ex : stock non réservé → livraison retardée → pénalités…",
  },
];

/* =======================
   UI helpers
======================= */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isFilled(v?: string) {
  return !!v && v.trim().length > 0;
}

function processCompletion(p: Process) {
  const state = p.state || {};
  const filled = STEPS.filter((s) => isFilled(state[s.key])).length;
  return { filled, total: STEPS.length, done: filled === STEPS.length };
}

async function safeJson<T>(res: Response): Promise<T> {
  try {
    const text = await res.text();
    if (!text) {
      throw new Error("Empty response body");
    }
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
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
  const [initiativeId, setInitiativeId] = useState<string | null>(null);

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

  // Récupérer les paramètres URL (process_id, initiative_id)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlProcessId = params.get("process_id");
      const urlInitiativeId = params.get("initiative_id");
      
      if (urlProcessId) {
        setCurrentProcessId(urlProcessId);
      }
      if (urlInitiativeId) {
        setInitiativeId(urlInitiativeId);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API}/process`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Backend error (${res.status})`);

        const data = await safeJson<Process[]>(res);

        if (cancelled) return;
        // Normalize data: ensure each process has a state object
        const normalized = Array.isArray(data)
          ? data.map((p) => ({ ...p, state: p.state || {} }))
          : [];
        setProcesses(normalized);
        
        // Si un process_id est dans l'URL, le sélectionner
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const urlProcessId = params.get("process_id");
          if (urlProcessId && normalized.find((p) => p.id === urlProcessId)) {
            setCurrentProcessId(urlProcessId);
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Erreur lors du chargement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================
     Keep input in sync when step/process changes
  ======================= */

  useEffect(() => {
    if (!currentProcess) {
      setInput("");
      return;
    }
    const stepKey = STEPS[activeStepIndex]?.key;
    if (!stepKey) {
      setInput("");
      return;
    }
    // Safe access to state with null/undefined checks
    const state = currentProcess.state || {};
    const value = state[stepKey];
    setInput(value ? String(value) : "");
  }, [currentProcess, activeStepIndex]); // Now depends on currentProcess to sync when state changes

  /* =======================
     Actions
  ======================= */

  async function createProcess() {
    const name = window.prompt("Nom du processus ?");
    if (!name || !name.trim()) return;

    try {
      setBusy(true);
      setError(null);

      const res = await fetch(`${API}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur backend (${res.status}) ${txt ? `: ${txt}` : ""}`);
      }

      const p = await safeJson<Process>(res);

      // Si on a un initiative_id, lier le process à l'initiative
      if (initiativeId) {
        try {
          await fetch(`${API}/initiatives/${initiativeId}/link_process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ process_id: p.id }),
          });
        } catch (e) {
          // Ne pas bloquer si le lien échoue
          console.warn("Failed to link process to initiative:", e);
        }
      }

      setProcesses((ps) => [...ps, p]);
      setCurrentProcessId(p.id);
      setActiveStepIndex(0);
      setInput("");
    } catch (e: any) {
      setError(e?.message || "Backend inaccessible.");
    } finally {
      setBusy(false);
    }
  }

  function selectProcess(pid: string) {
    setCurrentProcessId(pid);
    setActiveStepIndex(0);
    // input sync handled by effect
  }

  function goToStep(i: number) {
    if (!currentProcess) return;
    setActiveStepIndex(i);
    // input sync handled by effect
  }

  async function saveAnswer() {
    if (!currentProcess) return;

    const key = activeStep.key;
    const value = input.trim();

    // Validation: ensure value is not empty
    if (!value) {
      setError("La réponse ne peut pas être vide.");
      return;
    }

    // Save previous state for rollback
    const previousProcess = { ...currentProcess };

    const updated: Process = {
      ...currentProcess,
      state: {
        ...(currentProcess.state || {}),
        [key]: value,
      },
    };

    // Optimistic update
    setProcesses((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));

    try {
      setBusy(true);
      setError(null);

      const res = await fetch(`${API}/process/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated.state),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur sauvegarde (${res.status}) ${txt ? `: ${txt}` : ""}`);
      }

      // Use server response to sync state (more reliable than optimistic update)
      const serverProcess = await safeJson<Process>(res);
      setProcesses((ps) => ps.map((p) => (p.id === serverProcess.id ? serverProcess : p)));

      // Auto-advance
      if (activeStepIndex < STEPS.length - 1) {
        setActiveStepIndex((i) => i + 1);
      }
    } catch (e: any) {
      // Rollback to previous state on error
      setProcesses((ps) => ps.map((p) => (p.id === previousProcess.id ? previousProcess : p)));
      setError(e?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setBusy(false);
    }
  }

  async function submitInterview() {
    if (!currentProcess) return;

    if (!processCompletion(currentProcess).done) {
      setError("Interview incomplète. Merci de répondre à toutes les étapes.");
      return;
    }

    const confirmed = window.confirm(
      "Vous êtes sur le point de soumettre cette interview.\n\n" +
        "Après soumission, elle sera transmise au Front Architecte.\n\n" +
        "Souhaitez-vous continuer ?"
    );
    if (!confirmed) return;

    try {
      setBusy(true);
      setError(null);

      const res = await fetch(
        `${API}/interview/submit?process_id=${encodeURIComponent(currentProcess.id)}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur soumission (${res.status}) ${txt ? `: ${txt}` : ""}`);
      }

      // feedback minimal
      alert("Interview soumise avec succès.");
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la soumission.");
    } finally {
      setBusy(false);
    }
  }

  /* =======================
     Render blocks
  ======================= */

  const shellStyle: React.CSSProperties = {
    height: "100vh",
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    background: "#f6f7fb",
    color: "#0f172a",
  };

  const panelStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const contentStyle: React.CSSProperties = {
    padding: 22,
    overflow: "auto",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    boxShadow: "0 1px 0 rgba(15,23,42,0.03)",
  };

  const buttonBase: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: "10px 12px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };

  const primaryBtn: React.CSSProperties = {
    ...buttonBase,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
  };

  const softBtn: React.CSSProperties = {
    ...buttonBase,
    background: "#f9fafb",
  };

  const mutedText: React.CSSProperties = {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.35,
  };

  return (
    <div style={shellStyle}>
      {/* ================= LEFT: process list + timeline ================= */}
      <aside style={panelStyle}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, letterSpacing: 0.3 }}>
              AURA Business Interview
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Processus</div>
          </div>

          {currentProcess && (
            <div
              title="Progression"
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: currentCompletion.done ? "#065f46" : "#0f172a",
                background: currentCompletion.done ? "#ecfdf5" : "#f1f5f9",
                border: "1px solid #e5e7eb",
                padding: "6px 10px",
                borderRadius: 999,
              }}
            >
              {currentCompletion.filled}/{currentCompletion.total}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#7c2d12",
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 13,
              lineHeight: 1.35,
            }}
          >
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {/* Process list */}
        <div style={{ ...cardStyle, padding: 10 }}>
          {loading ? (
            <div style={{ padding: 10, ...mutedText }}>Chargement…</div>
          ) : processes.length === 0 ? (
            <div style={{ padding: 10, ...mutedText }}>
              Aucun processus. Crée le premier pour commencer.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {processes.map((p) => {
                const c = processCompletion(p);
                const selected = p.id === currentProcessId;

                return (
                  <button
                    key={p.id}
                    onClick={() => selectProcess(p.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 10px",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: selected ? "#0f172a" : "#fff",
                      color: selected ? "#fff" : "#0f172a",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: selected ? "rgba(255,255,255,0.75)" : "#64748b",
                          fontWeight: 700,
                        }}
                      >
                        {c.done ? "Interview complète" : `Progression : ${c.filled}/${c.total}`}
                      </div>
                    </div>

                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: c.done ? "#22c55e" : "#cbd5e1",
                        boxShadow: selected ? "0 0 0 3px rgba(255,255,255,0.12)" : "none",
                      }}
                      aria-label={c.done ? "complet" : "incomplet"}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* New process */}
        <button onClick={createProcess} style={softBtn} disabled={busy}>
          + Nouveau processus
        </button>



        {/* Submit (only if complete) */}
        <button
          onClick={submitInterview}
          style={{
            ...primaryBtn,
            opacity: currentProcess && currentCompletion.done && !busy ? 1 : 0.55,
            cursor: currentProcess && currentCompletion.done && !busy ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
          disabled={!currentProcess || !currentCompletion.done || busy}
        >
          <span aria-hidden="true">✅</span>
          Soumettre l’interview
        </button>

        <div style={{ ...mutedText }}>
          Règle : l’interview est soumissible uniquement si toutes les étapes sont renseignées.
        </div>
      </aside>

      {/* ================= RIGHT: interview + restitution ================= */}
      <main style={contentStyle}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 14 }}>
          {/* Top header */}
          <div
            style={{
              ...cardStyle,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                Connaissance AVA
              </div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>
                {currentProcess ? currentProcess.name : "Sélectionnez un processus"}
              </div>
            </div>

            {currentProcess && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: currentCompletion.done ? "#065f46" : "#0f172a",
                  background: currentCompletion.done ? "#ecfdf5" : "#f1f5f9",
                  border: "1px solid #e5e7eb",
                  padding: "8px 10px",
                  borderRadius: 999,
                  minWidth: 120,
                  textAlign: "center",
                }}
              >
                {currentCompletion.done ? "Complet" : "En cours"}
              </div>
            )}
          </div>

          {/* Two columns content */}
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 14 }}>
            {/* Interview card */}
            <section style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      background: "#f8fafc",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                    }}
                    aria-hidden="true"
                  >
                    {activeStep.icon}
                  </div>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>
                      Étape {activeStepIndex + 1}/{STEPS.length} — {activeStep.title}
                    </div>

                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
                    style={softBtn}
                    disabled={!currentProcess || activeStepIndex === 0 || busy}
                    title="Précédent"
                  >
                    ← Précédent
                  </button>
                  <button
                    onClick={() => setActiveStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                    style={softBtn}
                    disabled={!currentProcess || activeStepIndex === STEPS.length - 1 || busy}
                    title="Suivant"
                  >
                    Suivant →
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                {!currentProcess ? (
                  <div style={{ ...mutedText, fontSize: 14 }}>
                    Sélectionne ou crée un processus à gauche pour commencer.
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.25 }}>
                      {activeStep.question}
                    </div>
                    {activeStep.helper && <div style={{ marginTop: 6, ...mutedText }}>{activeStep.helper}</div>}

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={5}
                      placeholder={activeStep.placeholder || "Saisis ta réponse…"}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        borderRadius: 14,
                        border: "1px solid #e5e7eb",
                        padding: 12,
                        fontSize: 14,
                        lineHeight: 1.4,
                        outline: "none",
                        background: "#fff",
                      }}
                      disabled={!currentProcess || busy}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
                      <div style={{ ...mutedText }}>
                        Astuce : vise une réponse courte, factuelle, réutilisable.
                      </div>

                      <button
                        onClick={saveAnswer}
                        style={{
                          ...primaryBtn,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 160,
                          justifyContent: "center",
                          opacity: currentProcess ? 1 : 0.6,
                        }}
                        disabled={!currentProcess || busy}
                      >
                        <span aria-hidden="true">💾</span>
                        Valider
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Restitution card */}
            <aside style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>Résumé capturé</div>
                  <div style={{ ...mutedText }}>Clique un bloc pour l’éditer</div>
                </div>
              </div>

              {!currentProcess ? (
                <div style={{ marginTop: 14, ...mutedText }}>
                  Aucune restitution : sélectionne un processus.
                </div>
              ) : (
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  {STEPS.map((s, i) => {
                    const state = currentProcess.state || {};
                    const value = state[s.key] || "";
                    const done = isFilled(value);

                    return (
                      <button
                        key={s.key}
                        onClick={() => goToStep(i)}
                        style={{
                          textAlign: "left",
                          borderRadius: 14,
                          border: "1px solid #e5e7eb",
                          background: done ? "#ffffff" : "#f9fafb",
                          padding: "10px 12px",
                          cursor: "pointer",
                          display: "grid",
                          gridTemplateColumns: "32px 1fr",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            background: done ? "#f8fafc" : "#f1f5f9",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 16,
                          }}
                          aria-hidden="true"
                        >
                          {s.icon}
                        </div>

                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 900 }}>{s.title}</div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: done ? "#16a34a" : "#94a3b8" }}>
                              {done ? "OK" : "—"}
                            </div>
                          </div>

                          <div style={{ color: done ? "#0f172a" : "#64748b", fontSize: 13, lineHeight: 1.35 }}>
                            {done ? value : "Non renseigné"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentProcess && (
                <div
                  style={{
                    marginTop: 14,
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: 12,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>État de soumission</div>

                  <div style={{ ...mutedText }}>
                    {currentCompletion.done ? (
                      <>
                        ✅ Interview complète. Tu peux <strong>soumettre</strong> depuis la colonne de gauche.
                      </>
                    ) : (
                      <>
                        ⏳ Interview incomplète : il manque{" "}
                        <strong>{currentCompletion.total - currentCompletion.filled}</strong> étape(s).
                      </>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
