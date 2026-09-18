"use client";

import { useCallback, useEffect, useState } from "react";

export interface SavedLecture {
  id: string;
  name: string;
  createdAt: number;
  transcript: string;
  topic: string;
  children: string[];
  terms: { term: string; definition: string }[];
}

const STORAGE_KEY = "cb_saved_lectures";

function readLectures(): SavedLecture[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeLectures(lectures: SavedLecture[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
  } catch {
    // ignore
  }
}

export interface UseLocalLecturesReturn {
  lectures: SavedLecture[];
  saveLecture: (
    lecture: Omit<SavedLecture, "id" | "createdAt">
  ) => SavedLecture;
  deleteLecture: (id: string) => void;
  clearAll: () => void;
  getLecture: (id: string) => SavedLecture | undefined;
}

export function useLocalLectures(): UseLocalLecturesReturn {
  const [lectures, setLectures] = useState<SavedLecture[]>([]);

  useEffect(() => {
    setLectures(readLectures());
  }, []);

  const saveLecture = useCallback(
    (lecture: Omit<SavedLecture, "id" | "createdAt">) => {
      const newLecture: SavedLecture = {
        ...lecture,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      };

      setLectures((prev) => {
        const updated = [newLecture, ...prev].slice(0, 50);
        writeLectures(updated);
        return updated;
      });

      return newLecture;
    },
    []
  );

  const deleteLecture = useCallback((id: string) => {
    setLectures((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      writeLectures(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setLectures([]);
    writeLectures([]);
  }, []);

  const getLecture = useCallback(
    (id: string) => lectures.find((l) => l.id === id),
    [lectures]
  );

  return {
    lectures,
    saveLecture,
    deleteLecture,
    clearAll,
    getLecture,
  };
}

export default useLocalLectures;