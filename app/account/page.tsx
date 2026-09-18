"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Calendar,
  LogOut,
  Loader2,
  Sparkles,
  Bookmark,
  Layers,
  Settings as SettingsIcon,
  TrendingUp,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProfileTab from "@/components/account/ProfileTab";
import LecturesTab from "@/components/account/LecturesTab";
import StudyTab from "@/components/account/StudyTab";
import SettingsTab from "@/components/account/SettingsTab";
import { getFullUser } from "@/app/actions/user";
import { getMyStats } from "@/app/actions/study";
import type { UserStats } from "@/lib/db/queries";

interface FullUser {
  id: string;
  name: string;
  email: string;
  emailVerified: number;
  image: string | null;
  fullName: string | null;
  university: string | null;
  studentId: string | null;
  role: string | null;
  createdAt: number;
  updatedAt: number;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<FullUser | null>(null);
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [u, s] = await Promise.all([getFullUser(), getMyStats()]);
      setUser(u);
      setStats(s);
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <User className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          من فضلك سجّل دخول الأول
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="gap-2 rounded-xl bg-linear-to-l from-primary to-accent-1 text-white"
        >
          تسجيل الدخول
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* ==================== PROFILE HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs"
        >
          <div className="relative h-28 bg-linear-to-br from-primary via-accent-1 to-accent-2">
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="relative -mt-14 flex flex-wrap items-end gap-4 px-6 pb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card bg-linear-to-br from-primary to-accent-1 text-3xl font-black text-white shadow-lg">
              {(user.name || user.email || "?").charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {user.fullName || user.name || "مستخدم"}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span dir="ltr">{user.email}</span>
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </motion.div>

        {/* ==================== STATS ==================== */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Bookmark}
              label="المحاضرات"
              value={stats.totalLectures}
              color="text-primary"
              bg="bg-primary/10"
            />
            <StatCard
              icon={FileText}
              label="إجمالي الكلمات"
              value={stats.totalWords}
              color="text-sky-500"
              bg="bg-sky-500/10"
            />
            <StatCard
              icon={Sparkles}
              label="المصطلحات"
              value={stats.totalGlossary}
              color="text-violet-500"
              bg="bg-violet-500/10"
            />
            <StatCard
              icon={TrendingUp}
              label="متوسط الإتقان"
              value={`${stats.averageMastery}%`}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
          </div>
        )}

        {/* ==================== TABS ==================== */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="w-full overflow-x-auto sm:w-auto">
            <TabsTrigger value="profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">البروفايل</span>
            </TabsTrigger>
            <TabsTrigger value="lectures">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">محاضراتي</span>
            </TabsTrigger>
            <TabsTrigger value="study">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">كروتي</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                fullName: user.fullName,
                university: user.university,
                studentId: user.studentId,
                role: user.role,
              }}
            />
          </TabsContent>

          <TabsContent value="lectures">
            <LecturesTab
              onOpenLecture={() => router.push("/")}
            />
          </TabsContent>

          <TabsContent value="study">
            <StudyTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            bg,
            color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={cn("text-xl font-black", color)}>{value}</p>
    </div>
  );
}