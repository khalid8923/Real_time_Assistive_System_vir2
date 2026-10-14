import Link from "next/link";
import { LogIn, ShieldAlert } from "lucide-react";

export const metadata = { title: "انتهت الجلسة" };

export default function SessionExpiredPage() {
  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4"
    >
      <div className="relative z-10 mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold">انتهت جلستك</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          لأسباب أمنية، محتاج تسجّل دخول من جديد عشان تكمّل.
        </p>

        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 px-6 text-sm font-bold text-white shadow-lg shadow-primary/30"
        >
          <LogIn className="h-4 w-4" />
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}