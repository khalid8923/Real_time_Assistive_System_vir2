"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, LogIn, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  AuthForm,
  AuthInput,
  AuthPasswordInput,
  AuthError,
  type ValidationState,
} from "@/components/auth/AuthForm";
import AuthCompanion, {
  type AuthCompanionState,
} from "@/components/auth/AuthCompanion";
import { useLoginRateLimit } from "@/hooks/useLoginRateLimit";

const EMAIL_REGEX = /^[^s@]+@[^s@]+.[^s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const emailRef = React.useRef<HTMLInputElement>(null);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [needsVerification, setNeedsVerification] = React.useState<string | null>(null);

  const [emailState, setEmailState] = React.useState<ValidationState>("idle");
  const [passwordState, setPasswordState] = React.useState<ValidationState>("idle");

  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const [passwordVisible, setPasswordVisible] = React.useState(false);

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

  React.useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const companionState: AuthCompanionState = React.useMemo(() => {
    if (success) return "success";
    if (loading) return "submitting";
    if (error) return "error";
    if (passwordFocused)
      return passwordVisible ? "password-visible" : "password-focus";
    if (emailFocused || email.length > 0) return "email-focus";
    return "idle";
  }, [success, loading, error, passwordFocused, passwordVisible, emailFocused, email.length]);

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
        const code = (signInError as { code?: string }).code || "";

        if (
          code === "EMAIL_NOT_VERIFIED" ||
          msg.includes("not verified") ||
          msg.includes("verif")
        ) {
          setNeedsVerification(email.trim());
          setError(null);
        } else if (msg.includes("invalid") || msg.includes("credential")) {
          setError(
            remaining > 0
              ? `الإيميل أو كلمة المرور غير صحيحة. فاضل ${remaining} محاولة.`
              : "تم قفل الحساب مؤقتاً لمدة دقيقة."
          );
        } else {
          setError(signInError.message || "حصل خطأ أثناء تسجيل الدخول.");
        }
        setLoading(false);
        return;
      }

      rateLimit.registerSuccess();
      document.cookie =
        "guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setSuccess(true);
      toast.success("تم تسجيل الدخول بنجاح");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 550);
    } catch (err) {
      console.error("[login] failed:", err);
      setError("تعذّر الاتصال بالسيرفر. حاول تاني.");
      setLoading(false);
    }
  };

  const locked = rateLimit.isLocked;

  return (
    <div>
      <div className="mb-5 flex justify-center">
        <AuthCompanion state={companionState} className="w-24 sm:w-28 md:w-32" />
      </div>

      <header className="m         حاول تاني بعد {rateLimit.secondsLeft} ثانية
            </p>
          </div>
        </div>
      )}

      {needsVerification && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="mb-2 text-sm font-bold text-amber-700 dark:text-amber-400">
            ✉️ إيميلك لسه مش متأكد
          </p>
          <p className="mb-3 text-xs text-amber-700/80 dark:text-amber-400/80">
            لازم تأكد إيميلك الأول قبل ما تقدر تسجل دخول.
          </p>
          <Link
            href={`/check-email?email=${encodeURIComponent(needsVerification)}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white hover:bg-amber-600"
          >
            ابعتلي لينك جديد
          </Link>
        </div>
      )}

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />

        <AuthInput
          ref={emailRef}
          label="الإيميل"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
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
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          onVisibilityChange={setPasswordVisible}
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
          disabled={loading || locked || success}
          className="h-11 w-full gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ تسجيل الدخول...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              تم الدخول
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
