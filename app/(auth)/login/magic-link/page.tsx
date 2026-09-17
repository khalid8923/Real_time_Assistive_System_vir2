"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthForm, AuthInput, AuthError } from "@/components/auth/AuthForm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MagicLinkPage() {
  const supabase = React.useMemo(() => createClient(), []);
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
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (otpError) {
        setError("تعذّر إرسال الرابط. جرب تاني.");
        return;
      }

      setSent(true);
      toast.success("اتبعتلك لينك على الإيميل!");
    } catch {
      setError("تعذّر الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center" dir="rtl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/15">
            <Mail className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-bold">اتفضل اتفقد إيميلك ✉️</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          بعتنالك لينك على <strong>{email}</strong>
          <br />
          دوس عليه وهتدخل تلقائياً
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
        >
          <ArrowRight className="h-4 w-4" />
          ارجع لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 text-center">
        <h2 className="text-xl font-bold text-foreground">تسجيل دخول بدون باسورد</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          هنبعتلك لينك سحري على إيميلك
        </p>
      </header>

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />

        <AuthInput
          label="إيميل الجامعة"
          name="email"
          type="email"
          placeholder="student@university.edu.eg"
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
          className="h-11 w-full gap-2 bg-linear-to-l from-primary to-accent-1 font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الإرسال...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              ابعتلي اللينك
            </>
          )}
        </Button>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        فاكر الباسورد؟{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          ارجع لتسجيل الدخول العادي
        </Link>
      </p>
    </div>
  );
}