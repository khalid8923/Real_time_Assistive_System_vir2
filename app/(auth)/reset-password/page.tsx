"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthForm, AuthPasswordInput, AuthError } from "@/components/auth/AuthForm";

type State = "form" | "success" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [state, setState] = React.useState<State>("form");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setState("invalid");
      return;
    }
    setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("كلمة المرور لازم 6 أحرف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور مش متطابقتين.");
      return;
    }
    setLoading(true);
    try {
      const { error: apiError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (apiError) {
        setError(apiError.message || "فشل التعيين. الرابط ممكن يكون منتهي.");
        setLoading(false);
        return;
      }
      setState("success");
      toast.success("تم تعيين كلمة المرور 🎉");
      window.setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("تعذّر الاتصال بالسيرفر.");
      setLoading(false);
    }
  };

  if (state === "invalid") {
    return (
      <div dir="rtl" className="text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive" strokeWidth={1.5} />
        <h1 className="mb-2 text-xl font-bold text-destructive">رابط غير صالح</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          الرابط مش موجود أو منتهي الصلاحية.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
        >
          اطلب رابط جديد
        </Link>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div dir="rtl" className="text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" strokeWidth={1.5} />
        <h1 className="mb-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
          تم تعيين كلمة المرور 🎉
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          جارٍ تحويلك لصفحة تسجيل الدخول...
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
        >
          تسجيل الدخول الآن
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <header className="mb-6 text-center">
        <h1 className="text-xl font-bold">تعيين كلمة مرور جديدة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          اختر كلمة مرور قوية لحسابك
        </p>
      </header>

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />

        <AuthPasswordInput
          label="كلمة المرور الجديدة"
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="h-4 w-4" />}
          required
          autoComplete="new-password"
          disabled={loading}
          minLength={6}
          autoFocus
        />

        <AuthPasswordInput
          label="تأكيد كلمة المرور"
          name="confirm"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock className="h-4 w-4" />}
          required
          autoComplete="new-password"
          disabled={loading}
          minLength={6}
        />

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-sm font-bold text-white shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            "حفظ كلمة المرور"
          )}
        </Button>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-bold text-primary hover:underline">
          رجوع لتسجيل الدخول
        </Link>
      </p>
    </div>
  );
}