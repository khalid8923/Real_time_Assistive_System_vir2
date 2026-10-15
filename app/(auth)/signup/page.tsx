"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Loader2,
  UserPlus,
  GraduationCap,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "name" | "university" | "studentId" | "email" | "password" | "confirm";

export default function SignupPage() {
  const router = useRouter();
  const nameRef = React.useRef<HTMLInputElement>(null);

  const [name, setName] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [emailState, setEmailState] = React.useState<ValidationState>("idle");
  const [passwordState, setPasswordState] =
    React.useState<ValidationState>("idle");
  const [confirmState, setConfirmState] =
    React.useState<ValidationState>("idle");

  const [focused, setFocused] = React.useState<Field | null>(null);
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  React.useEffect(() => {
    nameRef.current?.focus();
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
    if (confirm.length === 0) {
      setConfirmState("idle");
      return;
    }
    const t = setTimeout(() => {
      setConfirmState(confirm === password ? "valid" : "invalid");
    }, 300);
    return () => clearTimeout(t);
  }, [confirm, password]);

  React.useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, university, studentId, email, password, confirm]);

  const companionState: AuthCompanionState = React.useMemo(() => {
    if (success) return "success";
    if (loading) return "submitting";
    if (error) return "error";
    if (focused === "password" || focused === "confirm") {
      return passwordVisible ? "password-visible" : "password-focus";
    }
    if (focused) return "email-focus";
    return "idle";
  }, [success, loading, error, focused, passwordVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Ù…Ù† ÙØ¶Ù„Ùƒ Ø§ÙƒØªØ¨ Ø§Ø³Ù…Ùƒ (Ø­Ø±ÙÙŠÙ† Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„).");
      return;
    }
    if (university.trim().length < 2) {
      setError("Ù…Ù† ÙØ¶Ù„Ùƒ Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.");
      return;
    }
    if (studentId.trim().length < 3) {
      setError("Ù…Ù† ÙØ¶Ù„Ùƒ Ø§ÙƒØªØ¨ Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ.");
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
    if (password !== confirm) {
      setError("ÙƒÙ„Ù…ØªØ§ Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø´ Ù…ØªØ·Ø§Ø¨Ù‚ØªÙŠÙ†.");
      return;
    }

    setLoading(true);

    try {
      const signUpData = {
        email: email.trim(),
        password,
        name: name.trim(),
        fullName: name.trim(),
        university: university.trim(),
        studentId: studentId.trim(),
        role: "student",
      };

      const { error: signUpError } = await signUp.email(signUpData as never);

      if (signUpError) {
        console.error("[signup error]", signUpError.message);
        const msg = signUpError.message?.toLowerCase() || "";
        if (msg.includes("already") || msg.includes("exists")) {
          setError("Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ Ø¯Ù‡ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„. Ø¬Ø±Ù‘Ø¨ ØªØ³Ø¬Ù„ Ø¯Ø®ÙˆÙ„.");
        } else if (msg.includes("password")) {
          setError("ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¶Ø¹ÙŠÙØ©. Ø¬Ø±Ù‘Ø¨ ÙƒÙ„Ù…Ø© Ø£Ù‚ÙˆÙ‰.");
        } else {
          setError(`Ø®Ø·Ø£: ${signUpError.message}`);
        }
        setLoading(false);
        return;
      }

      document.cookie =
        "guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setSuccess(true);
      toast.success("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨! Ø§ØªÙØ¶Ù„ Ø§ØªÙÙ‚Ø¯ Ø¥ÙŠÙ…ÙŠÙ„Ùƒ Ù„Ù„ØªØ­Ù‚Ù‚.", {
        duration: 6000,
      });
      window.setTimeout(() => {
        router.push(`/check-email?email=${encodeURIComponent(email.trim())}`);
      }, 900);
    } catch (err) {
      console.error("[signup] failed:", err);
      setError("ØªØ¹Ø°Ù‘Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø³ÙŠØ±ÙØ±. Ø­Ø§ÙˆÙ„ ØªØ§Ù†ÙŠ.");
      setLoading(false);
    }
  };

  const focusProps = (field: Field) => ({
    onFocus: () => setFocused(field),
    onBlur: () => setFocused((f) => (f === field ? null : f)),
  });

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
        <h2 className="text-xl font-bold text-foreground">Ø£Ù‡Ù„Ø§Ù‹ Ø¨ÙŠÙƒ! ðŸ‘‹</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ø£Ù†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ùƒ Ø¹Ø´Ø§Ù† ØªØ¨Ø¯Ø£
        </p>
      </header>

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />

        <AuthInput
          ref={nameRef}
          label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="h-4 w-4" />}
          required
          autoComplete="name"
          disabled={loading}
          minLength={2}
          {...focusProps("name")}
        />

        <AuthInput
          label="Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©"
          name="university"
          type="text"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          icon={<Building2 className="h-4 w-4" />}
          required
          disabled={loading}
          minLength={2}
          {...focusProps("university")}
        />

        <AuthInput
          label="Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ"
          name="studentId"
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          icon={<GraduationCap className="h-4 w-4" />}
          required
          disabled={loading}
          minLength={3}
          {...focusProps("studentId")}
        />

        <AuthInput
          label="Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          validationState={emailState}
          successMessage="Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ Ø´ÙƒÙ„Ù‡ ØµØ­"
          error={
            emailState === "invalid" ? "ØµÙŠØºØ© Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ ØºÙŠØ± ØµØ­ÙŠØ­Ø©" : undefined
          }
          required
          autoComplete="email"
          disabled={loading}
          {...focusProps("email")}
        />

        <AuthPasswordInput
          label="ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"
          name="password"
          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          autoComplete="new-password"
          disabled={loading}
          minLength={6}
          {...focusProps("password")}
        />

        <AuthPasswordInput
          label="ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"
          name="confirm"
          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock className="h-4 w-4" />}
          validationState={confirmState}
          successMessage="ÙƒÙ„Ù…ØªØ§ Ø§Ù„Ù…Ø±ÙˆØ± Ù…ØªØ·Ø§Ø¨Ù‚ØªÙŠÙ†"
          error={
            confirmState === "invalid" ? "ÙƒÙ„Ù…ØªØ§ Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø´ Ù…ØªØ·Ø§Ø¨Ù‚ØªÙŠÙ†" : undefined
          }
          required
          autoComplete="new-password"
          disabled={loading}
          minLength={6}
          {...focusProps("confirm")}
        />

        <Button
          type="submit"
          disabled={loading || success}
          className="h-11 w-full gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ø¬Ø§Ø±Ù Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              ØªÙ… Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨
            </>
          )}
        </Button>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ù„Ø¯ÙŠÙƒ Ø­Ø³Ø§Ø¨ Ø¨Ø§Ù„ÙØ¹Ù„ØŸ{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„
        </Link>
      </p>
    </div>
  );
}