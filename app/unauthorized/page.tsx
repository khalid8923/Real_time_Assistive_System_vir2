import Link from "next/link";
import { ShieldX, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-amber-500/30 bg-amber-500/10">
            <ShieldX className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-tight text-amber-500">
            401
          </h1>
          <h2 className="text-xl font-bold">مش مسجل دخول</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            الصفحة دي محتاجة تسجيل دخول. سجّل دخولك الأول وبعدين ارجع.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Link
            href="/login"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 px-6 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]"
          >
            <LogIn className="h-4 w-4" />
            تسجيل الدخول
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-bold transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}