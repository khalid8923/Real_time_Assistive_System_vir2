"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

let mermaidInitialized = false;

export default function MermaidDiagram({
  code,
  className,
}: MermaidDiagramProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            themeVariables: {
              primaryColor: "#8470ff",
              primaryTextColor: "#ffffff",
              primaryBorderColor: "#5d47de",
              lineColor: "#8470ff",
              secondaryColor: "#67bfff",
              tertiaryColor: "#f1eeff",
              fontSize: "14px",
              fontFamily: "Cairo, sans-serif",
            },
            flowchart: { curve: "basis", padding: 16 },
            securityLevel: "loose",
          });
          mermaidInitialized = true;
        }

        if (!ref.current) return;
        if (cancelled) return;

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const { svg } = await mermaid.render(id, code);

        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setReady(true);
        setError(null);
      } catch (err) {
        console.error("[mermaid] render failed:", err);
        if (!cancelled) {
          setError("تعذّر رسم المخطط");
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!ready && !error) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      dir="rtl"
      className={`flex justify-center overflow-x-auto rounded-xl border border-border bg-muted/20 p-4 ${className ?? ""}`}
    />
  );
}