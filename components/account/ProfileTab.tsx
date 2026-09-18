"use client";

import * as React from "react";
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  user: {
    id: string;
    name: string;
    email: string;
    fullName: string | null;
    university: string | null;
    studentId: string | null;
    role: string | null;
  };
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const [name, setName] = React.useState(user.fullName || user.name || "");
  const [university, setUniversity] = React.useState(user.university || "");
  const [studentId, setStudentId] = React.useState(user.studentId || "");
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  const checkDirty = (n: string, u: string, s: string) => {
    return (
      n !== (user.fullName || user.name || "") ||
      u !== (user.university || "") ||
      s !== (user.studentId || "")
    );
  };

  React.useEffect(() => {
    setDirty(checkDirty(name, university, studentId));
  }, [name, university, studentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          university: university.trim(),
          studentId: studentId.trim(),
        }),
      });
      if (!res.ok) {
        toast.error("فشل التحديث");
        return;
      }
      toast.success("تم تحديث البيانات");
      setDirty(false);
      window.location.reload();
    } catch {
      toast.error("فشل الاتصال");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">
            البيانات الشخصية
          </h2>
          <p className="text-[10px] text-muted-foreground">
            عدّل بياناتك الأساسية
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          icon={User}
          label="الاسم الكامل"
          value={name}
          onChange={setName}
          placeholder="خالد محمد"
        />
        <Field
          icon={Mail}
          label="الإيميل (غير قابل للتعديل)"
          value={user.email}
          onChange={() => {}}
          disabled
          ltr
        />
        <Field
          icon={Building2}
          label="الجامعة"
          value={university}
          onChange={setUniversity}
          placeholder="جامعة القاهرة"
        />
        <Field
          icon={GraduationCap}
          label="الرقم الجامعي"
          value={studentId}
          onChange={setStudentId}
          placeholder="e2511081"
          ltr
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
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
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  ltr,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ltr?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2",
            disabled ? "text-muted-foreground/40" : "text-muted-foreground"
          )}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          dir={ltr ? "ltr" : "rtl"}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-muted/30 pr-10 pl-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
            "focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />
      </div>
    </div>
  );
}