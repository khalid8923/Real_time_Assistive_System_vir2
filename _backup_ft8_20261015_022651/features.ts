import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Languages,
  Layers,
  Mic,
  Network,
  Sigma,
  Table as TableIcon,
  Target,
  Users,
  Activity,
  Link2,
  Wand2,
} from "lucide-react";

export type FeatureId =
  | "captions"
  | "mindmap"
  | "glossary"
  | "keywords"
  | "actionItems"
  | "classroomQuestions"
  | "flowDiagram"
  | "infographic"
  | "comparison"
  | "analogy"
  | "timeline"
  | "equations"
  | "system"
  | "visualize"
  | "translation"
  | "summary"
  | "flashcards"
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
  // ====== Core ======
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
    id: "summary",
    label: "ملخص المحاضرة",
    shortLabel: "الملخص",
    description: "ملخص ذكي لأهم النقاط",
    icon: FileText,
    category: "core",
  },
  {
    id: "keywords",
    label: "الكلمات المهمة",
    shortLabel: "الكلمات",
    description: "تنبيه فوري عند ذكر كلمات مفتاحية مهمة",
    icon: AlertTriangle,
    category: "core",
  },
  {
    id: "flashcards",
    label: "كروت المراجعة",
    shortLabel: "كروت",
    description: "توليد كروت مراجعة من المحتوى",
    icon: Layers,
    category: "core",
  },

  // ====== Accessibility ======
  {
    id: "sounds",
    label: "التنبيهات الصوتية",
    shortLabel: "الأصوات",
    description: "كشف الأصوات المهمة",
    icon: AlertTriangle,
    category: "accessibility",
  },

  // ====== AI ======
  {
    id: "comparison",
    label: "جداول المقارنة",
    shortLabel: "مقارنة",
    description: "استخراج المقارنات بين المفاهيم تلقائياً",
    icon: TableIcon,
    category: "ai",
  },
  {
    id: "analogy",
    label: "خريطة التشبيه",
    shortLabel: "تشبيه",
    description: "اربط المفاهيم الصعبة بحاجات مألوفة",
    icon: Link2,
    category: "ai",
  },
  {
    id: "timeline",
    label: "الخط الزمني",
    shortLabel: "زمني",
    description: "كثافة الكلام وتفاصيل كل جزء من المحاضرة",
    icon: Activity,
    category: "ai",
  },
  {
    id: "equations",
    label: "المعادلات التحركية",
    shortLabel: "معادلات",
    description: "استخرج المعادلات وجرّب القيم بنفسك",
    icon: Sigma,
    category: "ai",
  },
  {
    id: "system",
    label: "المنظر المفكّك",
    shortLabel: "أنظمة",
    description: "الأنظمة ذات الطبقات: OSI، TCP/IP، Compiler",
    icon: Layers,
    category: "ai",
  },
  {
    id: "visualize",
    label: "ارسمها لي",
    shortLabel: "ارسمها",
    description: "حوّل أي فكرة لرسم توضيحي تلقائي",
    icon: Wand2,
    category: "ai",
  },
  {
    id: "flowDiagram",
    label: "مخطط العمليات",
    shortLabel: "مخطط",
    description: "تحويل الخطوات لـ flowchart بصري",
    icon: Network,
    category: "ai",
  },
  {
    id: "infographic",
    label: "الملخص البصري",
    shortLabel: "إنفوجرافيك",
    description: "تحويل المحاضرة لرسوم بيانية ومخططات",
    icon: ImageIcon,
    category: "ai",
  },
  {
    id: "actionItems",
    label: "رادار المهام",
    shortLabel: "المهام",
    description: "استخراج تكليفات ومواعيد الامتحانات",
    icon: Target,
    category: "ai",
  },
  {
    id: "classroomQuestions",
    label: "أسئلة القاعة",
    shortLabel: "أسئلة",
    description: "استنتاج أسئلة الطلاب من ردود الدكتور",
    icon: HelpCircle,
    category: "ai",
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
    id: "qa",
    label: "أسئلة AI",
    shortLabel: "أسئلة AI",
    description: "شات بوت ذكي",
    icon: Mic,
    category: "ai",
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