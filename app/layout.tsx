import type { Metadata, Viewport } from "next";
import { Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import OfflineIndicator from "@/components/OfflineIndicator";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "CaptionBridge";
const SITE_DESCRIPTION =
  "تطبيق ويب مساعد في الوقت الفعلي للطلاب الصم — ترجمة الكلام، خريطة ذهنية، ومعجم مصطلحات أكاديمية.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ترجمة فورية للطلاب الصم`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["CaptionBridge", "ترجمة فورية", "طلاب الصم", "محاضرات جامعية", "ذكاء اصطناعي"],
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | جسر التواصل للطلاب الصم`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ترجمة فورية للطلاب الصم`,
    description: SITE_DESCRIPTION,
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
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
          <AuthSessionWatcher />
        </ThemeProvider>
      </body>
    </html>
  );
}