import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  FileText,
  Languages,
  Layers,
  Mic,
  Target,
  Users,
  HelpCircle,
} from "lucide-react";

export type FeatureId =
  | "captions"
  | "mindmap"
  | "glossary"
  | "keywords"
  | "translation"
  | "summary"
  | "flashcards"
  | "actionItems"
  | "classroomQuestions"
  | "qa"
  | "sounds"
  | "teacher";

export type FeatureCategory = "core" | "accessibility" | "ai" | "teacher";

export interface Feature {
  id: FeatureId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  category: FeatureCategory;
  badge?: "جديد" | "قريباً";
}

export const STUDENT_FEATURES: Feature[] = [
  {
    id: "captions",
    label: "الكلام المباشر",
    shortLabel: "الكلام",
    description: "تحويل كلام الدكتور إلى نص مكتوب في الوقت الفعلي",
    icon: Mic,
    category: "core",
  },
  {
    id: "mindmap",
    label: "الخريطة الذهنية",
    shortLabel: "الخريطة",
    description: "رسم تلقائي لشجرة الموضوعات والفروع",
    icon: Brain,
    category: "core",
  },
  {
    id: "glossary",
    label: "المعجم الأكاديمي",
    shortLabel: "المعجم",
    description: "شرح مبسط لكل مصطلح أكاديمي",
    icon: BookOpen,
    category: "core",
  },
  {
    id: "keywords",
    label: "الكلمات المهمة",
    shortLabel: "الكلمات",
    description: "تنبيه فوري عند ذكر كلمات مفتاحية مهمة",
    icon: AlertTriangle,
    category: "accessibility",
  },
  {
    id: "actionItems",
    label: "رادار المهام",
    shortLabel: "المهام",
    description: "استخراج تكليفات ومواعيد الامتحانات من المحاضرة",
    icon: Target,
    category: "ai",
    badge: "جديد",
  },
  {
    id: "classroomQuestions",
    label: "أسئلة القاعة",
    shortLabel: "أسئلة",
    description: "استنتاج أسئلة الطلاب من ردود الدكتور",
    icon: HelpCircle,
    category: "ai",
    badge: "جديد",
  },
  {
    id: "translation",
    label: "الترجمة الفورية",
    shortLabel: "ترجمة",
    description: "ترجمة المصطلحات الإنجليزية إلى العربية",
    icon: Languages,
    category: "ai",
  },
  {
    id: "summary",
    label: "ملخص المحاضرة",
    shortLabel: "الملخص",
    description: "ملخص ذكي لأهم النقاط",
    icon: FileText,
    category: "ai",
  },
  {
    id: "flashcards",
    label: "كروت المراجعة",
    shortLabel: "كروت",
    description: "توليد كروت مراجعة من المحتوى",
    icon: Layers,
    category: "ai",
  },
  {
    id: "qa",
    label: "أسئلة AI",
    shortLabel: "أسئلة AI",
    description: "شات بوت ذكي",
    icon: Mic,
    category: "ai",
  },
  {
    id: "sounds",
    label: "التنبيهات الصوتية",
    shortLabel: "الأصوات",
    description: "كشف الأصوات المهمة",
    icon: AlertTriangle,
    category: "accessibility",
  },
];

export const TEACHER_FEATURES: Feature[] = [
  {
    id: "teacher",
    label: "لوحة الدكتور",
    shortLabel: "الدكتور",
    description: "استقبال أسئلة واستفسارات الطلاب",
    icon: Users,
    category: "teacher",
  },
];

export const ALL_FEATURES: Feature[] = [
  ...STUDENT_FEATURES,
  ...TEACHER_FEATURES,
];

export const HIDDEN_FROM_SIDEBAR: FeatureId[] = [
  "qa",
  "sounds",
  "translation",
];

export function getFeature(id: FeatureId): Feature {
  return ALL_FEATURES.find((f) => f.id === id) ?? STUDENT_FEATURES[0];
}

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  core: "الأساسيات",
  accessibility: "إمكانية الوصول",
  ai: "الميزات الذكية",
  teacher: "لوحة الدكتور",
};