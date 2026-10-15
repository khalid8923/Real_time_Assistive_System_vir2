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
      setError("من فضلك اكتب اسمك (حرفين على الأقل).");
      return;
    }
    if (university.trim().length < 2) {
      setError("من فضلك اكتب اسم الجامعة.");
      return;
    }
    if (studentId.trim().length < 3) {
      setError("من فضلك اكتب الرقم الجامعي.");
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
    if (password !== confirm) {
      setError("كلمتا المرور مش متطابقتين.");
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
          setError("الإيميل ده مسجل بالفعل. جرّب تسجل دخول.");
        } else if (msg.includes("password")) {
          setError("كلمة المرور ضعيفة. جرّب كلمة أقوى.");
        } else {
          setError(`خطأ: ${signUpError.message}`);
        }
        setLoading(false);
        return;
      }

      document.cookie =
        "guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setSuccess(true);
      toast.success("تم إنشاء الحساب! اتفضل اتفقد إيميلك للتحقق.", {
        duration: 6000,
      });
      window.setTimeout(() => {
        router.push(`/check-email?email=${encodeURIComponent(email.trim())}`);
      }, 900);
    } catch (err) {
      console.error("[signup] failed:", err);
      setError("تعذّر الاتصال بالسيرفر. حاول تاني.");
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
        <h2 className="text-xl font-bold text-foreground">أهلاً بيك! 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          أنشئ حسابك عشان تبدأ
        </p>
      </header>

      <GoogleButton mode="signup" />

      <AuthDivider label="أو بالبريد الإلكتروني" />

      <AuthForm onSubmit={handleSubmit}>
        <AuthError message={error} />

        <AuthInput
          ref={nameRef}
          label="الاسم الكامل"
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
          label="الجامعة"
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
          label="الرقم الجامعي"
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
          label="الإيميل"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          validationState={emailState}
          successMessage="الإيميل شكله صح"
          error={
            emailState === "invalid" ? "صيغة الإيميل غير صحيحة" : undefined
          }
          required
          autoComplete="email"
          disabled={loading}
          {...focusProps("email")}
        />

        <AuthPasswordInput
          label="كلمة المرور"
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          autoComplete="new-password"
          disabled={loading}
          minLength={6}
          {...focusProps("password")}
        />

        <AuthPasswordInput
          label="تأكيد كلمة المرور"
          name="confirm"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock className="h-4 w-4" />}
          validationState={confirmState}
          successMessage="كلمتا المرور متطابقتين"
          error={
            confirmState === "invalid" ? "كلمتا المرور مش متطابقتين" : undefined
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
              جارٍ إنشاء الحساب...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              تم الإنشاء
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              إنشاء الحساب
            </>
          )}
        </Button>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}