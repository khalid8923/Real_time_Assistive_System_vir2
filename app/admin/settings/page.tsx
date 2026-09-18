"use client";

import * as React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Shield,
  Lock,
  KeyRound,
  Save,
  Loader2,
  ArrowRight,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const [current, setCurrent] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const passwordStrength = React.useMemo(() => {
    if (newPass.length === 0) return { level: 0, label: "", color: "" };
    let score = 0;
    if (newPass.length >= 8) score++;
    if (newPass.length >= 12) score++;
    if (/[A-Z]/.test(newPass)) score++;
    if (/[0-9]/.test(newPass)) score++;
    if (/[^A-Za-z0-9]/.test(newPass)) score++;

    if (score <= 2) return { level: 1, label: "ضعيف", color: "bg-rose-500" };
    if (score === 3) return { level: 2, label: "متوسط", color: "bg-amber-500" };
    if (score === 4) return { level: 3, label: "قوي", color: "bg-emerald-500" };
    return { level: 4, label: "قوي جداً", color: "bg-emerald-600" };
  }, [newPass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current.trim(),
          newPassword: newPass.trim(),
          confirmPassword: confirm.trim(),
        }),
      });

      const data: { ok?: boolean; error?: string } = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "فشل التغيير.");
        return;
      }

      setSuccess(true);
      setCurrent("");
      setNewPass("");
      setConfirm("");
      toast.success("تم تغيير الباسورد بنجاح!");
    } catch {
      setError("تعذّر الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-rose-600 shadow-lg shadow-violet-500/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                إعدادات الأدمن
              </h1>
              <p className="text-xs text-muted-foreground">
                إدارة أمان الحساب
              </p>
            </div>
          </div>

          <Link
            href="/admin/users"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <Users className="h-3.5 w-3.5" />
            المستخدمين
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Change password card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border-2 border-violet-500/20 bg-card shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-border/60 bg-linear-to-l from-violet-500/5 to-rose-500/5 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <KeyRound className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                تغيير الباسورد
              </h2>
              <p className="text-[10px] text-muted-foreground">
                يُنصح بباسورد قوي + 12 حرف
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="h-4 w-4" />
                تم التغيير بنجاح!
              </motion.div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <PasswordField
              label="الباسورد الحالي"
              value={current}
              onChange={setCurrent}
              show={showCurrent}
              onToggleShow={() => setShowCurrent((v) => !v)}
              placeholder="••••••••••••"
            />

            <PasswordField
              label="الباسورد الجديد"
              value={newPass}
              onChange={setNewPass}
              show={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
              placeholder="••••••••••••"
            />

            {/* Strength meter */}
            {newPass.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">قوة الباسورد</span>
                  <span
                    className={cn(
                      passwordStrength.level >= 3
                        ? "text-emerald-500"
                        : passwordStrength.level === 2
                        ? "text-amber-500"
                        : "text-rose-500"
                    )}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-all",
                        n <= passwordStrength.level
                          ? passwordStrength.color
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <PasswordField
              label="تأكيد الباسورد الجديد"
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              onToggleShow={() => setShowConfirm((v) => !v)}
              placeholder="••••••••••••"
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full gap-2 rounded-xl bg-linear-to-l from-violet-600 to-rose-600 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ الباسورد الجديد
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Info */}
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">ملاحظة أمنية:</strong>{" "}
              الباسورد بيتخزن <strong>مشفّر</strong> (scrypt) في قاعدة
              البيانات. لو الباسورد الجديد محصلش، النظام هيرجع لباسورد
              الـ <code className="rounded bg-muted px-1">.env</code> الافتراضي.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-foreground">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "h-12 w-full rounded-xl border-2 border-border bg-muted/30 px-3 pr-10 pl-11 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
            "focus:border-violet-500 focus:bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          )}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "إخفاء" : "إظهار"}
          className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}