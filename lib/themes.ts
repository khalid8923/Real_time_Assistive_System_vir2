export type Theme = "light" | "dark" | "focus";

export interface ThemeMeta {
  id: Theme;
  label: string;
  tagline: string;
  description: string;
  emoji: string;
  previewGradient: string;
  accentColor: string;
}

export const DEFAULT_THEME: Theme = "dark";
export const THEME_STORAGE_KEY = "cb-theme";

export const THEMES: ThemeMeta[] = [
  {
    id: "light",
    label: "فاتح",
    tagline: "نظيف ومشرق",
    description: "تصميم فاتح بألوان بنفسجية هادئة، مثالي للاستخدام النهاري والقراءة الطويلة.",
    emoji: "☀️",
    previewGradient: "from-gray-100 via-white to-violet-50",
    accentColor: "#8470ff",
  },
  {
    id: "dark",
    label: "داكن",
    tagline: "مريح للعين",
    description: "تصميم داكن بألوان بنفسجية — تجربة عصرية ومريحة للعين في أي وقت.",
    emoji: "🌙",
    previewGradient: "from-gray-900 via-gray-800 to-violet-900",
    accentColor: "#8470ff",
  },
  {
    id: "focus",
    label: "التركيز",
    tagline: "تباين عالي",
    description: "بدون ألوان صارخة — مصمم للطلاب اللي عايزين يركزوا 100%.",
    emoji: "📚",
    previewGradient: "from-zinc-100 via-white to-zinc-50",
    accentColor: "#0a0a0a",
  },
];

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && THEMES.some((t) => t.id === value);
}

export function getThemeMeta(id: Theme): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

// Legacy support — all old "classic" maps to "light", old "immersive" to "dark"
export function normalizeTheme(value: unknown): Theme {
  if (value === "classic") return "light";
  if (value === "immersive") return "dark";
  return isTheme(value) ? value : DEFAULT_THEME;
}