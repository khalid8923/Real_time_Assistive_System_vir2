"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="alert"
          className="fixed top-0 left-1/2 z-100 flex -translate-x-1/2 items-center gap-2 rounded-b-2xl border border-destructive/30 bg-destructive px-4 py-2 text-sm font-bold text-white shadow-lg"
        >
          <WifiOff className="h-4 w-4" />
          لا يوجد اتصال بالإنترنت
        </motion.div>
      )}
    </AnimatePresence>
  );
}
