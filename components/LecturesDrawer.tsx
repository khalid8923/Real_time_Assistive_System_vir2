"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bookmark,
  X,
  Save,
  Trash2,
  FolderOpen,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useLocalLectures,
  type SavedLecture,
} from "@/hooks/useLocalLectures";

interface LecturesDrawerProps {
  open: boolean;
  onClose: () => void;
  currentTranscript: string;
  currentTopic?: string;
  currentChildren?: string[];
  currentTerms?: { term: string; definition: string }[];
  onLoad: (lecture: SavedLecture) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LecturesDrawer({
  open,
  onClose,
  currentTranscript,
  currentTopic,
  currentChildren,
  currentTerms,
  onLoad,
}: LecturesDrawerProps) {
  const { lectures, saveLecture, deleteLecture } = useLocalLectures();
  const [name, setName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) setName("");
  }, [open]);

  const canSave = currentTranscript.trim().length > 0;

  const handleSave = () => {
    if (!canSave) {
      toast.error("مفيش محتوى للحفظ");
      return;
    }

    const finalName =
      name.trim() ||
      currentTopic?.trim() ||
      `محاضرة ${new Date().toLocaleDateString("ar-EG")}`;

    saveLecture({
      name: finalName,
      transcript: currentTranscript,
      topic: currentTopic ?? "",
      children: currentChildren ?? [],
      terms: currentTerms ?? [],
    });

    setName("");
    toast.success("تم حفظ المحاضرة!");
  };

  const handleLoad = (lecture: SavedLecture) => {
    onLoad(lecture);
    onClose();
    toast.success(`تم تحميل: ${lecture.name}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-background/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            dir="rtl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="المحاضرات المحفوظة"
            className="fixed left-0 top-0 z-100 flex h-full w-full max-w-md flex-col border-r border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Bookmark className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    المحاضرات المحفوظة
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    {lectures.length} محاضرة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Save section */}
            <div className="border-b border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  حفظ المحاضرة الحالية
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={currentTopic || "اسم المحاضرة (اختياري)"}
                  disabled={!canSave}
                  className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  maxLength={80}
                />
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="h-10 gap-1.5 rounded-xl bg-linear-to-l from-primary to-accent-1 px-4 text-xs font-bold text-white shadow-md"
                >
                  <Save className="h-3.5 w-3.5" />
                  احفظ
                </Button>
              </div>
              {!canSave && (
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  سجّل محتوى الأول عشان تقدر تحفظه
                </p>
              )}
            </div>

            {/* Lectures list */}
            <div className="flex-1 overflow-y-auto p-4">
              {lectures.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-14 text-center">
                  <Bookmark className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    مفيش محاضرات محفوظة بعد
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    احفظ أول محاضرة عشان ترجع لها بسهولة
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {lectures.map((lecture: SavedLecture) => (
                    <motion.li
                      key={lecture.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-foreground">
                            {lecture.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(lecture.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {lecture.transcript
                                .split(/\s+/)
                                .filter(Boolean).length}{" "}
                              كلمة
                            </span>
                          </div>
                        </div>
                      </div>

                      {lecture.topic && (
                        <p className="mb-2 truncate rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                          {lecture.topic}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoad(lecture)}
                          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          فتح
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteLecture(lecture.id);
                            toast.success("تم الحذف");
                          }}
                          aria-label="حذف"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}