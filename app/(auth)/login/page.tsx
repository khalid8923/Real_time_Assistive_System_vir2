"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Loader2,
  LogIn,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
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
import AuthCompanion, {
  type AuthCompanionState,
} from "@/components/auth/AuthCompanion";
import { useLoginRateLimit } from "@/hooks/useLoginRateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [passwordState, setPasswordState] =
    React.useState<ValidationState>("idle");

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
  }, [
    success,
    loading,
    error,
    passwordFocused,
    passwordVisible,
    emailFocused,
    email.length,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rateLimit.isLocked) {
      setError(`Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙƒØ«ÙŠØ±Ø©. Ø­Ø§ÙˆÙ„ ØªØ§Ù†ÙŠ Ø¨Ø¹Ø¯ ${rateLimit.secondsLeft} Ø«Ø§Ù†ÙŠØ©.`);
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Ù…Ù† ÙØ¶Ù„Ùƒ Ø§ÙƒØªØ¨ Ø¥ÙŠÙ…ÙŠÙ„ ØµØ­ÙŠØ­.");
      return;
    }
    if (password.length < 6) {
      setError("ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù„Ø§Ø²Ù… ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„.");
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
              ? `Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©. ÙØ§Ø¶Ù„ ${remaining} Ù…Ø­Ø§ÙˆÙ„Ø©.`
              : "ØªÙ… Ù‚ÙÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…Ø¤Ù‚ØªØ§Ù‹ Ù„Ù…Ø¯Ø© Ø¯Ù‚ÙŠÙ‚Ø©."
          );
        } else {
          setError(signInError.message || "Ø­ØµÙ„ Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.");
        }
        setLoading(false);
        return;
      }

      rateLimit.registerSuccess();
      document.cookie =
        "guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setSuccess(true);
      toast.success("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 550);
    } catch (err) {
      console.error("[login] failed:", err);
      setError("ØªØ¹Ø°Ù‘Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø³ÙŠØ±ÙØ±. Ø­Ø§ÙˆÙ„ ØªØ§Ù†ÙŠ.");
      setLoading(false);
    }
  };

  const locked = rateLimit.isLocked;

  return (
    <div>
      <div className="mb-5 flex justify-center">
        <AuthCompanion
          state={companionState}
          className="w-24 sm:w-28 md:w-32"
        />
      </div>

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
          Ø£Ù‡Ù„Ø§Ù‹ Ø¨ÙŠÙƒ ØªØ§Ù†ÙŠ ðŸ‘‹
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ø³Ø¬Ù‘Ù„ Ø¯Ø®ÙˆÙ„Ùƒ Ø¹Ø´Ø§Ù† ØªÙƒÙ…Ù„ Ø§Ù„Ù…Ø­Ø§Ø¶Ø±Ø©
        </p>
      </header>

      {locked && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400">
              Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…Ù‚ÙÙˆÙ„ Ù…Ø¤Ù‚ØªØ§Ù‹
            </p>
            <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">
              Ø­Ø§ÙˆÙ„ ØªØ§Ù†ÙŠ Ø¨Ø¹Ø¯ {rateLimit.secondsLeft} Ø«Ø§Ù†ÙŠØ©
            </p>
          </div>
        </div>
      )}

      {needsVerification && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="mb-2 text-sm font-bold text-amber-700 dark:text-amber-400">
            âœ‰ï¸ Ø¥ÙŠÙ…ÙŠÙ„Ùƒ Ù„Ø³Ù‡ Ù…Ø´ Ù…ØªØ£ÙƒØ¯
          </p>
          <p className="mb-3 text-xs text-amber-700/80 dark:text-amber-400/80">
            Ù„Ø§Ø²Ù… ØªØ£ÙƒØ¯ Ø¥ÙŠÙ…ÙŠÙ„Ùƒ Ø§Ù„Ø£ÙˆÙ„ Ù‚Ø¨Ù„ Ù…Ø§ ØªÙ‚Ø¯Ø± ØªØ³Ø¬Ù„ Ø¯Ø®ÙˆÙ„.
          </p>
          <Link
            href={`/check-email?email=${encodeURIComponent(needsVerification)}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white hover:bg-amber-600"
          >
            Ø§Ø¨Ø¹ØªÙ„ÙŠ Ù„ÙŠÙ†Ùƒ Ø¬Ø¯ÙŠØ¯
          </Link>
        </div>
      )}

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />

        <AuthInput
          ref={emailRef}
          label="Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          icon={<Mail className="h-4 w-4" />}
          validationState={emailState}
          successMessage="Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ Ø´ÙƒÙ„Ù‡ ØµØ­"
          error={
            emailState === "invalid" ? "ØµÙŠØºØ© Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ ØºÙŠØ± ØµØ­ÙŠØ­Ø©" : undefined
          }
          required
          autoComplete="email"
          disabled={loading || locked}
        />

        <AuthPasswordInput
          label="ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"
          name="password"
          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          onVisibilityChange={setPasswordVisible}
          icon={<Lock className="h-4 w-4" />}
          validationState={passwordState}
          successMessage="ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¬Ø§Ù‡Ø²Ø©"
          error={
            passwordState === "invalid"
              ? "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù„Ø§Ø²Ù… 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„"
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
              Ø¬Ø§Ø±Ù ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              ØªÙ… Ø§Ù„Ø¯Ø®ÙˆÙ„
            </>
          ) : locked ? (
            <>
              <ShieldAlert className="h-4 w-4" />
              Ù…Ù‚ÙÙˆÙ„ ({rateLimit.secondsLeft}s)
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„
            </>
          )}
        </Button>
      </AuthForm>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ Ø­Ø³Ø§Ø¨ØŸ{" "}
        <Link href="/signup" className="font-bold text-primary hover:underline">
          Ø£Ù†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹
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
          ðŸš€ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠ (Ø¨Ø¯ÙˆÙ† Ø­Ø³Ø§Ø¨)
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/login";
          }}
          className="w-full text-center text-[10px] font-medium text-muted-foreground/60 transition-colors hover:text-violet-500"
        >
          ðŸ›¡ï¸ Ø¯Ø®ÙˆÙ„ Ø§Ù„Ø£Ø¯Ù…Ù†
        </button>
      </div>
    </div>
  );
}