"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundLevel = "quiet" | "normal" | "loud" | "spike";

export interface SoundAlert {
  id: string;
  level: SoundLevel;
  intensity: number;
  timestamp: number;
}

export interface UseSoundDetectionReturn {
  isMonitoring: boolean;
  isSupported: boolean;
  currentLevel: SoundLevel;
  currentIntensity: number;
  alerts: SoundAlert[];
  error: string | null;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
  clearAlerts: () => void;
}

const QUIET_THRESHOLD = 15;
const NORMAL_THRESHOLD = 45;
const LOUD_THRESHOLD = 70;
const SPIKE_DELTA = 30;
const SPIKE_COOLDOWN_MS = 3000;
const MAX_ALERTS = 30;

export function useSoundDetection(): UseSoundDetectionReturn {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [currentLevel, setCurrentLevel] = useState<SoundLevel>("quiet");
  const [currentIntensity, setCurrentIntensity] = useState(0);
  const [alerts, setAlerts] = useState<SoundAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSpikeRef = useRef<number>(0);
  const lastIntensityRef = useRef<number>(0);

  const classify = (intensity: number): SoundLevel => {
    if (intensity >= LOUD_THRESHOLD) return "loud";
    if (intensity >= NORMAL_THRESHOLD) return "normal";
    return "quiet";
  };

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const avg = sum / dataArray.length;

    const intensity = Math.min(100, Math.round((avg / 128) * 100));
    setCurrentIntensity(intensity);

    const level = classify(intensity);
    setCurrentLevel(level);

    const delta = intensity - lastIntensityRef.current;
    const now = Date.now();

    if (
      delta >= SPIKE_DELTA &&
      intensity >= LOUD_THRESHOLD &&
      now - lastSpikeRef.current > SPIKE_COOLDOWN_MS
    ) {
      lastSpikeRef.current = now;

      const alert: SoundAlert = {
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        level: "spike",
        intensity,
        timestamp: now,
      };

      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
    }

    lastIntensityRef.current = intensity;
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;

    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("متصفحك لا يدعم الميكروفون.");
      setIsSupported(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsMonitoring(true);
      lastIntensityRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("تم رفض الوصول للميكروفون.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("لم يتم العثور على ميكروفون.");
      } else {
        setError("تعذّر تشغيل المراقبة الصوتية.");
      }
      setIsMonitoring(false);
    }
  }, [isMonitoring, loop]);

  const stopMonitoring = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsMonitoring(false);
    setCurrentIntensity(0);
    setCurrentLevel("quiet");
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  return {
    isMonitoring,
    isSupported,
    currentLevel,
    currentIntensity,
    alerts,
    error,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
  };
}