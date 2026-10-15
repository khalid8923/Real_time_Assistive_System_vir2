"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Construction } from "lucide-react";
import { toast } from "sonner";
import AppShell, { type ViewMode } from "@/components/AppShell";
import SpeechInput, { type AnalysisData } from "@/components/SpeechInput";
import MindMap, { type MindMapTopic } from "@/components/MindMap";
import GlossaryPanel, { type GlossaryTerm } from "@/components/GlossaryPanel";
import SummaryPanel from "@/components/SummaryPanel";
import KeywordsPanel from "@/components/KeywordsPanel";
import FlashcardsPanel from "@/components/FlashcardsPanel";
import ActionItemsPanel from "@/components/ActionItemsPanel";
import ClassroomQuestionsPanel from "@/components/ClassroomQuestionsPanel";
import ComparisonTablePanel from "@/components/ComparisonTablePanel";
import AnalogyMapPanel from "@/components/AnalogyMapPanel";
import EquationsPanel from "@/components/EquationsPanel";
import SystemExplorerPanel from "@/components/SystemExplorerPanel";
import VisualizeThisPanel from "@/components/VisualizeThisPanel";
import CausalLoopPanel from "@/components/CausalLoopPanel";
import ArgumentMapPanel from "@/components/ArgumentMapPanel";
import LectureTimelinePanel from "@/components/LectureTimelinePanel";
import FlowDiagramPanel from "@/components/FlowDiagramPanel";
import InfographicPanel from "@/components/InfographicPanel";
import FloatingChat from "@/components/FloatingChat";
import QuickActions from "@/components/QuickActions";
import ScrollToTop from "@/components/ScrollToTop";
import Breadcrumbs from "@/components/Breadcrumbs";
import ErrorBoundary from "@/components/ErrorBoundary";
import LecturesDrawer from "@/components/LecturesDrawer";
import { getFeature, type FeatureId } from "@/lib/features";
import { useSpeechTranscription } from "@/hooks/useSpeechTranscription";
import type { SavedLecture } from "@/lib/db";
import type { ActionItem, ClassroomQuestion } from "@/lib/ai-types";

interface Notification {
  id: number;
  action: string;
  time: string;
}

export default function Page() {
  const [view, setView] = useState<ViewMode>("student");
  const [activeFeature, setActiveFeature] = useState<FeatureId>("captions");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lecturesOpen, setLecturesOpen] = useState(false);
  const [loadedLecture, setLoadedLecture] = useState<SavedLecture | null>(null);

  const speech = useSpeechTranscription();

  const [allTopics, setAllTopics] = useState<MindMapTopic[]>([]);
  const [allTerms, setAllTerms] = useState<GlossaryTerm[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [classroomQuestions, setClassroomQuestions] = useState<
    ClassroomQuestion[]
  >([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastSentFeedback, setLastSentFeedback] = useState<string | null>(null);
  const [doctorReply, setDoctorReply] = useState<{
    type: string;
    at: number;
  } | null>(null);
  const [studentKey, setStudentKey] = useState<string>("");
  const [flash, setFlash] = useState<{ mode: "ask" | "repeat"; key: number } | null>(null);

  useEffect(() => {
    try {
      let key = localStorage.getItem("cb_student_key");
      if (!key) {
        key =
          "sk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("cb_student_key", key);
      }
      setStudentKey(key);
    } catch {
      setStudentKey("sk_anon_" + Math.random().toString(36).slice(2, 10));
    }
  }, []);

  useEffect(() => {
    if (!studentKey) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(
          "/api/notify-doctor/check?key=" + encodeURIComponent(studentKey),
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (data && data.reply && data.reply.type) {
          setDoctorReply({ type: data.reply.type, at: data.reply.at });
          const text =
            data.reply.type === "replied"
              ? "الدكتور رد عليك"
              : "الدكتور بيقولك تعلالي في المكتب بعد المحاضرة";
          toast.success(text, { duration: 8000 });
        }
      } catch {
        /* ignore */
      }
    };
    const id = setInterval(poll, 3000);
    poll();
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [studentKey]);

  useEffect(() => {
    if (speech.isListening) {
      setLoadedLecture(null);
    }
  }, [speech.isListening]);

  const handleAnalyze = useCallback((data: AnalysisData) => {
    if (data.topic && data.topic.trim() !== "") {
      setAllTopics((prev) => {
        if (prev.some((t) => t.topic === data.topic)) return prev;
        return [
          ...prev,
          {
            topic: data.topic,
            children: data.children,
            firstSeenAt: Date.now(),
          },
        ];
      });
    }

    if (data.terms.length > 0) {
      setAllTerms((prev) => {
        const existing = new Set(prev.map((t) => t.term));
        const newTerms = data.terms.filter((t) => !existing.has(t.term));
        if (newTerms.length === 0) return prev;
        return [...prev, ...newTerms];
      });
    }
  }, []);

  const handleActionItemNotify = useCallback((item: ActionItem) => {
    const icon =
      item.type === "exam" ? "🚨" : item.type === "assignment" ? "📝" : "⚡";
    toast.warning(`${icon} ${item.title}`, {
      description: item.details.slice(0, 100),
      duration: 7000,
    });
  }, []);

  const handleLoadLecture = useCallback((lecture: SavedLecture) => {
    setLoadedLecture(lecture);

    let topic = "";
    let children: string[] = [];
    let terms: { term: string; definition: string }[] = [];

    if (lecture.mindMapJson) {
      try {
        const parsed = JSON.parse(lecture.mindMapJson);
        topic = parsed.topic || "";
        children = parsed.children || [];
      } catch {
        // ignore
      }
    }

    if (lecture.glossaryJson) {
      try {
        terms = JSON.parse(lecture.glossaryJson);
      } catch {
        // ignore
      }
    }

    setAllTopics(topic ? [{ topic, children, firstSeenAt: Date.now() }] : []);
    setAllTerms(terms);
    setActiveFeature("captions");
  }, []);

  const handleAction = useCallback(
    async (action: "ask" | "re-explain") => {
      const text = action === "ask" ? "عايز أسأل ✋" : "أعد الشرح 🔄";
      const time = new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const newNotif: Notification = {
        id: Date.now(),
        action: text,
        time,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Trigger the highlighter sweep animation
      setFlash({ mode: action === "ask" ? "ask" : "repeat", key: Date.now() });

      if (action === "ask" && studentKey) {
        try {
          const res = await fetch("/api/notify-doctor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentKey }),
          });
          if (res.ok) {
            setLastSentFeedback(`تم إرسال "${text}" للدكتور ✅`);
          } else {
            const data = await res.json().catch(() => ({}));
            toast.error(data.error || "فشل إرسال الإشعار");
            setLastSentFeedback(null);
          }
        } catch {
          toast.error("تعذّر الاتصال بالسيرفر");
          setLastSentFeedback(null);
        }
      } else {
        setLastSentFeedback(`تم إرسال "${text}" للدكتور`);
      }

      window.setTimeout(() => setLastSentFeedback(null), 2500);
    },
    [studentKey]
  );

  const displayTranscript =
    loadedLecture?.transcript || speech.currentTranscript;
  const latestTopic =
    allTopics.length > 0 ? allTopics[allTopics.length - 1].topic : "";
  const latestChildren =
    allTopics.length > 0 ? allTopics[allTopics.length - 1].children : [];

  const renderFeature = () => {
    switch (activeFeature) {
      case "captions":
        return (
          <SpeechInput
            currentTranscript={displayTranscript}
            refinedChunks={speech.refinedChunks}
            isListening={speech.isListening}
            onToggleMic={() =>
              speech.isListening
                ? speech.stopListening()
                : speech.startListening()
            }
            onAnalyze={handleAnalyze}
            onClearTranscript={() => {
              speech.clearTranscript();
              setFlash(null);
            }}
            error={speech.error}
            flashMode={flash?.mode ?? null}
            flashKey={flash?.key ?? 0}
          />
        );
      case "mindmap":
        return <MindMap topics={allTopics} />;
      case "glossary":
        return <GlossaryPanel terms={allTerms} onAction={handleAction} />;
      case "summary":
        return <SummaryPanel transcript={displayTranscript} />;
      case "keywords":
        return <KeywordsPanel transcript={displayTranscript} />;
      case "flashcards":
        return <FlashcardsPanel transcript={displayTranscript} />;
      case "actionItems":
        return (
          <ActionItemsPanel
            transcript={displayTranscript}
            items={actionItems}
            onItemsChange={setActionItems}
            onNotify={handleActionItemNotify}
          />
        );
      case "classroomQuestions":
        return (
          <ClassroomQuestionsPanel
            transcript={displayTranscript}
            questions={classroomQuestions}
            onQuestionsChange={setClassroomQuestions}
          />
        );
      case "argument":
        return <ArgumentMapPanel transcript={displayTranscript} />;
      case "causal":
        return <CausalLoopPanel transcript={displayTranscript} />;
      case "visualize":
        return <VisualizeThisPanel transcript={displayTranscript} />;
      case "system":
        return <SystemExplorerPanel transcript={displayTranscript} />;
      case "equations":
        return <EquationsPanel transcript={displayTranscript} />;
      case "analogy":
        return <AnalogyMapPanel transcript={displayTranscript} />;
      case "timeline":
        return (
          <LectureTimelinePanel
            refinedChunks={speech.refinedChunks}
            currentTranscript={displayTranscript}
          />
        );
      case "comparison":
        return <ComparisonTablePanel transcript={displayTranscript} />;
      case "flowDiagram":
        return <FlowDiagramPanel transcript={displayTranscript} />;
      case "infographic":
        return <InfographicPanel transcript={displayTranscript} />;
      default:
        return <ComingSoon featureId={activeFeature} />;
    }
  };

  return (
    <>
      <AppShell
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
        view={view}
        onViewChange={setView}
        isLive={true}
        sidebarOpen={sidebarOpen}
        footer={
          <QuickActions
            onAsk={() => handleAction("ask")}
            onRepeat={() => handleAction("re-explain")}
          />
        }
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenLectures={() => setLecturesOpen(true)}
      >
        {view === "student" ? (
          <div dir="rtl" className="space-y-4" id="main-content">
            <Breadcrumbs items={[{ label: getFeature(activeFeature).label }]} />

            {doctorReply && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  "flex items-start gap-3 rounded-2xl border p-4 shadow-sm " +
                  (doctorReply.type === "replied"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-amber-500/30 bg-amber-500/10")
                }
              >
                <span className="text-2xl" aria-hidden="true">
                  {doctorReply.type === "replied" ? "✅" : "🚶"}
                </span>
                <div className="flex-1">
                  <p
                    className={
                      "text-sm font-bold " +
                      (doctorReply.type === "replied"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400")
                    }
                  >
                    {doctorReply.type === "replied"
                      ? "الدكتور رد عليك"
                      : "الدكتور بيقولك تعلالي في المكتب بعد المحاضرة"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {doctorReply.type === "replied"
                      ? "اسمع رد الدكتور في القاعة"
                      : "متنساش تروحله بعد ما المحاضرة تخلص"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDoctorReply(null)}
                  aria-label="إغلاق"
                  className="text-lg leading-none text-muted-foreground transition-colors hover:text-foreground"
                >
                  ×
                </button>
              </motion.div>
            )}

            {renderFeature()}
          </div>
        ) : (
          <div
            className="glass rounded-2xl border border-border p-6"
            dir="rtl"
            id="main-content"
          >
            <h2 className="mb-6 text-xl font-bold">لوحة إشعارات الدكتور</h2>
            {notifications.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">
                لا توجد إشعارات من الطلاب حالياً.
              </p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-lg">
                        🔔
                      </span>
                      <span className="font-semibold">{notif.action}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {notif.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        <FloatingChat transcript={displayTranscript} />

        <AnimatePresence>
          {lastSentFeedback && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-2xl"
            >
              ✓ {lastSentFeedback}
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollToTop />
      </AppShell>

      <LecturesDrawer
        open={lecturesOpen}
        onClose={() => setLecturesOpen(false)}
        currentTranscript={speech.currentTranscript}
        currentTopic={latestTopic}
        currentChildren={latestChildren}
        currentTerms={allTerms}
        onLoad={handleLoadLecture}
      />
    </>
  );
}

function ComingSoon({ featureId }: { featureId: FeatureId }) {
  const feature = getFeature(featureId);
  return (
    <div className="glass flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-2xl border border-border p-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Construction className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{feature.label}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {feature.description}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-xs font-semibold text-primary">
          قريباً — جارٍ التطوير
        </span>
      </div>
    </div>
  );
}