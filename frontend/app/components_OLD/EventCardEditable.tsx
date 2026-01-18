"use client";

import { useState } from "react";
import type { DomainEvent } from "../page";

export function EventCardEditableComponent({
  event,
  displayIndex,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  event: DomainEvent;
  displayIndex: number;
  onEdit: (newLabel: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(event.label);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          style={{
            padding: "4px 8px",
            fontSize: 12,
            background: canMoveUp ? "#f1f5f9" : "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            cursor: canMoveUp ? "pointer" : "not-allowed",
            opacity: canMoveUp ? 1 : 0.5,
          }}
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          style={{
            padding: "4px 8px",
            fontSize: 12,
            background: canMoveDown ? "#f1f5f9" : "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            cursor: canMoveDown ? "pointer" : "not-allowed",
            opacity: canMoveDown ? 1 : 0.5,
          }}
        >
          ↓
        </button>
      </div>
      
      <div style={{ flex: 1 }}>
        {editing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              if (editValue.trim()) {
                onEdit(editValue.trim());
              }
              setEditing(false);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                if (editValue.trim()) {
                  onEdit(editValue.trim());
                }
                setEditing(false);
              }
              if (e.key === "Escape") {
                setEditValue(event.label);
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
          <div
            onClick={() => setEditing(true)}
            style={{
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: 8,
              borderRadius: 8,
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            {displayIndex + 1}. {event.label}
          </div>
        )}
      </div>
      
      <button
        onClick={onDelete}
        style={{
          padding: "6px 12px",
          fontSize: 12,
          background: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Supprimer
      </button>
    </div>
  );
}

