"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthForm, AuthInput, AuthError } from "@/components/auth/AuthForm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("من فضلك اكتب إيميل صحيح.");
      return;
    }

    setLoading(true);
    try {
      const { error: apiError } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });
      if (apiError) {
        setError(apiError.message || "فشل الإرسال.");
        setLoading(false);
        return;
      }
      setSent(true);
      toast.success("بعتنالك لينك إعادة التعيين ✉️");
    } catch {
      setError("تعذّر الاتصال بالسيرفر.");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div dir="rtl" className="text-center">
        <Image src="/logo.png" alt="CaptionBridge" width={56} height={56} className="mx-auto mb-4 rounded-xl" priority />
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" strokeWidth={1.5} />
        <h1 className="mb-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
          اتفضل اتفقد إيميلك ✉️
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          بعتنالك رابط لإعادة تعيين كلمة المرور على{" "}
          <strong className="text-foreground" dir="ltr">{email}</strong>
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          رجوع لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <Image src="/logo.png" alt="CaptionBridge" width={56} height={56} className="mx-auto mb-4 rounded-xl" priority />
      <div className="mb-5 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
          <KeyRound className="h-7 w-7 text-primary" />
        </div>
      </div>

      <header className="mb-6 text-center">
        <h1 className="text-xl font-bold">نسيت كلمة المرور؟</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هنبعتلك لينك لإعادة التعيين على إيميلك
        </p>
      </header>

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />
        <AuthInput
          label="الإيميل"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          required
          autoComplete="email"
          disabled={loading}
          autoFocus
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-sm font-bold text-white shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الإرسال...
            </>
          ) : (
            "ابعتلي لينك الإعادة"
          )}
        </Button>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        فاكر كلمة المرور؟{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          رجوع لتسجيل الدخول
        </Link>
      </p>
    </div>
  );
}