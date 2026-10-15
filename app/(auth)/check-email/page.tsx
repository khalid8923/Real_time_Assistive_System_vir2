"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2, RefreshCw, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function CheckEmailPage() {
  const [email, setEmail] = React.useState("");
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");
  }, []);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email",
      });
      if (error) {
        toast.error(error.message || "فشل الإرسال. حاول تاني بعد شوية.");
      } else {
        toast.success("تم إرسال إيميل جديد ✉️");
        setCooldown(60);
      }
    } catch {
      toast.error("تعذّر الاتصال بالسيرفر.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div dir="rtl" className="text-center">
      <Image
        src="/logo.png"
        alt="CaptionBridge"
        width={56}
        height={56}
        className="mx-auto mb-4 rounded-xl"
        priority
      />

      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <h1 className="mb-3 text-xl font-bold">اتفضل اتفقد إيميلك ✉️</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        بعتنالك لينك تأكيد على
      </p>
      {email && (
        <p
          dir="ltr"
          className="mb-6 break-all rounded-lg bg-muted/40 px-3 py-2 text-sm font-bold text-foreground"
        >
          {email}
        </p>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleResend}
          disabled={!email || resending || cooldown > 0}
          variant="outline"
          className="h-11 w-full gap-2 rounded-xl"
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الإرسال...
            </>
          ) : cooldown > 0 ? (
            <>إعادة الإرسال بعد {cooldown}ث</>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              إعادة إرسال الإيميل
            </>
          )}
        </Button>

        <Link
          href="/login"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-bold transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          رجوع لتسجيل الدخول
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/8 shadow-xs">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-sm font-bold text-amber-800 dark:text-amber-300">
              مش لاقي الإيميل؟
            </p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-400/85">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/70" />
                <span>
                  افحص مجلد <strong className="font-bold">Spam</strong> أو{" "}
                  <strong className="font-bold">Junk Mail</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/70" />
                <span>الإيميل ممكن ياخد من دقيقة لـ دقيقتين</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/70" />
                <span>
                  لو لسه مجاش، استخدم زر{" "}
                  <strong className="font-bold">إعادة الإرسال</strong> فوق
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}