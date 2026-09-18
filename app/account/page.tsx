"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Calendar,
  Bookmark,
  Trash2,
  FolderOpen,
  FileText,
  Loader2,
  Sparkles,
  Save,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFullUser } from "@/app/actions/user";

interface FullUser {
  id: string;
  name: string;
  email: string;
  emailVerified: number;
  image: string | null;
  fullName: string | null;
  university: string | null;
  studentId: string | null;
  role: string | null;
  createdAt: number;
  updatedAt: number;
}

interface LocalLecture {
  id: string;
  name: string;
  createdAt: number;
  transcript: string;
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<FullUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lectures, setLectures] = React.useState<LocalLecture[]>([]);

  // Load user
  React.useEffect(() => {
    (async () => {
      const u = await getFullUser();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  // Load lectures from localStorage (temporary until we migrate)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("cb_saved_lectures");
      if (raw) {
        const parsed = JSON.parse(raw);
        setLectures(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setLectures([]);
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    router.push("/login");
    router.refresh();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`متأكد إنك عايز تحذف "${name}"؟`)) return;
    const updated = lectures.filter((l) => l.id !== id);
    setLectures(updated);
    try {
      localStorage.setItem("cb_saved_lectures", JSON.stringify(updated));
    } catch {
      /* ignore */
    }
    toast.success("تم الحذف");
  };

  const handleClearAll = () => {
    if (lectures.length === 0) return;
    if (!confirm(`متأكد إنك عايز تحذف ${lectures.length} محاضرة؟`)) return;
    setLectures([]);
    try {
      localStorage.removeItem("cb_saved_lectures");
    } catch {
      /* ignore */
    }
    toast.success("تم حذف كل المحاضرات");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <User className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          من فضلك سجّل دخول الأول
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-white"
        >
          تسجيل الدخول
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* ==================== PROFILE HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs"
        >
          <div className="relative h-32 bg-linear-to-br from-primary via-accent-1 to-accent-2">
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="relative -mt-16 flex flex-wrap items-end gap-4 px-6 pb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card bg-linear-to-br from-primary to-accent-1 text-3xl font-black text-white shadow-lg">
              {(user.name || user.email || "?").charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {user.name || user.fullName || "مستخدم"}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span dir="ltr">{user.email}</span>
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </motion.div>

        {/* ==================== INFO CARDS ==================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            icon={Building2}
            label="الجامعة"
            value={user.university || "—"}
            color="text-primary"
            bg="bg-primary/10"
          />
          <InfoCard
            icon={GraduationCap}
            label="الرقم الجامعي"
            value={user.studentId || "—"}
            color="text-sky-500"
            bg="bg-sky-500/10"
            ltr
          />
          <InfoCard
            icon={Sparkles}
            label="الدور"
            value={user.role === "teacher" ? "دكتور" : "طالب"}
            color="text-violet-500"
            bg="bg-violet-500/10"
          />
          <InfoCard
            icon={Calendar}
            label="عضو من"
            value={
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"
            }
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
        </div>

        {/* ==================== SAVED LECTURES ==================== */}
        <div className="rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bookmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  المحاضرات المحفوظة
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  {lectures.length} محاضرة
                </p>
              </div>
            </div>

            {lectures.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف الكل
              </Button>
            )}
          </div>

          <div className="p-4">
            {lectures.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  مفيش محاضرات محفوظة بعد
                </p>
                <p className="text-xs text-muted-foreground/70">
                  سجّل محاضرة واحفظها من الصفحة الرئيسية
                </p>
                <Button
                  onClick={() => router.push("/")}
                  className="mt-2 gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-white"
                >
                  <Save className="h-4 w-4" />
                  ابدأ التسجيل
                </Button>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {lectures.map((lecture) => (
                  <motion.li
                    key={lecture.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-foreground">
                          {lecture.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(lecture.createdAt).toLocaleDateString(
                              "ar-EG",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
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
                      <p className="mb-3 truncate rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary">
                        {lecture.topic}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toast.info("افتحها من القائمة الجانبية");
                          router.push("/");
                        }}
                        className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        فتح
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lecture.id, lecture.name)}
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
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  ltr = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            bg,
            color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p
        dir={ltr ? "ltr" : "rtl"}
        className="truncate text-sm font-bold text-foreground"
      >
        {value}
      </p>
    </div>
  );
}