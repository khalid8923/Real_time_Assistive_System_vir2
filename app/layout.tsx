import type { Metadata, Viewport } from "next";
import { Cairo, Amiri, IBM_Plex_Mono, STIX_Two_Text } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import OfflineIndicator from "@/components/OfflineIndicator";
import GlobalErrorCatcher from "@/components/GlobalErrorCatcher";
import TopProgressBar from "@/components/TopProgressBar";
import AuthSessionWatcher from "@/components/AuthSessionWatcher";
import SkipToContent from "@/components/SkipToContent";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const stix = STIX_Two_Text({
  subsets: ["latin"],
  variable: "--font-stix",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "CaptionBridge";
const SITE_DESCRIPTION =
  "مساعد المحاضرات الفوري لطلاب العلوم والهندسة — تفريغ نصي، ملخص ذكي، ومعجم مصطلحات أكاديمي.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | مساعد المحاضرات الذكي`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["CaptionBridge", "مساعد محاضرات", "طلاب جامعيين", "ذكاء اصطناعي"],
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | مساعد المحاضرات الذكي`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | مساعد المحاضرات الذكي`,
    description: SITE_DESCRIPTION,
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

const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var valid=["light","dark","focus"];var legacy={"classic":"light","immersive":"dark"};if(legacy[t])t=legacy[t];if(valid.indexOf(t)===-1)t="${DEFAULT_THEME}";var r=document.documentElement;r.setAttribute("data-theme",t);r.classList.remove("light","dark","focus");r.classList.add(t);r.style.colorScheme=t==="light"?"light":"dark"}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}")}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-theme={DEFAULT_THEME}
      className={`${cairo.variable} ${amiri.variable} ${stix.variable} ${plexMono.variable} ${DEFAULT_THEME}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <SkipToContent />
        <TopProgressBar />
        <ThemeProvider>
          <GlobalErrorCatcher />
          {children}
          <Toaster />
          <OfflineIndicator />
          <AuthSessionWatcher />
        </ThemeProvider>
      </body>
    </html>
  );
}