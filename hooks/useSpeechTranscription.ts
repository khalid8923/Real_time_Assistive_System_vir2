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
  currentTranscript: string;
  refinedChunks: RefinedChunk[];
  error: string | null;
  isSupported: boolean;
}

const CHUNK_DURATION_MS = 15000;
const MIN_BLOB_SIZE = 5000;

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

  const chunkQueueRef = useRef<Blob[]>([]);
  const isProcessingQueueRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || chunkQueueRef.current.length === 0) return;
    isProcessingQueueRef.current = true;

    while (chunkQueueRef.current.length > 0) {
      const blob = chunkQueueRef.current.shift();
      if (!blob) continue;

      try {
        const formData = new FormData();
        formData.append("audio", blob, "chunk.webm");

        const response = await fetch("/api/smart", {
          method: "POST",
          body: formData,
        });

        const data: {
          text?: string;
          topic?: string;
          children?: string[];
          terms?: { term: string; definition: string }[];
          error?: string;
        } = await response.json();

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
          topic: (data.topic ?? "").trim(),
          children: Array.isArray(data.children) ? data.children : [],
          terms: Array.isArray(data.terms) ? data.terms : [],
          timestamp: Date.now(),
        };

        setCurrentTranscript((prev) =>
          prev ? `${prev}\n${cleanText}` : cleanText
        );
        setRefinedChunks((prev) => [...prev, refined]);
      } catch (err) {
        console.error("[smart] Request failed:", err);
        setError("تعذّر الاتصال بخدمة المعالجة.");
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

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) localChunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(localChunks, { type: mimeType });
      processBlob(blob);

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
    if (isListening) return;

    setError(null);
    isStoppingRef.current = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("متصفحك لا يدعم الميكروفون.");
      setIsSupported(false);
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
    }
  }, [isListening, startRecording]);

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);

    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    currentTranscript,
    refinedChunks,
    error,
    isSupported,
  };
}

export default useSpeechTranscription;