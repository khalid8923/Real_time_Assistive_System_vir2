"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
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
import { useLoginRateLimit } from "@/hooks/useLoginRateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const emailRef = React.useRef<HTMLInputElement>(null);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [emailState, setEmailState] = React.useState<ValidationState>("idle");
  const [passwordState, setPasswordState] =
    React.useState<ValidationState>("idle");

  const rateLimit = useLoginRateLimit();

  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

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

    if (rateLimit.isLocked) {
      setError(`محاولات كثيرة. حاول تاني بعد ${rateLimit.secondsLeft} ثانية.`);
      return;
    }

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
      const { error: signInError } = await signIn.email({
        email: email.trim(),
        password,
      });

      if (signInError) {
        rateLimit.registerFailure();
        const remaining = rateLimit.attemptsLeft - 1;

        const msg = signInError.message?.toLowerCase() || "";
        if (msg.includes("invalid") || msg.includes("credential")) {
          if (remaining > 0) {
            setError(
              `الإيميل أو كلمة المرور غير صحيحة. فاضل ${remaining} محاولة.`
            );
          } else {
            setError("تم قفل الحساب مؤقتاً لمدة دقيقة.");
          }
        } else {
          setError(signInError.message || "حصل خطأ أثناء تسجيل الدخول.");
        }
        setLoading(false);
        return;
      }

      rateLimit.registerSuccess();
      document.cookie =
        "guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.success("تم تسجيل الدخول بنجاح");
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("[login] failed:", err);
      setError("تعذّر الاتصال بالسيرفر. حاول تاني.");
      setLoading(false);
    }
  };

  const locked = rateLimit.isLocked;

  return (
    <div>
      <header className="mb-6 text-center">
        <Image
          src="/logo.png"
          alt="CaptionBridge"
          width={48}
          height={48}
          className="mx-auto mb-3 h-12 w-12 rounded-xl shadow-lg shadow-primary/20"
          priority
        />
        <h2 className="text-xl font-bold text-foreground">
          أهلاً بيك تاني 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          سجّل دخولك عشان تكمل المحاضرة
        </p>
      </header>

      <GoogleButton mode="login" />

      <AuthDivider label="أو بالإيميل" />

      {locked && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400">
              الحساب مقفول مؤقتاً
            </p>
            <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">
              حاول تاني بعد {rateLimit.secondsLeft} ثانية
            </p>
          </div>
        </div>
      )}

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
          disabled={loading || locked}
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
          disabled={loading || locked}
          minLength={6}
        />

        <Button
          type="submit"
          disabled={loading || locked}
          className="h-11 w-full gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ تسجيل الدخول...
            </>
          ) : locked ? (
            <>
              <ShieldAlert className="h-4 w-4" />
              مقفول ({rateLimit.secondsLeft}s)
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </>
          )}
        </Button>
      </AuthForm>

      <div className="mb-4 mt-6 text-center">
        <Link
          href="/login/magic-link"
          className="text-xs font-medium text-primary hover:underline"
        >
          ✨ أو سجّل دخول بدون باسورد (Magic Link)
        </Link>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{" "}
        <Link href="/signup" className="font-bold text-primary hover:underline">
          أنشئ حساباً جديداً
        </Link>
      </p>

      <div className="mt-6 space-y-3 border-t border-border pt-5">
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

        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/login";
          }}
          className="w-full text-center text-[10px] font-medium text-muted-foreground/60 transition-colors hover:text-violet-500"
        >
          🛡️ دخول الأدمن
        </button>
      </div>
    </div>
  );
}