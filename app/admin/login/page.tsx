"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Shield, Loader2, Lock, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim().length === 0) {
      setError("من فضلك اكتب الباسورد.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data: { ok?: boolean; error?: string } = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "باسورد خاطئ.");
        return;
      }

      toast.success("مرحباً يا أدمن!");
      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-rose-600 shadow-xl shadow-violet-500/30">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              لوحة الأدمن
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              دخول محمي — للمشرفين فقط
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border-2 border-violet-500/20 bg-card p-6 shadow-2xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-400">
                منطقة محظورة — الدخول مسجل
              </span>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
              >
                {error}
              </motion.p>
            )}

            {/* Password input */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-sm font-bold text-foreground"
              >
                باسورد الأدمن
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  autoComplete="off"
                  className={cn(
                    "h-12 w-full rounded-xl border-2 border-violet-500/20 bg-muted/30 px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
                    "focus:border-violet-500 focus:bg-background focus:outline-none focus:ring-2 focus:ring-violet-500/20",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full gap-2 rounded-xl bg-linear-to-l from-violet-600 to-rose-600 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ التحقق...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  دخول محمي
                </>
              )}
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              رجوع لتسجيل الدخول العادي
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}