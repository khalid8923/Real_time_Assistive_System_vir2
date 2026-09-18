"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import InactivityWarning from "@/components/InactivityWarning";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 60 * 1000; // 1 minute warning

export default function AuthSessionWatcher() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isGuest] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("guest_mode=true");
  });

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      document.cookie =
        "guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.info("تم تسجيل خروجك تلقائياً");
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("[logout] failed:", err);
    }
  }, [router]);

  const { showWarning, secondsLeft, resetTimer, forceLogout } =
    useInactivityLogout({
      timeoutMs: TIMEOUT_MS,
      warningMs: WARNING_MS,
      onLogout: handleLogout,
      enabled: !!session?.user && !isGuest,
    });

  return (
    <InactivityWarning
      show={showWarning}
      secondsLeft={secondsLeft}
      onStay={resetTimer}
      onLogout={forceLogout}
    />
  );
}