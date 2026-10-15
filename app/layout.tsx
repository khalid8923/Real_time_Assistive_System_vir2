import type { Metadata, Viewport } from "next";
import { Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import OfflineIndicator from "@/components/OfflineIndicator";
import ConnectionBanner from "@/components/ConnectionBanner";
import GlobalErrorCatcher from "@/components/GlobalErrorCatcher";
import TopProgressBar from "@/components/TopProgressBar";
import AuthSessionWatcher from "@/components/AuthSessionWatcher";
import SkipToContent from "@/components/SkipToContent";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://real-time-assistive-system-vir2.vercel.app";
const SITE_NAME = "CaptionBridge";
const SITE_DESCRIPTION =
  "رفيقك الذكي في المحاضرات الجامعية — ترجمة فورية لكلام الدكتور، خرائط ذهنية تفاعلية، وملخصات ذكية في الوقت الفعلي.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — رفيقك الذكي في المحاضرات الجامعية`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "CaptionBridge",
    "ترجمة فورية",
    "محاضرات جامعية",
    "خرائط ذهنية",
    "ملخصات دراسية",
    "ذكاء اصطناعي",
    "تعليم",
  ],
  authors: [{ name: "CaptionBridge" }],
  creator: "CaptionBridge",
  publisher: "CaptionBridge",
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — رفيقك الذكي في المحاضرات الجامعية`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — رفيقك الذكي في المحاضرات الجامعية`,
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dfe2e6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var valid = ['light', 'dark', 'focus'];
    var legacy = { 'classic': 'light', 'immersive': 'dark' };
    if (legacy[stored]) stored = legacy[stored];
    var theme = valid.indexOf(stored) !== -1 ? stored : '${DEFAULT_THEME}';
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME}');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-theme={DEFAULT_THEME}
      className={`${cairo.variable} ${amiri.variable} dark`}
      suppressHydrationWarning
    >
      <body
        className={`${cairo.className} min-h-screen bg-background text-foreground antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <SkipToContent />
        <TopProgressBar />
        <ThemeProvider>
          {children}
          <Toaster />
          <OfflineIndicator />
          <ConnectionBanner />
          <GlobalErrorCatcher />
          <AuthSessionWatcher />
        </ThemeProvider>
      </body>
    </html>
  );
}