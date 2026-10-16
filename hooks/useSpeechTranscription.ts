"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RefinedChunk {
  id: string;
  text: string;
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
  timestamp: number;
}

export interface UseSpeechTranscriptionReturn {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  currentTranscript: string;
  refinedChunks: RefinedChunk[];
  error: string | null;
  isSupported: boolean;
}

const CHUNK_DURATION_MS = 6_000;
const MIN_BLOB_SIZE = 4000;

// Voice Activity Detection
const SILENCE_RMS_THRESHOLD = 0.008;
const VAD_SAMPLE_INTERVAL_MS = 150;

export function useSpeechTranscription(): UseSpeechTranscriptionReturn {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [refinedChunks, setRefinedChunks] = useState<RefinedChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rotationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppingRef = useRef(false);
  const isStartingRef = useRef(false);

  const chunkQueueRef = useRef<Blob[]>([]);
  const isProcessingQueueRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || chunkQueueRef.current.length === 0) return;
    isProcessingQueueRef.current = true;

    while (chunkQueueRef.current.length > 0) {
      if (isStoppingRef.current) {
        chunkQueueRef.current = [];
        break;
      }

      const blob = chunkQueueRef.current.shift();
      if (!blob) continue;

      abortControllerRef.current = new AbortController();

      try {
        const formData = new FormData();
        formData.append("audio", blob, "chunk.webm");

        const response = await fetch("/api/smart", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        const data: { text?: string; error?: string } = await response.json();

        if (!response.ok) {
          setError(data.error || "فشل معالجة الصوت.");
          continue;
        }

        const cleanText = (data.text ?? "").trim();
        if (cleanText.length === 0) continue;

        setError(null);

        const refined: RefinedChunk = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          text: cleanText,
          topic: "",
          children: [],
          terms: [],
          timestamp: Date.now(),
        };

        setCurrentTranscript((prev) =>
          prev ? `${prev}\n${cleanText}` : cleanText
        );
        setRefinedChunks((prev) => [...prev, refined]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("[smart] Request failed:", err);
        setError("تعذّر الاتصال بخدمة المعالجة.");
      } finally {
        abortControllerRef.current = null;
      }
    }

    isProcessingQueueRef.current = false;
  }, []);

  const processBlob = useCallback(
    (blob: Blob) => {
      if (blob.size < MIN_BLOB_SIZE) return;
      chunkQueueRef.current.push(blob);
      void processQueue();
    },
    [processQueue]
  );

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || isStoppingRef.current) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    const localChunks: Blob[] = [];

    let maxRms = 0;
    const analyser = analyserRef.current;

    if (vadTimerRef.current) clearInterval(vadTimerRef.current);

    if (analyser) {
      const dataArray = new Float32Array(analyser.fftSize);
      vadTimerRef.current = setInterval(() => {
        try {
          analyser.getFloatTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          if (rms > maxRms) maxRms = rms;
        } catch {
          /* ignore */
        }
      }, VAD_SAMPLE_INTERVAL_MS);
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) localChunks.push(e.data);
    };

    recorder.onstop = () => {
      if (vadTimerRef.current) {
        clearInterval(vadTimerRef.current);
        vadTimerRef.current = null;
      }

      const wasSilent = analyser && maxRms < SILENCE_RMS_THRESHOLD;

      if (wasSilent) {
        console.log(
          `[vad] skip silent chunk (maxRms=${maxRms.toFixed(4)}, threshold=${SILENCE_RMS_THRESHOLD})`
        );
      } else {
        const blob = new Blob(localChunks, { type: mimeType });
        processBlob(blob);
      }

      if (!isStoppingRef.current && streamRef.current) {
        startRecording();
      }
    };

    recorder.start();
    recorderRef.current = recorder;

    if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
    rotationTimerRef.current = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, CHUNK_DURATION_MS);
  }, [processBlob]);

  const startListening = useCallback(async () => {
    if (isListening || isStartingRef.current) return;
    isStartingRef.current = true;

    setError(null);
    isStoppingRef.current = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("متصفحك لا يدعم الميكروفون.");
      setIsSupported(false);
      isStartingRef.current = false;
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
      } catch (vadErr) {
        console.warn("[vad] init failed - continuing without VAD", vadErr);
      }

      setIsListening(true);
      startRecording();
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("تم رفض الوصول للميكروفون. اسمح به من إعدادات المتصفح.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("لم يتم العثور على ميكروفون.");
      } else {
        setError("تعذّر تشغيل الميكروفون.");
      }
      setIsListening(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [isListening, startRecording]);

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
      abortControllerRef.current = null;
    }

    chunkQueueRef.current = [];
    isProcessingQueueRef.current = false;

    if (vadTimerRef.current) {
      clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }

    if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try { recorderRef.current.stop(); } catch {}
    }
    recorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setCurrentTranscript("");
    setRefinedChunks([]);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      if (vadTimerRef.current) clearInterval(vadTimerRef.current);
      if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch {}
      }
      if (recorderRef.current && recorderRef.current.state === "recording") {
        try { recorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    currentTranscript,
    refinedChunks,
    error,
    isSupported,
  };
}

export default useSpeechTranscription;