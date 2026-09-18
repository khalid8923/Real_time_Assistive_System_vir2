"use client";

import * as React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Users,
  Mail,
  Building2,
  GraduationCap,
  Search,
  Trash2,
  Download,
  Loader2,
  Shield,
  Calendar,
  LogOut,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string;
  email: string;
  emailVerified: number;
  image: string | null;
  fullName: string | null;
  university: string | null;
  studentId: string | null;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل التحميل");
        return;
      }
      setUsers(data.users || []);
    } catch {
      setError("تعذّر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`متأكد إنك عايز تحذف "${name}"؟`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("فشل الحذف");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("تم الحذف");
    } catch {
      toast.error("فشل الاتصال");
    } finally {
      setDeleting(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "الاسم",
      "الإيميل",
      "الجامعة",
      "الرقم الجامعي",
      "الدور",
      "تاريخ التسجيل",
    ];
    const rows = users.map((u) => [
      u.name || "",
      u.email || "",
      u.university || "",
      u.studentId || "",
      u.role || "student",
      new Date(u.createdAt).toLocaleDateString("ar-EG"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير CSV");
  };

  const handleAdminLogout = async () => {
    if (!confirm("متأكد إنك عايز تسجل خروج؟")) return;
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const filtered = React.useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.university?.toLowerCase().includes(q) ||
        u.studentId?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ==================== HEADER ==================== */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-rose-600 shadow-lg shadow-violet-500/30">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                إدارة المستخدمين
              </h1>
              <p className="text-xs text-muted-foreground">
                {users.length} مستخدم
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={users.length === 0}
              className="gap-2 rounded-xl"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </Button>

            <Button
              onClick={fetchUsers}
              disabled={loading}
              className="gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              تحديث
            </Button>

            <Link
              href="/admin/settings"
              className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">الإعدادات</span>
            </Link>

            <Button
              variant="outline"
              onClick={handleAdminLogout}
              className="gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>

        {/* ==================== SEARCH ==================== */}
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الإيميل، الجامعة، أو الرقم الجامعي..."
            className="h-12 w-full rounded-xl border border-border bg-card pr-12 pl-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* ==================== STATS ==================== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="إجمالي المستخدمين"
            value={users.length}
            color="text-primary"
            bg="bg-primary/10"
            icon={Users}
          />
          <StatCard
            label="موثّقين"
            value={users.filter((u) => u.emailVerified).length}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            icon={Shield}
          />
          <StatCard
            label="اليوم"
            value={
              users.filter((u) => {
                const d = new Date(u.createdAt);
                const today = new Date();
                return d.toDateString() === today.toDateString();
              }).length
            }
            color="text-sky-500"
            bg="bg-sky-500/10"
            icon={Calendar}
          />
          <StatCard
            label="نتائج البحث"
            value={filtered.length}
            color="text-amber-500"
            bg="bg-amber-500/10"
            icon={Search}
          />
        </div>

        {/* ==================== ERROR ==================== */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ==================== LOADING ==================== */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              جارٍ تحميل البيانات...
            </p>
          </div>
        )}

        {/* ==================== TABLE ==================== */}
        {!loading && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      #
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        الاسم
                      </span>
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        الإيميل
                      </span>
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        الجامعة
                      </span>
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        الرقم الجامعي
                      </span>
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      الدور
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      التاريخ
                    </th>
                    <th className="p-4 text-xs font-bold text-muted-foreground">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-4 text-xs font-mono text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent-1 text-xs font-bold text-white">
                            {(user.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">
                              {user.name || "—"}
                            </p>
                            {user.fullName &&
                              user.fullName !== user.name && (
                                <p className="truncate text-[10px] text-muted-foreground">
                                  {user.fullName}
                                </p>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p
                          dir="ltr"
                          className="truncate text-xs text-foreground"
                        >
                          {user.email}
                        </p>
                        {user.emailVerified ? (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Shield className="h-2.5 w-2.5" />
                            موثّق
                          </span>
                        ) : (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            غير موثّق
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-foreground">
                        {user.university || "—"}
                      </td>
                      <td className="p-4">
                        <span
                          dir="ltr"
                          className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-foreground"
                        >
                          {user.studentId || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                            user.role === "teacher"
                              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          )}
                        >
                          {user.role === "teacher" ? "دكتور" : "طالب"}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(user.id, user.name || "المستخدم")
                          }
                          disabled={deleting === user.id}
                          aria-label="حذف"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                        >
                          {deleting === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ==================== EMPTY ==================== */}
        {!loading && filtered.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "مفيش نتائج للبحث ده" : "مفيش مستخدمين بعد"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
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
      <p className={cn("text-2xl font-black", color)}>{value}</p>
    </div>
  );
}