"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Loader2,
  PlayCircle,
  Trash2,
  Sparkles,
  Quote,
  AlertTriangle,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Target,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";
import type { ArgumentMap, ArgumentNode, ArgumentLink } from "@/lib/ai-types";

interface ArgumentMapPanelProps {
  transcript: string;
}

const NODE_META: Record<
  ArgumentNode["type"],
  { label: string; icon: React.ElementType; bg: string; border: string; text: string }
> = {
  thesis: {
    label: "الأطروحة",
    icon: Target,
    bg: "bg-primary/10",
    border: "border-primary/50",
    text: "text-primary",
  },
  claim: {
    label: "حجة",
    icon: MessageSquare,
    bg: "bg-sky-500/10",
    border: "border-sky-500/40",
    text: "text-sky-600 dark:text-sky-400",
  },
  evidence: {
    label: "دليل",
    icon: FileText,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  counterargument: {
    label: "اعتراض",
    icon: ThumbsDown,
    bg: "bg-rose-500/10",
    border: "border-rose-500/40",
    text: "text-rose-600 dark:text-rose-400",
  },
  rebuttal: {
    label: "رد",
    icon: Shield,
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  conclusion: {
    label: "خلاصة",
    icon: ThumbsUp,
    bg: "bg-violet-500/10",
    border: "border-violet-500/40",
    text: "text-violet-600 dark:text-violet-400",
  },
};

const STRENGTH_META = {
  strong: { label: "قوي", color: "bg-emerald-500" },
  medium: { label: "متوسط", color: "bg-amber-500" },
  weak: { label: "ضعيف", color: "bg-rose-500" },
};

export default function ArgumentMapPanel({ transcript }: ArgumentMapPanelProps) {
  const [arguments_, setArguments] = React.useState<ArgumentMap[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canGenerate = transcript.trim().length >= 50 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visualize-argument", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data: { arguments?: ArgumentMap[]; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل استخراج الحجج.");
        return;
      }
      setArguments(data.arguments ?? []);
    } catch {
      setError("تعذّر الاتصال بالخدمة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-teal-500 to-cyan-500">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">خريطة الحجج</h2>
            <p className="text-[10px] text-muted-foreground">
              {arguments_.length > 0
                ? `${arguments_.length} حجة`
                : "بنية الجدل: أطروحة، أدلة، اعتراضات"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {arguments_.length > 0 && (
            <button
              type="button"
              onClick={() => setArguments([])}
              aria-label="حذف"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/15"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="gap-2 bg-linear-to-l from-primary to-accent-1 text-xs font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جارٍ التحليل...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                {arguments_.length > 0 ? "استخرج تاني" : "استخرج الحجج"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4"
            >
              <ErrorState
                category="provider"
                title="مش قادرين نستخرج الحجج"
                description={error}
                hint="الحجج بتظهر لما الدكتور يقول: بسبب، لأن، لكن، على العكس"
                onRetry={() => {
                  setError(null);
                  handleGenerate();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {arguments_.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">
              {canGenerate
                ? "اضغط (استخرج الحجج)"
                : "سجّل 50 حرف على الأقل الأول"}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              {canGenerate
                ? "هنلقط بنية الجدل: الأطروحة، الأدلة الداعمة، الاعتراضات، والردود"
                : "الحجج بتظهر في المحاضرات النقاشية والأبحاث"}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              بندوّر على بنية الجدل...
            </p>
          </div>
        )}

        {arguments_.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {arguments_.map((arg, idx) => (
              <ArgumentCard key={arg.id} arg={arg} index={idx} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ArgumentCard({ arg, index }: { arg: ArgumentMap; index: number }) {
  const [outlineMode, setOutlineMode] = React.useState(false);

  // Group nodes by type
  const nodesByType: Record<ArgumentNode["type"], ArgumentNode[]> = {
    thesis: [],
    claim: [],
    evidence: [],
    counterargument: [],
    rebuttal: [],
    conclusion: [],
  };
  for (const node of arg.nodes) {
    nodesByType[node.type].push(node);
  }

  // essay outline generator
  const outline = React.useMemo(() => {
    const lines: string[] = [];
    lines.push(`# ${arg.title}`);
    lines.push("");
    if (nodesByType.thesis[0]) {
      lines.push(`## المقدمة (الأطروحة)`);
      lines.push(`- ${nodesByType.thesis[0].text}`);
      lines.push("");
    }
    if (nodesByType.claim.length > 0) {
      lines.push(`## الحجج الداعمة`);
      nodesByType.claim.forEach((c, i) => {
        lines.push(`${i + 1}. ${c.text}`);
        // Evidence for this claim
        const supports = arg.links
          .filter((l) => l.relation === "supports" && l.to === c.id)
          .map((l) => arg.nodes.find((n) => n.id === l.from))
          .filter((n): n is ArgumentNode => !!n && n.type === "evidence");
        supports.forEach((ev) => {
          lines.push(`   - الدليل: ${ev.text}`);
        });
      });
      lines.push("");
    }
    if (nodesByType.counterargument.length > 0) {
      lines.push(`## الاعتراضات`);
      nodesByType.counterargument.forEach((ca) => {
        lines.push(`- ${ca.text}`);
        // Rebuttals
        const rebuttals = arg.links
          .filter((l) => l.relation === "refutes" && l.to === ca.id)
          .map((l) => arg.nodes.find((n) => n.id === l.from))
          .filter((n): n is ArgumentNode => !!n && n.type === "rebuttal");
        rebuttals.forEach((rb) => {
          lines.push(`   - الرد: ${rb.text}`);
        });
      });
      lines.push("");
    }
    if (nodesByType.conclusion[0]) {
      lines.push(`## الخلاصة`);
      lines.push(`- ${nodesByType.conclusion[0].text}`);
    }
    return lines.join("\n");
  }, [arg, nodesByType]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-border bg-background"
    >
      {/* Title */}
      <div className="border-b border-border bg-linear-to-l from-teal-500/8 to-cyan-500/5 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {index + 1}
            </span>
            <h3 className="text-sm font-bold">{arg.title}</h3>
          </div>
          <Button
            type="button"
            size="xs"
            variant={outlineMode ? "default" : "outline"}
            onClick={() => setOutlineMode((o) => !o)}
            className="gap-1 text-[10px]"
          >
            <FileText className="h-3 w-3" />
            {outlineMode ? "شكل الحجج" : "مخطط مقال"}
          </Button>
        </div>
        {arg.sourceQuote && (
          <div className="mt-2 mr-8 flex items-start gap-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-[10px] leading-snug text-primary/90">
            <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            <span className="italic">&ldquo;{arg.sourceQuote}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Warning for empty claims */}
      {arg.hasEmptyClaims && (
        <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-[11px]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-700 dark:text-amber-300">
            <strong>تحذير:</strong> في {arg.emptyClaimIds.length} حجة بدون دليل
            واضح في النص. تأكد من المحاضرة إذا كان ده كافٍ.
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {outlineMode ? (
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <pre
              className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground font-sans"
              dir="rtl"
            >
              {outline}
            </pre>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Thesis */}
            {nodesByType.thesis.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border-2 border-primary/50 bg-primary/10 p-4"
              >
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Target className="h-3 w-3" />
                  الأطروحة
                </p>
                <p className="text-sm font-bold text-foreground">{n.text}</p>
              </div>
            ))}

            {/* Claims with evidence */}
            {nodesByType.claim.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  الحجج الداعمة ({nodesByType.claim.length})
                </p>
                {nodesByType.claim.map((claim) => {
                  const supportingEvidence = arg.links
                    .filter((l) => l.relation === "supports" && l.to === claim.id)
                    .map((l) => arg.nodes.find((n) => n.id === l.from))
                    .filter(
                      (n): n is ArgumentNode => !!n && n.type === "evidence"
                    );
                  const meta = NODE_META.claim;
                  const Icon = meta.icon;
                  const strength = STRENGTH_META[claim.strength ?? "medium"];

                  return (
                    <div
                      key={claim.id}
                      className={cn("rounded-lg border p-3", meta.bg, meta.border)}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.text)} />
                          <p className="text-xs font-bold text-foreground">
                            {claim.text}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white",
                            strength.color
                          )}
                        >
                          {strength.label}
                        </span>
                      </div>

                      {supportingEvidence.length > 0 && (
                        <div className="ml-5 space-y-1 border-r-2 border-emerald-500/40 pr-2">
                          {supportingEvidence.map((ev) => (
                            <div key={ev.id} className="flex items-start gap-1.5">
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                              <p className="text-[10px] leading-snug text-emerald-700 dark:text-emerald-400">
                                <span className="font-bold">دليل: </span>
                                {ev.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Counterarguments with rebuttals */}
            {nodesByType.counterargument.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  الاعتراضات ({nodesByType.counterargument.length})
                </p>
                {nodesByType.counterargument.map((ca) => {
                  const rebuttals = arg.links
                    .filter((l) => l.relation === "refutes" && l.to === ca.id)
                    .map((l) => arg.nodes.find((n) => n.id === l.from))
                    .filter(
                      (n): n is ArgumentNode => !!n && n.type === "rebuttal"
                    );

                  return (
                    <div
                      key={ca.id}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                        <p className="text-xs font-bold text-foreground">{ca.text}</p>
                      </div>

                      {rebuttals.length > 0 && (
                        <div className="mt-2 ml-5 space-y-1 border-r-2 border-amber-500/40 pr-2">
                          {rebuttals.map((rb) => (
                            <div key={rb.id} className="flex items-start gap-1.5">
                              <Shield className="mt-0.5 h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                              <p className="text-[10px] leading-snug text-amber-700 dark:text-amber-300">
                                <span className="font-bold">رد: </span>
                                {rb.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Conclusion */}
            {nodesByType.conclusion.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-3"
              >
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  <ThumbsUp className="h-3 w-3" />
                  الخلاصة
                </p>
                <p className="text-xs font-bold text-foreground">{n.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}