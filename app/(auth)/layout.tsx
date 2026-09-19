import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent-2/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Image
            src="/logo.png"
            alt="CaptionBridge"
            width={80}
            height={80}
            className="h-20 w-20 rounded-2xl shadow-xl shadow-primary/20"
            priority
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              CaptionBridge
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              رفيقك الذكي في المحاضرات الجامعية
            </p>
          </div>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CaptionBridge — صُنع بـ ❤️ للطلاب
        </p>
      </div>
    </div>
  );
}