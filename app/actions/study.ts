"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  listGlossary,
  saveGlossaryTerm,
  deleteGlossaryTerm,
  listFlashcards,
  saveFlashcard,
  reviewFlashcard,
  deleteFlashcard,
  getUserStats,
  type UserStats,
} from "@/lib/db/queries";
import type { SavedGlossaryItem, FlashcardProgress } from "@/lib/db";

async function requireUserId(): Promise<string> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

/* ---------- GLOSSARY ---------- */

export async function getMyGlossary(): Promise<SavedGlossaryItem[]> {
  try {
    const userId = await requireUserId();
    return await listGlossary(userId);
  } catch {
    return [];
  }
}

export async function saveGlossary(input: {
  term: string;
  definition: string;
  sourceLectureId?: string;
}): Promise<
  { ok: true; item: SavedGlossaryItem } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const item = await saveGlossaryTerm(userId, input);
    revalidatePath("/account");
    return { ok: true, item };
  } catch {
    return { ok: false, error: "فشل الحفظ" };
  }
}

export async function deleteGlossary(
  id: string
): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUserId();
    const ok = await deleteGlossaryTerm(userId, id);
    revalidatePath("/account");
    return { ok };
  } catch {
    return { ok: false };
  }
}

/* ---------- FLASHCARDS ---------- */

export async function getMyFlashcards(): Promise<FlashcardProgress[]> {
  try {
    const userId = await requireUserId();
    return await listFlashcards(userId);
  } catch {
    return [];
  }
}

export async function saveCard(input: {
  question: string;
  answer: string;
  difficulty?: string;
  sourceLectureId?: string;
}): Promise<
  { ok: true; card: FlashcardProgress } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const card = await saveFlashcard(userId, input);
    revalidatePath("/account");
    return { ok: true, card };
  } catch {
    return { ok: false, error: "فشل الحفظ" };
  }
}

export async function reviewCard(
  id: string,
  newMastery: number
): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUserId();
    const ok = await reviewFlashcard(userId, id, newMastery);
    revalidatePath("/account");
    return { ok };
  } catch {
    return { ok: false };
  }
}

export async function deleteCard(
  id: string
): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUserId();
    const ok = await deleteFlashcard(userId, id);
    revalidatePath("/account");
    return { ok };
  } catch {
    return { ok: false };
  }
}

/* ---------- STATS ---------- */

export async function getMyStats(): Promise<UserStats> {
  try {
    const userId = await requireUserId();
    return await getUserStats(userId);
  } catch {
    return {
      totalLectures: 0,
      totalWords: 0,
      totalGlossary: 0,
      totalFlashcards: 0,
      averageMastery: 0,
    };
  }
}