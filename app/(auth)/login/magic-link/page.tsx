"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthForm, AuthInput, AuthError } from "@/components/auth/AuthForm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MagicLinkPage() {
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
      // Magic Link مش مدعوم في Better Auth حالياً
      // بنعمل رسالة توضيحية
      toast.info("Magic Link قريباً — استخدم الإيميل والباسورد حالياً");
      setError("Magic Link قريباً. استخدم الإيميل وكلمة المرور.");
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
          بعتنالك لينك على <strong className="text-foreground">{email}</strong>
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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent-1 shadow-lg shadow-primary/30">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          تسجيل دخول بدون باسورد
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          قريباً — استخدم الإيميل حالياً
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
          className="h-11 w-full gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
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