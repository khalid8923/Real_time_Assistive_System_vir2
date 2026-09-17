import Link from "next/link";
import { Lock, Home, MessageCircle } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <div className="glass relative z-10 mx-auto max-w-md space-y-6 rounded-3xl border border-border p-8 text-center shadow-2xl">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-rose-500/30 bg-rose-500/10">
            <Lock className="h-10 w-10 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-tight text-rose-500">403</h1>
          <h2 className="text-xl font-bold">ممنوع الدخول</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            معندكش صلاحية للوصول للصفحة دي. لو ده غلط، تواصل مع الدعم.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Link
            href="/"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-bold transition-colors hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" />
            الدعم
          </Link>
        </div>
      </div>
    </div>
  );
}