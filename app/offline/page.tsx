import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export const metadata = { title: "بدون اتصال" };

export default function OfflinePage() {
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

      <div className="relative z-10 mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
            <WifiOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold">إنت مش متصل بالإنترنت</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          اتأكد من اتصالك بالشبكة، وبعدها حاول تاني.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 px-6 text-sm font-bold text-white shadow-lg shadow-primary/30"
          >
            <RefreshCw className="h-4 w-4" />
            حاول تاني
          </a>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-bold transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}