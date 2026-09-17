"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import InactivityWarning from "@/components/InactivityWarning";

const TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS = 60 * 1000;

export default function AuthSessionWatcher() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const guestCookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("guest_mode="));
      const guest = guestCookie?.split("=")[1] === "true";

      setIsAuthenticated(!!user);
      setIsGuest(guest);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      document.cookie =
        "guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.info("تم تسجيل خروجك تلقائياً");
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("[logout] failed:", err);
    }
  }, [supabase, router]);

  const { showWarning, secondsLeft, resetTimer, forceLogout } =
    useInactivityLogout({
      timeoutMs: TIMEOUT_MS,
      warningMs: WARNING_MS,
      onLogout: handleLogout,
      enabled: isAuthenticated && !isGuest,
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