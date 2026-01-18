/**
 * Chat conversationnel (colonne centrale)
 * 
 * Style ChatGPT, avec LLM reformulé, UX fluide
 * Gère les phases spéciales (CHAIN_VISUAL_CONFIRM, EVENT_VARIANTS, etc.)
 */

import type { ConversationLogEntry } from "../types/interviewState";
import { EventCardEditableComponent } from "./EventCardEditable";
import { CapabilityChipComponent } from "./CapabilityChip";

interface ConversationalChatProps {
  messages: ConversationLogEntry[];
  currentQuestion?: string;
  currentAnswer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  // Props pour les phases spéciales
  currentPhase?: string;
  events?: any[];
  currentEventIndex?: number;
  onEventEdit?: (eventId: string, newLabel: string) => void;
  onEventDelete?: (eventId: string) => void;
  onEventMoveUp?: (eventId: string) => void;
  onEventMoveDown?: (eventId: string) => void;
  onChainConfirm?: (confirmed: boolean) => void;
  onVariantYes?: () => void;
  onVariantNo?: () => void;
  onVariantSubmit?: () => void;
  capabilities?: any[];
  onCapabilityValidate?: (id: string) => void;
  onCapabilityReject?: (id: string) => void;
  onCapabilityRename?: (id: string, newName: string) => void;
  onCapabilitiesValidated?: () => void;
  completion9Q?: any;
  onCompletenessCheck?: () => void;
  onFinishChaining?: () => void;
}

export default function ConversationalChat({
  messages,
  currentQuestion,
  currentAnswer,
  onAnswerChange,
  onSubmit,
  disabled = false,
  placeholder = "Votre réponse...",
  currentPhase,
  events = [],
  currentEventIndex = 0,
  onEventEdit,
  onEventDelete,
  onEventMoveUp,
  onEventMoveDown,
  onChainConfirm,
  onVariantYes,
  onVariantNo,
  onVariantSubmit,
  capabilities = [],
  onCapabilityValidate,
  onCapabilityReject,
  onCapabilityRename,
  onCapabilitiesValidated,
  completion9Q,
  onCompletenessCheck,
  onFinishChaining,
}: ConversationalChatProps) {
  // Phases spéciales qui nécessitent un rendu personnalisé
  const isSpecialPhase = currentPhase === "CHAIN_VISUAL_CONFIRM" || 
                        currentPhase === "EVENT_VARIANTS" ||
                        currentPhase === "CAPABILITY_CONFIRMATION" ||
                        currentPhase === "COMPLETENESS_CHECK" ||
                        currentPhase === "SUBMISSION_READY" ||
                        currentPhase === "CAPABILITY_INFERENCE";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#ffffff",
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.length === 0 && currentQuestion && !isSpecialPhase && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#0f172a",
              alignSelf: "flex-start",
              maxWidth: "80%",
            }}
          >
            {currentQuestion}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: 12,
                borderRadius: 12,
                background: msg.role === "user" ? "#0f172a" : "#f8fafc",
                color: msg.role === "user" ? "#fff" : "#0f172a",
                border: msg.role === "user" ? "none" : "1px solid #e5e7eb",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {currentQuestion && messages.length > 0 && !isSpecialPhase && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#0f172a",
              alignSelf: "flex-start",
              maxWidth: "80%",
            }}
          >
            {currentQuestion}
          </div>
        )}

        {/* Phase spéciale : CHAIN_VISUAL_CONFIRM */}
        {currentPhase === "CHAIN_VISUAL_CONFIRM" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
              {currentQuestion || "Cette séquence reflète-t-elle correctement la réalité métier ?"}
            </div>
            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#64748b" }}>
                Réorganisez et modifiez les événements si nécessaire
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {events
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((event: any, displayIndex: number) => (
                    <EventCardEditableComponent
                      key={event.id}
                      event={event}
                      displayIndex={displayIndex}
                      onEdit={(newLabel: string) => onEventEdit?.(event.id, newLabel)}
                      onDelete={() => onEventDelete?.(event.id)}
                      onMoveUp={() => onEventMoveUp?.(event.id)}
                      onMoveDown={() => onEventMoveDown?.(event.id)}
                      canMoveUp={displayIndex > 0}
                      canMoveDown={displayIndex < events.length - 1}
                    />
                  ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onChainConfirm?.(true)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "#0f172a",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                ✔️ Oui, c'est correct
              </button>
              <button
                onClick={() => onChainConfirm?.(false)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                ❌ Non, modifier
              </button>
            </div>
          </div>
        )}

        {/* Phase spéciale : EVENT_VARIANTS */}
        {currentPhase === "EVENT_VARIANTS" && events[currentEventIndex] && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {currentQuestion || `Est-ce qu'il arrive que "${events[currentEventIndex].label}" se produise autrement ou pose problème ?`}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onVariantYes}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "#0f172a",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Oui, ajouter une variante
              </button>
              <button
                onClick={onVariantNo}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Non, pas de variante
              </button>
            </div>
          </div>
        )}

        {/* Phase spéciale : CAPABILITY_CONFIRMATION */}
        {currentPhase === "CAPABILITY_CONFIRMATION" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {currentQuestion || "Est-ce que l'entreprise doit savoir faire ces choses dans ce périmètre ?"}
            </div>
            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
              {capabilities.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>Aucune capability inférée.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {capabilities.map((cap: any) => (
                    <CapabilityChipComponent
                      key={cap.id}
                      capability={cap}
                      onValidate={() => onCapabilityValidate?.(cap.id)}
                      onReject={() => onCapabilityReject?.(cap.id)}
                      onRename={(newName) => onCapabilityRename?.(cap.id, newName)}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onCapabilitiesValidated}
              disabled={capabilities.filter((c: any) => c.status === "VALIDATED" || c.status === "RENAMED").length === 0}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: capabilities.filter((c: any) => c.status === "VALIDATED" || c.status === "RENAMED").length > 0 ? "#0f172a" : "#e5e7eb",
                color: capabilities.filter((c: any) => c.status === "VALIDATED" || c.status === "RENAMED").length > 0 ? "#fff" : "#9ca3af",
                cursor: capabilities.filter((c: any) => c.status === "VALIDATED" || c.status === "RENAMED").length > 0 ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 700,
                alignSelf: "flex-start",
              }}
            >
              ✓ Valider et continuer
            </button>
          </div>
        )}

        {/* Phase spéciale : COMPLETENESS_CHECK */}
        {currentPhase === "COMPLETENESS_CHECK" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {currentQuestion || "Vérification de complétude selon le framework 9Q. Tous les critères sont-ils remplis ?"}
            </div>
            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "grid", gap: 12 }}>
                {completion9Q && [
                  { label: "Pourquoi (événements métier)", check: completion9Q.why },
                  { label: "Quoi (événements validés)", check: completion9Q.what },
                  { label: "Qui (acteurs identifiés)", check: completion9Q.who },
                  { label: "Quand (chaîne d'événements)", check: completion9Q.when },
                  { label: "Comment (capabilities)", check: completion9Q.how },
                  { label: "Avec quoi (applications)", check: completion9Q.with_what },
                  { label: "Règles (policies)", check: completion9Q.rules },
                  { label: "Variantes", check: completion9Q.variants },
                  { label: "Impacts (intégrations)", check: completion9Q.impacts },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderRadius: 8,
                      background: item.check ? "#ecfdf5" : "#fef2f2",
                      border: `1px solid ${item.check ? "#86efac" : "#fecaca"}`,
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{item.check ? "✅" : "❌"}</div>
                    <div style={{ fontSize: 14, fontWeight: item.check ? 700 : 400 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onCompletenessCheck}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: "#0f172a",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                alignSelf: "flex-start",
              }}
            >
              ✓ Vérifier la complétude
            </button>
          </div>
        )}

        {/* Phase spéciale : CAPABILITY_INFERENCE */}
        {currentPhase === "CAPABILITY_INFERENCE" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", padding: 40, width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Inférence des capabilities en cours...</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Analyse des événements, règles métier et applications pour identifier les capabilities.
            </div>
            {disabled && <div style={{ fontSize: 12, color: "#64748b" }}>⏳ Veuillez patienter...</div>}
          </div>
        )}
      </div>

      {/* Input zone (masquée pour les phases spéciales) */}
      {!isSpecialPhase && (
        <div
          style={{
            padding: 16,
            borderTop: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !disabled && currentAnswer.trim()) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
                background: disabled ? "#f9fafb" : "#fff",
              }}
            />
            <button
              onClick={onSubmit}
              disabled={disabled || !currentAnswer.trim()}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: disabled || !currentAnswer.trim() ? "#e5e7eb" : "#0f172a",
                color: disabled || !currentAnswer.trim() ? "#9ca3af" : "#fff",
                cursor: disabled || !currentAnswer.trim() ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Envoyer
            </button>
          </div>
          {currentPhase === "EVENT_CHAINING" && events.length >= 1 && onFinishChaining && (
            <button
              onClick={onFinishChaining}
              style={{
                marginTop: 8,
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                color: "#0f172a",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                alignSelf: "flex-start",
              }}
            >
              ✓ C'est tout pour les événements
            </button>
          )}
        </div>
      )}

      {/* Zone de saisie pour variante (si activée) */}
      {currentPhase === "EVENT_VARIANTS" && currentAnswer && (
        <div
          style={{
            padding: 16,
            borderTop: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && currentAnswer.trim() && !disabled) {
                  e.preventDefault();
                  onVariantSubmit?.();
                }
              }}
              placeholder="Décrivez la variante ou l'exception..."
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                outline: "none",
                background: disabled ? "#f9fafb" : "#fff",
              }}
            />
            <button
              onClick={onVariantSubmit}
              disabled={disabled || !currentAnswer.trim()}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: disabled || !currentAnswer.trim() ? "#e5e7eb" : "#0f172a",
                color: disabled || !currentAnswer.trim() ? "#9ca3af" : "#fff",
                cursor: disabled || !currentAnswer.trim() ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                alignSelf: "flex-start",
              }}
            >
              Valider la variante
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

