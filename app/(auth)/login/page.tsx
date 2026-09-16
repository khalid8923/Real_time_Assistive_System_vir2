"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AuthForm,
  AuthInput,
  AuthPasswordInput,
  AuthError,
  AuthDivider,
  type ValidationState,
} from "@/components/auth/AuthForm";
import GoogleButton from "@/components/auth/GoogleButton";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const emailRef = React.useRef<HTMLInputElement>(null);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [emailState, setEmailState] = React.useState<ValidationState>("idle");
  const [passwordState, setPasswordState] = React.useState<ValidationState>("idle");

  // Auto-focus the email field on mount
  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Debounced email validation
  React.useEffect(() => {
    if (email.length === 0) {
      setEmailState("idle");
      return;
    }
    const t = setTimeout(() => {
      setEmailState(EMAIL_REGEX.test(email.trim()) ? "valid" : "invalid");
    }, 450);
    return () => clearTimeout(t);
  }, [email]);

  // Debounced password validation
  React.useEffect(() => {
    if (password.length === 0) {
      setPasswordState("idle");
      return;
    }
    const t = setTimeout(() => {
      setPasswordState(password.length >= 6 ? "valid" : "invalid");
    }, 300);
    return () => clearTimeout(t);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("من فضلك اكتب إيميل صحيح.");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور لازم تكون 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("الإيميل أو كلمة المرور غير صحيحة.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("من فضلك أكّد إيميلك الأول. اتفقد صندوق الوارد.");
        } else {
          setError("حصل خطأ أثناء تسجيل الدخول. حاول تاني.");
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالسيرفر. حاول تاني.");
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="mb-6 text-center">
        <h2 className="text-xl font-bold text-foreground">أهلاً بيك تاني 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          سجّل دخولك عشان تكمل المحاضرة
        </p>
      </header>

      <GoogleButton mode="login" />

      <AuthDivider label="أو بالإيميل" />

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />

        <AuthInput
          ref={emailRef}
          label="إيميل الجامعة"
          name="email"
          type="email"
          placeholder="student@university.edu.eg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          validationState={emailState}
          successMessage="الإيميل شكله صح"
          error={emailState === "invalid" ? "صيغة الإيميل غير صحيحة" : undefined}
          required
          autoComplete="email"
          disabled={loading}
        />

        <AuthPasswordInput
          label="كلمة المرور"
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="h-4 w-4" />}
          validationState={passwordState}
          successMessage="كلمة المرور جاهزة"
          error={
            passwordState === "invalid"
              ? "كلمة المرور لازم 6 أحرف على الأقل"
              : undefined
          }
          required
          autoComplete="current-password"
          disabled={loading}
          minLength={6}
        />

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full gap-2 bg-linear-to-l from-primary to-accent-1 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ تسجيل الدخول...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </>
          )}
        </Button>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        معندكش حساب؟{" "}
        <Link
          href="/signup"
          className="font-bold text-primary hover:underline"
        >
          أنشئ حساب جديد
        </Link>
      </p>

      <div className="mt-8 border-t border-border pt-5">
        <button
          type="button"
          onClick={() => {
            document.cookie = "guest_mode=true; path=/; max-age=86400";
            window.location.href = "/";
          }}
          className="w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          🚀 الدخول التجريبي (بدون حساب)
        </button>
      </div>
    </div>
  );
}