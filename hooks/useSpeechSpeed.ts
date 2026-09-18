"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechSpeed = "slow" | "normal" | "fast" | "unknown";

export interface UseSpeechSpeedReturn {
  speed: SpeechSpeed;
  wpm: number;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  reset: () => void;
  update: (transcript: string) => void;
}

const FAST_THRESHOLD = 160;
const SLOW_THRESHOLD = 110;
const WINDOW_MS = 10000;

interface Sample {
  words: number;
  timestamp: number;
}

export function useSpeechSpeed(): UseSpeechSpeedReturn {
  const [speed, setSpeed] = useState<SpeechSpeed>("unknown");
  const [wpm, setWpm] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  const samplesRef = useRef<Sample[]>([]);
  const lastLengthRef = useRef(0);
  const lastTextRef = useRef("");

  const startTracking = useCallback(() => {
    samplesRef.current = [];
    lastLengthRef.current = 0;
    lastTextRef.current = "";
    setWpm(0);
    setSpeed("unknown");
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  const reset = useCallback(() => {
    samplesRef.current = [];
    lastLengthRef.current = 0;
    lastTextRef.current = "";
    setWpm(0);
    setSpeed("unknown");
  }, []);

  const update = useCallback(
    (transcript: string) => {
      if (!isTracking) return;

      const now = Date.now();
      const currentLength = transcript.length;

      if (currentLength <= lastLengthRef.current) {
        lastTextRef.current = transcript;
        return;
      }

      const newText = transcript.slice(lastLengthRef.current);
      const newWords = newText.split(/\s+/).filter(Boolean).length;

      lastLengthRef.current = currentLength;
      lastTextRef.current = transcript;

      if (newWords > 0) {
        samplesRef.current.push({ words: newWords, timestamp: now });
      }

      const cutoff = now - WINDOW_MS;
      samplesRef.current = samplesRef.current.filter(
        (s) => s.timestamp >= cutoff
      );

      const totalWords = samplesRef.current.reduce(
        (sum, s) => sum + s.words,
        0
      );

      if (samplesRef.current.length < 2) {
        setWpm(0);
        setSpeed("unknown");
        return;
      }

      const oldestTime = samplesRef.current[0]?.timestamp ?? now;
      const elapsedMs = now - oldestTime;
      const elapsedMin = elapsedMs / 60000;

      if (elapsedMin <= 0) return;

      const calculatedWpm = Math.round(totalWords / elapsedMin);
      setWpm(calculatedWpm);

      if (calculatedWpm < SLOW_THRESHOLD) setSpeed("slow");
      else if (calculatedWpm > FAST_THRESHOLD) setSpeed("fast");
      else setSpeed("normal");
    },
    [isTracking]
  );

  useEffect(() => {
    if (!isTracking) {
      setSpeed("unknown");
      setWpm(0);
    }
  }, [isTracking]);

  return {
    speed,
    wpm,
    isTracking,
    startTracking,
    stopTracking,
    reset,
    update,
  };
}

export default useSpeechSpeed;