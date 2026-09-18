"use client";

import * as React from "react";
import {
  Palette,
  Type,
  Palette as ColorIcon,
  Volume2,
  Loader2,
  Save,
  Sun,
  Moon,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  getMySettings,
  updateMySettings,
} from "@/app/actions/settings";
import { useTheme } from "@/components/ThemeProvider";
import type { Theme } from "@/lib/db";

const THEMES: { id: Theme; label: string; icon: React.ElementType }[] = [
  { id: "light", label: "فاتح", icon: Sun },
  { id: "dark", label: "داكن", icon: Moon },
  { id: "focus", label: "تركيز", icon: BookOpen },
];

export default function SettingsTab() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [theme, setLocalTheme] = React.useState<Theme>("dark");
  const [fontSize, setFontSize] = React.useState(16);
  const [colorCoding, setColorCoding] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(false);

  const [quiet, setQuiet] = React.useState(15);
  const [normal, setNormal] = React.useState(45);
  const [loud, setLoud] = React.useState(70);
  const [spike, setSpike] = React.useState(30);

  React.useEffect(() => {
    (async () => {
      const s = await getMySettings();
      if (s) {
        setLocalTheme(s.theme);
        setFontSize(s.transcriptFontSize);
        setColorCoding(s.colorCodingEnabled);
        setSoundEnabled(s.soundDetectionEnabled);
        setQuiet(s.soundSensitivityQuiet);
        setNormal(s.soundSensitivityNormal);
        setLoud(s.soundSensitivityLoud);
        setSpike(s.soundSensitivitySpike);
      }
      setLoading(false);
    })();
  }, []);

  // ✅ Optimistic UI for theme
  const handleThemeChange = async (newTheme: Theme) => {
    // 1. Update UI instantly
    setLocalTheme(newTheme);
    setTheme(newTheme);

    // 2. Sync to DB in background
    try {
      const res = await updateMySettings({ theme: newTheme });
      if (!res.ok) {
        toast.error("فشل حفظ الثيم");
        // rollback
        setLocalTheme(currentTheme);
        setTheme(currentTheme);
      }
    } catch {
      toast.error("فشل الاتصال");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await updateMySettings({
        theme,
        transcriptFontSize: fontSize,
        colorCodingEnabled: colorCoding,
        soundDetectionEnabled: soundEnabled,
        soundSensitivityQuiet: quiet,
        soundSensitivityNormal: normal,
        soundSensitivityLoud: loud,
        soundSensitivitySpike: spike,
      });
      if (res.ok) {
        toast.success("تم حفظ الإعدادات");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("فشل الاتصال");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* THEME */}
      <Section
        icon={Palette}
        title="المظهر"
        description="اختر الثيم المريح لعينك"
      >
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-linear-to-br from-primary to-accent-1 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* TRANSCRIPT */}
      <Section
        icon={Type}
        title="النص المباشر"
        description="حجم وتلوين النص"
      >
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground">
                حجم الخط
              </label>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {fontSize}px
              </span>
            </div>
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
            <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
              <span>12px</span>
              <span>24px</span>
            </div>
          </div>

          <ToggleRow
            icon={ColorIcon}
            label="تمييز ذكي للكلمات"
            description="تلوين المصطلحات الإنجليزية والأرقام والكلمات المهمة"
            checked={colorCoding}
            onCheckedChange={setColorCoding}
          />
        </div>
      </Section>

      {/* SOUND */}
      <Section
        icon={Volume2}
        title="التنبيهات الصوتية"
        description="إعدادات كشف الأصوات"
      >
        <div className="space-y-5">
          <ToggleRow
            icon={Volume2}
            label="تفعيل التنبيهات"
            description="كشف الأصوات المفاجئة (باب، جرس، تليفون)"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />

          {soundEnabled && (
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <SensitivitySlider
                label="🔇 هادئ"
                value={quiet}
                onChange={setQuiet}
                color="emerald"
              />
              <SensitivitySlider
                label="🔉 عادي"
                value={normal}
                onChange={setNormal}
                color="amber"
              />
              <SensitivitySlider
                label="🔊 مرتفع"
                value={loud}
                onChange={setLoud}
                color="orange"
              />
              <SensitivitySlider
                label="⚡ مفاجئ"
                value={spike}
                onChange={setSpike}
                color="rose"
              />
            </div>
          )}
        </div>
      </Section>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-white shadow-md"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              حفظ كل الإعدادات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SensitivitySlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: "emerald" | "amber" | "orange" | "rose";
}) {
  const colorMap = {
    emerald: "accent-emerald-500",
    amber: "accent-amber-500",
    orange: "accent-orange-500",
    rose: "accent-rose-500",
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-bold text-foreground">{label}</label>
        <span className="rounded-md bg-background px-2 py-0.5 text-[10px] font-bold">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={5}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted",
          colorMap[color]
        )}
      />
    </div>
  );
}