"use client";

export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-100 focus:rounded-xl focus:border-2 focus:border-primary focus:bg-background focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-foreground focus:shadow-2xl"
    >
      تخطَّ إلى المحتوى الرئيسي
    </a>
  );
}