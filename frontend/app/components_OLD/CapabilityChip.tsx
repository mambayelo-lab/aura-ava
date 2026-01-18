"use client";

import { useState } from "react";
import type { Capability } from "../page";

export function CapabilityChipComponent({
  capability,
  onValidate,
  onReject,
  onRename,
}: {
  capability: Capability;
  onValidate: () => void;
  onReject: () => void;
  onRename: (newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(capability.name);

  const displayName = capability.validated_name || capability.name;
  const isValidated = capability.status === "VALIDATED" || capability.status === "RENAMED";
  const isRejected = capability.status === "REJECTED";

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: isRejected ? "#f9fafb" : isValidated ? "#ecfdf5" : "#ffffff",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: isRejected ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        {editing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              if (editValue.trim() && editValue !== capability.name) {
                onRename(editValue.trim());
              }
              setEditing(false);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && editValue.trim()) {
                if (editValue.trim() !== capability.name) {
                  onRename(editValue.trim());
                }
                setEditing(false);
              }
            }}
            autoFocus
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #0f172a",
              fontSize: 14,
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4,
              }}
              onClick={() => setEditing(true)}
            >
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Confiance: {capability.confidence}% • {capability.inference_method}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {!isValidated && !isRejected && (
          <>
            <button
              onClick={onValidate}
              title="Valider"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✅ Valider
            </button>
            <button
              onClick={() => setEditing(true)}
              title="Renommer"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              ✏️ Renommer
            </button>
            <button
              onClick={onReject}
              title="Supprimer"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              ❌ Supprimer
            </button>
          </>
        )}
        {isValidated && (
          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>✓ Validé</div>
        )}
        {isRejected && (
          <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>✗ Rejeté</div>
        )}
      </div>
    </div>
  );
}

