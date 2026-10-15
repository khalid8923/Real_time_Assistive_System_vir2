"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, ensureDbReady } from "@/lib/db";

async function requireUserId(): Promise<string> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

/* ---------- GLOSSARY ---------- */

export interface SavedGlossaryItem {
  id: string;
  userId: string;
  term: string;
  definition: string;
  sourceLectureId: string | null;
  starred: boolean;
  createdAt: number;
}

export async function getMyGlossary(): Promise<SavedGlossaryItem[]> {
  try {
    const userId = await requireUserId();
    await ensureDbReady();
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT id, userId, term, definition, sourceLectureId, starred, createdAt
            FROM saved_glossary
            WHERE userId = ?
            ORDER BY createdAt DESC`,
      args: [userId],
    });
    return result.rows.map((r) => ({
      id: String(r.id ?? ""),
      userId: String(r.userId ?? ""),
      term: String(r.term ?? ""),
      definition: String(r.definition ?? ""),
      sourceLectureId: r.sourceLectureId ? String(r.sourceLectureId) : null,
      starred: Number(r.starred ?? 0) === 1,
      createdAt: Number(r.createdAt ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function saveGlossary(input: {
  term: string;
  definition: string;
  sourceLectureId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    await ensureDbReady();
    const db = getDb();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await db.execute({
      sql: `INSERT INTO saved_glossary
            (id, userId, term, definition, sourceLectureId, starred, createdAt)
            VALUES (?, ?, ?, ?, ?, 1, ?)`,
      args: [
        id,
        userId,
        input.term,
        input.definition,
        input.sourceLectureId ?? null,
        Date.now(),
      ],
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "فشل الحفظ" };
  }
}

export async function deleteGlossary(id: string): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUserId();
    await ensureDbReady();
    const db = getDb();
    const r = await db.execute({
      sql: "DELETE FROM saved_glossary WHERE id = ? AND userId = ?",
      args: [id, userId],
    });
    return { ok: (r.rowsAffected ?? 0) > 0 };
  } catch {
    return { ok: false };
  }
}

/* ---------- FLASHCARDS ---------- */

export interface FlashcardProgress {
  id: string;
  userId: string;
  question: string;
  answer: string;
  difficulty: string;
  sourceLectureId: string | null;
  masteryLevel: number;
  reviewCount: number;
  lastReviewedAt: number | null;
  createdAt: number;
}

export async function getMyFlashcards(): Promise<FlashcardProgress[]> {
  try {
    const userId = await requireUserId();
    await ensureDbReady();
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT id, userId, question, answer, difficulty, sourceLectureId,
                   masteryLevel, reviewCount, lastReviewedAt, createdAt
            FROM flashcards_progress
            WHERE userId = ?
            ORDER BY createdAt DESC`,
      args: [userId],
    });
    return result.rows.map((r) => ({
      id: String(r.id ?? ""),
      userId: String(r.userId ?? ""),
      question: String(r.question ?? ""),
      answer: String(r.answer ?? ""),
      difficulty: String(r.difficulty ?? "medium"),
      sourceLectureId: r.sourceLectureId ? String(r.sourceLectureId) : null,
      masteryLevel: Number(r.masteryLevel ?? 0),
      reviewCount: Number(r.reviewCount ?? 0),
      lastReviewedAt: r.lastReviewedAt ? Number(r.lastReviewedAt) : null,
      createdAt: Number(r.createdAt ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function saveCard(input: {
  question: string;
  answer: string;
  difficulty?: string;
  sourceLectureId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    await ensureDbReady();
    const db = getDb();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await db.execute({
      sql: `INSERT INTO flashcards_progress
            (id, userId, question, answer, difficulty, sourceLectureId,
             masteryLevel, reviewCount, lastReviewedAt, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL, ?)`,
      args: [
        id,
        userId,
        input.question,
        input.answer,
        input.difficulty ?? "medium",
        input.sourceLectureId ?? null,
        Date.now(),
      ],
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "فشل الحفظ" };
  }
}

export async function deleteCard(id: string): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUserId();
    await ensureDbReady();
    const db = getDb();
    const r = await db.execute({
      sql: "DELETE FROM flashcards_progress WHERE id = ? AND userId = ?",
      args: [id, userId],
    });
    return { ok: (r.rowsAffected ?? 0) > 0 };
  } catch {
    return { ok: false };
  }
}

/* ---------- STATS ---------- */

export interface UserStats {
  totalLectures: number;
  totalWords: number;
  totalGlossary: number;
  totalFlashcards: number;
  averageMastery: number;
}

export async function getMyStats(): Promise<UserStats> {
  const empty: UserStats = {
    totalLectures: 0,
    totalWords: 0,
    totalGlossary: 0,
    totalFlashcards: 0,
    averageMastery: 0,
  };
  try {
    const userId = await requireUserId();
    await ensureDbReady();
    const db = getDb();

    const lectures = await db.execute({
      sql: "SELECT COUNT(*) as count, COALESCE(SUM(wordCount), 0) as words FROM saved_lectures WHERE userId = ?",
      args: [userId],
    });
    const glossary = await db.execute({
      sql: "SELECT COUNT(*) as count FROM saved_glossary WHERE userId = ?",
      args: [userId],
    });
    const flashcards = await db.execute({
      sql: "SELECT COUNT(*) as count, COALESCE(AVG(masteryLevel), 0) as avg FROM flashcards_progress WHERE userId = ?",
      args: [userId],
    });

    return {
      totalLectures: Number(lectures.rows[0]?.count ?? 0),
      totalWords: Number(lectures.rows[0]?.words ?? 0),
      totalGlossary: Number(glossary.rows[0]?.count ?? 0),
      totalFlashcards: Number(flashcards.rows[0]?.count ?? 0),
      averageMastery: Math.round(Number(flashcards.rows[0]?.avg ?? 0)),
    };
  } catch {
    return empty;
  }
}