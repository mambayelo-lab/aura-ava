"use client";

import Link from "next/link";

type Props = {
  initiative: any;
  overview: any;
  onCreateInterview: () => void;
};

export default function DecisionGuidePanel({ initiative, overview, onCreateInterview }: Props) {
  const hasInterview = (overview?.linked_interviews?.length || 0) > 0;
  const hasProcess = (overview?.linked_processes?.length || 0) > 0;
  const hasObjectives = (initiative?.objectives?.length || 0) > 0;
  const hasKeyIssues = (initiative?.key_issues?.length || 0) > 0;

  const checks = [
    {
      label: "Interview existante liée",
      status: hasInterview ? "ok" : "missing",
      icon: hasInterview ? "✅" : "⏳",
    },
    {
      label: "Processus lié",
      status: hasProcess ? "ok" : "missing",
      icon: hasProcess ? "✅" : "⏳",
    },
    {
      label: "Objectifs définis",
      status: hasObjectives ? "ok" : "missing",
      icon: hasObjectives ? "✅" : "⏳",
    },
    {
      label: "Enjeux identifiés",
      status: hasKeyIssues ? "ok" : "missing",
      icon: hasKeyIssues ? "✅" : "⏳",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Guide de décision */}
      <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Guide de décision</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {checks.map((check, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 8,
                background: check.status === "ok" ? "#ecfdf5" : "#fff7ed",
                borderRadius: 6,
                border: `1px solid ${check.status === "ok" ? "#d1fae5" : "#fed7aa"}`,
              }}
            >
              <span style={{ fontSize: 16 }}>{check.icon}</span>
              <span style={{ fontSize: 13, color: check.status === "ok" ? "#065f46" : "#7c2d12" }}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Actions</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={onCreateInterview}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Créer/Lancer Interview AVA
          </button>
          <Link
            href="/architect"
            style={{
              display: "block",
              width: "100%",
              padding: "12px 16px",
              background: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              textDecoration: "none",
              textAlign: "center",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Voir interviews existantes
          </Link>
          <button
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
            disabled
          >
            Générer architectures (bientôt)
          </button>
        </div>
      </div>
    </div>
  );
}

