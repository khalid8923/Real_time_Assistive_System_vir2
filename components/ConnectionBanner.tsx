"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function ConnectionBanner() {
  const isOnline = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      return;
    }
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const t = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="alert"
          className="fixed top-0 left-1/2 z-100 flex -translate-x-1/2 items-center gap-2 rounded-b-2xl border border-amber-500/30 bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
        >
          <WifiOff className="h-4 w-4" />
          الاتصال بالإنترنت انقطع
        </motion.div>
      )}
      {showReconnected && isOnline && (
        <motion.div
          key="reconnected"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          className="fixed top-0 left-1/2 z-100 flex -translate-x-1/2 items-center gap-2 rounded-b-2xl border border-emerald-500/30 bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
        >
          <Wifi className="h-4 w-4" />
          الاتصال رجع تاني
        </motion.div>
      )}
    </AnimatePresence>
  );
}