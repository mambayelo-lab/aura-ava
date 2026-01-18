"use client";

import { useEffect, useRef } from "react";

interface MermaidDiagramProps {
  mermaidCode: string;
  title?: string;
}

export default function MermaidDiagram({ mermaidCode, title }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !mermaidCode) return;

    // Charger Mermaid dynamiquement
    const loadMermaid = async () => {
      try {
        // @ts-ignore - Mermaid sera chargé dynamiquement
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ 
          startOnLoad: true,
          theme: "default",
          securityLevel: "loose",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
          // Style arrondi (Ardoq style)
          themeVariables: {
            primaryColor: "#0f172a",
            primaryTextColor: "#ffffff",
            primaryBorderColor: "#0f172a",
            lineColor: "#64748b",
            secondaryColor: "#f8fafc",
            tertiaryColor: "#ffffff",
          },
        });

        // Nettoyer le conteneur
        containerRef.current!.innerHTML = "";

        // Créer un ID unique pour ce diagramme
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Générer le diagramme
        mermaid.render(id, mermaidCode).then((result: { svg: string }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = result.svg;
          }
            }).catch((err: Error) => {
              if (containerRef.current) {
                // Fallback JSON visuel si Mermaid invalide
                try {
                  const jsonData = JSON.parse(mermaidCode);
                  containerRef.current.innerHTML = `<div style="padding: 20px; color: #0f172a; text-align: left;">
                    <div style="font-weight: 700; margin-bottom: 12px; font-size: 14px;">Représentation JSON (fallback)</div>
                    <pre style="padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 11px; overflow: auto; border: 1px solid #e5e7eb;">${JSON.stringify(jsonData, null, 2)}</pre>
                  </div>`;
                } catch {
                  containerRef.current.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align: center;">
                    <div style="font-weight: 700; margin-bottom: 8px;">Erreur de rendu Mermaid</div>
                    <div style="font-size: 12px; color: #64748b;">${err.message}</div>
                    <pre style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 11px; overflow: auto; text-align: left;">${mermaidCode}</pre>
                  </div>`;
                }
              }
            });
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align: center;">
            <div style="font-weight: 700; margin-bottom: 8px;">Erreur de chargement Mermaid</div>
            <div style="font-size: 12px; color: #64748b;">Impossible de charger la bibliothèque Mermaid</div>
          </div>`;
        }
      }
    };

    loadMermaid();
  }, [mermaidCode]);

  if (!mermaidCode || mermaidCode.trim().length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 14 }}>Aucun diagramme disponible</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {title && (
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{title}</div>
      )}
      <div
        ref={containerRef}
        style={{
          padding: 24,
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "auto",
          minHeight: 200,
        }}
      />
    </div>
  );
}

