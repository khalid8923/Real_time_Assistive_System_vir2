"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  Bookmark,
  Search,
  Calendar,
  FileText,
  Trash2,
  FolderOpen,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getMyLectures,
  deleteMyLecture,
} from "@/app/actions/lectures";
import type { SavedLecture } from "@/lib/db";

interface LecturesTabProps {
  onOpenLecture?: (lecture: SavedLecture) => void;
}

export default function LecturesTab({ onOpenLecture }: LecturesTabProps) {
  const [lectures, setLectures] = React.useState<SavedLecture[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [deleting, setDeleting] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const data = await getMyLectures();
      setLectures(data);
      setLoading(false);
    })();
  }, []);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return lectures;
    const q = search.trim().toLowerCase();
    return lectures.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.transcript.toLowerCase().includes(q)
    );
  }, [lectures, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`متأكد إنك عايز تحذف "${name}"؟`)) return;
    setDeleting(id);
    const res = await deleteMyLecture(id);
    if (res.ok) {
      setLectures((prev) => prev.filter((l) => l.id !== id));
      toast.success("تم الحذف");
    } else {
      toast.error("فشل الحذف");
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في محاضراتك..."
          className="h-12 w-full rounded-xl border border-border bg-card pr-12 pl-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-bold text-foreground">
            {search ? "مفيش نتائج" : "مفيش محاضرات محفوظة بعد"}
          </p>
          <p className="text-xs text-muted-foreground">
            {search
              ? "جرّب كلمة تانية"
              : "سجّل محاضرة واحفظها من الصفحة الرئيسية"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lecture, i) => (
            <motion.div
              key={lecture.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent-1 text-white shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(lecture.id, lecture.name)}
                  disabled={deleting === lecture.id}
                  aria-label="حذف"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  {deleting === lecture.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <h3 className="mb-1 line-clamp-2 text-sm font-bold text-foreground">
                {lecture.name}
              </h3>

              {lecture.summary && (
                <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {lecture.summary}
                </p>
              )}

              <div className="mb-3 mt-auto flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(lecture.createdAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {lecture.wordCount} كلمة
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenLecture?.(lecture)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                فتح المحاضرة
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}