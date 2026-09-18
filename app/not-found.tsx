import Link from "next/link";
import { Home, Search, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent-2/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <Compass className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="mb-2 text-7xl font-black tracking-tight text-primary">
          404
        </h1>
        <h2 className="mb-3 text-xl font-bold">الصفحة غير موجودة</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          الصفحة اللي بتدور عليها مش موجودة أو اتنقلت لمكان تاني.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 px-6 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
          <Link
            href="/?search=1"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-bold transition-colors hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            ابحث في المحاضرات
          </Link>
        </div>
      </div>
    </div>
  );
}