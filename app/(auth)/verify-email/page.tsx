"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type State = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [state, setState] = React.useState<State>("loading");
  const [message, setMessage] = React.useState<string>("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      setState("error");
      setMessage(error === "invalid_token" ? "الرابط غير صالح أو منتهي" : "الرابط غير مكتمل");
      return;
    }

    (async () => {
      try {
        const { error: verifyError } = await authClient.verifyEmail({
          query: { token },
        });
        if (verifyError) {
          setState("error");
          setMessage(verifyError.message || "فشل التحقق");
          return;
        }
        setState("success");
      } catch (err) {
        setState("error");
        setMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      }
    })();
  }, []);

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

      {state === "loading" && (
        <>
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          <h1 className="mb-2 text-xl font-bold">جارٍ التحقق من بريدك...</h1>
          <p className="text-sm text-muted-foreground">ثانية واحدة</p>
        </>
      )}

      {state === "success" && (
        <>
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" strokeWidth={1.5} />
          <h1 className="mb-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            تم تأكيد بريدك بنجاح 🎉
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            حسابك جاهز الآن. تسجيل الدخول شغال.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground"
          >
            ابدأ الاستخدام
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" strokeWidth={1.5} />
          <h1 className="mb-2 text-xl font-bold text-destructive">فشل التحقق</h1>
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input px-6 text-sm font-bold hover:bg-hover"
            >
              حساب جديد
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground"
            >
              تسجيل الدخول
            </Link>
          </div>
        </>
      )}
    </div>
  );
}