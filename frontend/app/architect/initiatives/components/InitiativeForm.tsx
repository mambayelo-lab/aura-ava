"use client";

import { useState } from "react";

type InitiativeData = {
  title: string;
  type: "TRANSFORMATION" | "DECISION";
  criticality: "LOW" | "MEDIUM" | "HIGH";
  scope: string;
  objectives: string[];
  key_issues: string[];
  tags: string[];
};

type Props = {
  onSubmit: (data: InitiativeData) => void;
  initialData?: Partial<InitiativeData>;
  submitLabel?: string;
};

export default function InitiativeForm({ onSubmit, initialData, submitLabel = "Créer" }: Props) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState<"TRANSFORMATION" | "DECISION">(
    initialData?.type || "TRANSFORMATION"
  );
  const [criticality, setCriticality] = useState<"LOW" | "MEDIUM" | "HIGH">(
    initialData?.criticality || "MEDIUM"
  );
  const [scope, setScope] = useState(initialData?.scope || "");
  const [objectives, setObjectives] = useState<string[]>(initialData?.objectives || []);
  const [keyIssues, setKeyIssues] = useState<string[]>(initialData?.key_issues || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  const [newObjective, setNewObjective] = useState("");
  const [newKeyIssue, setNewKeyIssue] = useState("");
  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      type,
      criticality,
      scope,
      objectives,
      key_issues: keyIssues,
      tags,
    });
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const addKeyIssue = () => {
    if (newKeyIssue.trim()) {
      setKeyIssues([...keyIssues, newKeyIssue.trim()]);
      setNewKeyIssue("");
    }
  };

  const removeKeyIssue = (index: number) => {
    setKeyIssues(keyIssues.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
          Titre *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
            Type *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "TRANSFORMATION" | "DECISION")}
            required
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="TRANSFORMATION">Transformation</option>
            <option value="DECISION">Décision</option>
          </select>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
            Criticité *
          </label>
          <select
            value={criticality}
            onChange={(e) => setCriticality(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
            required
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Élevée</option>
          </select>
        </div>
      </div>

      <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
          Périmètre *
        </label>
        <textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          required
          rows={3}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
          Objectifs
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addObjective())}
            placeholder="Ajouter un objectif"
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={addObjective}
            style={{
              padding: "8px 16px",
              background: "#f1f5f9",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Ajouter
          </button>
        </div>
        {objectives.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {objectives.map((obj, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "#f8fafc",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: 13 }}>{obj}</span>
                <button
                  type="button"
                  onClick={() => removeObjective(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "#ef4444",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
          Enjeux clés
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={newKeyIssue}
            onChange={(e) => setNewKeyIssue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyIssue())}
            placeholder="Ajouter un enjeu"
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={addKeyIssue}
            style={{
              padding: "8px 16px",
              background: "#f1f5f9",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Ajouter
          </button>
        </div>
        {keyIssues.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {keyIssues.map((issue, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "#f8fafc",
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: 13 }}>{issue}</span>
                <button
                  type="button"
                  onClick={() => removeKeyIssue(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "#ef4444",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
          type="submit"
          style={{
            padding: "12px 24px",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

