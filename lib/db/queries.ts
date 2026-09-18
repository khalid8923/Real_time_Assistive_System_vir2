import {
  getDb,
  ensureDbReady,
  generateId,
  now,
  type UserSettings,
  type SavedLecture,
  type SavedGlossaryItem,
  type FlashcardProgress,
  type Theme,
} from "@/lib/db";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

async function exec(query: string, args: unknown[] = []) {
  await ensureDbReady();
  const db = getDb();
  return db.execute({ sql: query, args: args as never });
}

async function firstRow<T>(query: string, args: unknown[] = []): Promise<T | null> {
  const result = await exec(query, args);
  const row = result.rows[0];
  return (row as T) ?? null;
}

async function allRows<T>(query: string, args: unknown[] = []): Promise<T[]> {
  const result = await exec(query, args);
  return result.rows as unknown as T[];
}

/* ------------------------------------------------------------------ */
/* USER SETTINGS                                                      */
/* ------------------------------------------------------------------ */

interface RawSettings {
  id: string;
  userId: string;
  theme: string;
  transcriptFontSize: number;
  colorCodingEnabled: number;
  soundDetectionEnabled: number;
  soundSensitivityQuiet: number;
  soundSensitivityNormal: number;
  soundSensitivityLoud: number;
  soundSensitivitySpike: number;
  createdAt: number;
  updatedAt: number;
}

function mapSettings(row: RawSettings): UserSettings {
  return {
    ...row,
    theme: row.theme as Theme,
    colorCodingEnabled: row.colorCodingEnabled === 1,
    soundDetectionEnabled: row.soundDetectionEnabled === 1,
  };
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const row = await firstRow<RawSettings>(
    "SELECT * FROM user_settings WHERE userId = ?",
    [userId]
  );

  if (row) return mapSettings(row);

  const id = generateId();
  const ts = now();

  await exec(
    `INSERT INTO user_settings (id, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?)`,
    [id, userId, ts, ts]
  );

  return {
    id,
    userId,
    theme: "dark",
    transcriptFontSize: 16,
    colorCodingEnabled: true,
    soundDetectionEnabled: false,
    soundSensitivityQuiet: 15,
    soundSensitivityNormal: 45,
    soundSensitivityLoud: 70,
    soundSensitivitySpike: 30,
    createdAt: ts,
    updatedAt: ts,
  };
}

export async function updateSettings(
  userId: string,
  patch: Partial<Omit<UserSettings, "id" | "userId" | "createdAt">>
): Promise<UserSettings> {
  const current = await getSettings(userId);

  const updated = {
    theme: patch.theme ?? current.theme,
    transcriptFontSize: patch.transcriptFontSize ?? current.transcriptFontSize,
    colorCodingEnabled: patch.colorCodingEnabled ?? current.colorCodingEnabled,
    soundDetectionEnabled:
      patch.soundDetectionEnabled ?? current.soundDetectionEnabled,
    soundSensitivityQuiet:
      patch.soundSensitivityQuiet ?? current.soundSensitivityQuiet,
    soundSensitivityNormal:
      patch.soundSensitivityNormal ?? current.soundSensitivityNormal,
    soundSensitivityLoud:
      patch.soundSensitivityLoud ?? current.soundSensitivityLoud,
    soundSensitivitySpike:
      patch.soundSensitivitySpike ?? current.soundSensitivitySpike,
  };

  await exec(
    `UPDATE user_settings
     SET theme = ?,
         transcriptFontSize = ?,
         colorCodingEnabled = ?,
         soundDetectionEnabled = ?,
         soundSensitivityQuiet = ?,
         soundSensitivityNormal = ?,
         soundSensitivityLoud = ?,
         soundSensitivitySpike = ?,
         updatedAt = ?
     WHERE userId = ?`,
    [
      updated.theme,
      updated.transcriptFontSize,
      updated.colorCodingEnabled ? 1 : 0,
      updated.soundDetectionEnabled ? 1 : 0,
      updated.soundSensitivityQuiet,
      updated.soundSensitivityNormal,
      updated.soundSensitivityLoud,
      updated.soundSensitivitySpike,
      now(),
      userId,
    ]
  );

  return getSettings(userId);
}

/* ------------------------------------------------------------------ */
/* LECTURES                                                           */
/* ------------------------------------------------------------------ */

export async function listLectures(userId: string): Promise<SavedLecture[]> {
  return allRows<SavedLecture>(
    `SELECT * FROM saved_lectures
     WHERE userId = ?
     ORDER BY createdAt DESC`,
    [userId]
  );
}

export async function getLecture(
  userId: string,
  id: string
): Promise<SavedLecture | null> {
  return firstRow<SavedLecture>(
    "SELECT * FROM saved_lectures WHERE id = ? AND userId = ?",
    [id, userId]
  );
}

export interface SaveLectureInput {
  name: string;
  transcript: string;
  summary?: string;
  mindMapJson?: string;
  glossaryJson?: string;
  wordCount?: number;
  durationMs?: number;
}

export async function saveLecture(
  userId: string,
  input: SaveLectureInput
): Promise<SavedLecture> {
  const id = generateId();
  const ts = now();
  const wordCount =
    input.wordCount ?? input.transcript.split(/\s+/).filter(Boolean).length;

  await exec(
    `INSERT INTO saved_lectures
     (id, userId, name, transcript, summary, mindMapJson, glossaryJson,
      wordCount, durationMs, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.name,
      input.transcript,
      input.summary ?? null,
      input.mindMapJson ?? null,
      input.glossaryJson ?? null,
      wordCount,
      input.durationMs ?? 0,
      ts,
      ts,
    ]
  );

  const lecture = await getLecture(userId, id);
  return lecture!;
}

export async function deleteLecture(
  userId: string,
  id: string
): Promise<boolean> {
  const result = await exec(
    "DELETE FROM saved_lectures WHERE id = ? AND userId = ?",
    [id, userId]
  );
  return (result.rowsAffected ?? 0) > 0;
}

export async function renameLecture(
  userId: string,
  id: string,
  newName: string
): Promise<boolean> {
  const result = await exec(
    "UPDATE saved_lectures SET name = ?, updatedAt = ? WHERE id = ? AND userId = ?",
    [newName, now(), id, userId]
  );
  return (result.rowsAffected ?? 0) > 0;
}

/* ------------------------------------------------------------------ */
/* GLOSSARY                                                           */
/* ------------------------------------------------------------------ */

interface RawGlossary {
  id: string;
  userId: string;
  term: string;
  definition: string;
  sourceLectureId: string | null;
  starred: number;
  createdAt: number;
}

function mapGlossary(row: RawGlossary): SavedGlossaryItem {
  return { ...row, starred: row.starred === 1 };
}

export async function listGlossary(
  userId: string
): Promise<SavedGlossaryItem[]> {
  const rows = await allRows<RawGlossary>(
    `SELECT * FROM saved_glossary
     WHERE userId = ?
     ORDER BY createdAt DESC`,
    [userId]
  );
  return rows.map(mapGlossary);
}

export async function saveGlossaryTerm(
  userId: string,
  input: {
    term: string;
    definition: string;
    sourceLectureId?: string;
  }
): Promise<SavedGlossaryItem> {
  const id = generateId();
  const ts = now();

  await exec(
    `INSERT INTO saved_glossary
     (id, userId, term, definition, sourceLectureId, starred, createdAt)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [
      id,
      userId,
      input.term,
      input.definition,
      input.sourceLectureId ?? null,
      ts,
    ]
  );

  const row = await firstRow<RawGlossary>(
    "SELECT * FROM saved_glossary WHERE id = ?",
    [id]
  );
  return mapGlossary(row!);
}

export async function deleteGlossaryTerm(
  userId: string,
  id: string
): Promise<boolean> {
  const result = await exec(
    "DELETE FROM saved_glossary WHERE id = ? AND userId = ?",
    [id, userId]
  );
  return (result.rowsAffected ?? 0) > 0;
}

/* ------------------------------------------------------------------ */
/* FLASHCARDS                                                         */
/* ------------------------------------------------------------------ */

export async function listFlashcards(
  userId: string
): Promise<FlashcardProgress[]> {
  return allRows<FlashcardProgress>(
    `SELECT * FROM flashcards_progress
     WHERE userId = ?
     ORDER BY createdAt DESC`,
    [userId]
  );
}

export async function saveFlashcard(
  userId: string,
  input: {
    question: string;
    answer: string;
    difficulty?: string;
    sourceLectureId?: string;
  }
): Promise<FlashcardProgress> {
  const id = generateId();
  const ts = now();

  await exec(
    `INSERT INTO flashcards_progress
     (id, userId, question, answer, difficulty, sourceLectureId,
      masteryLevel, reviewCount, lastReviewedAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL, ?)`,
    [
      id,
      userId,
      input.question,
      input.answer,
      input.difficulty ?? "medium",
      input.sourceLectureId ?? null,
      ts,
    ]
  );

  const row = await firstRow<FlashcardProgress>(
    "SELECT * FROM flashcards_progress WHERE id = ?",
    [id]
  );
  return row!;
}

export async function reviewFlashcard(
  userId: string,
  id: string,
  newMastery: number
): Promise<boolean> {
  const clamped = Math.max(0, Math.min(100, newMastery));
  const result = await exec(
    `UPDATE flashcards_progress
     SET masteryLevel = ?,
         reviewCount = reviewCount + 1,
         lastReviewedAt = ?
     WHERE id = ? AND userId = ?`,
    [clamped, now(), id, userId]
  );
  return (result.rowsAffected ?? 0) > 0;
}

export async function deleteFlashcard(
  userId: string,
  id: string
): Promise<boolean> {
  const result = await exec(
    "DELETE FROM flashcards_progress WHERE id = ? AND userId = ?",
    [id, userId]
  );
  return (result.rowsAffected ?? 0) > 0;
}

/* ------------------------------------------------------------------ */
/* STATS                                                              */
/* ------------------------------------------------------------------ */

export interface UserStats {
  totalLectures: number;
  totalWords: number;
  totalGlossary: number;
  totalFlashcards: number;
  averageMastery: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const lectures = await firstRow<{ count: number; words: number }>(
    "SELECT COUNT(*) as count, COALESCE(SUM(wordCount), 0) as words FROM saved_lectures WHERE userId = ?",
    [userId]
  );

  const glossary = await firstRow<{ count: number }>(
    "SELECT COUNT(*) as count FROM saved_glossary WHERE userId = ?",
    [userId]
  );

  const flashcards = await firstRow<{ count: number; avg: number }>(
    "SELECT COUNT(*) as count, COALESCE(AVG(masteryLevel), 0) as avg FROM flashcards_progress WHERE userId = ?",
    [userId]
  );

  return {
    totalLectures: Number(lectures?.count ?? 0),
    totalWords: Number(lectures?.words ?? 0),
    totalGlossary: Number(glossary?.count ?? 0),
    totalFlashcards: Number(flashcards?.count ?? 0),
    averageMastery: Math.round(Number(flashcards?.avg ?? 0)),
  };
}

/* ------------------------------------------------------------------ */
/* ADMIN SETTINGS                                                     */
/* ------------------------------------------------------------------ */

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt };
}

function verifyPasswordHash(
  password: string,
  hash: string,
  salt: string
): boolean {
  try {
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
    const stored = Buffer.from(hash, "hex");
    if (derived.length !== stored.length) return false;
    return timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}

export async function getAdminPassword(): Promise<{
  hash: string;
  salt: string;
} | null> {
  const row = await firstRow<{ passwordHash: string; passwordSalt: string }>(
    "SELECT passwordHash, passwordSalt FROM admin_settings LIMIT 1"
  );

  if (!row) return null;
  return { hash: row.passwordHash, salt: row.passwordSalt };
}

export async function setAdminPassword(password: string): Promise<void> {
  const { hash, salt } = hashPassword(password);
  const ts = now();

  const existing = await firstRow<{ id: string }>(
    "SELECT id FROM admin_settings LIMIT 1"
  );

  if (existing) {
    await exec(
      `UPDATE admin_settings
       SET passwordHash = ?, passwordSalt = ?, updatedAt = ?
       WHERE id = ?`,
      [hash, salt, ts, existing.id]
    );
  } else {
    await exec(
      `INSERT INTO admin_settings (id, passwordHash, passwordSalt, updatedAt)
       VALUES (?, ?, ?, ?)`,
      [generateId(), hash, salt, ts]
    );
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = await getAdminPassword();

  if (!stored) {
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    return !!envPassword && password === envPassword;
  }

  return verifyPasswordHash(password, stored.hash, stored.salt);
}

export async function hasCustomAdminPassword(): Promise<boolean> {
  const row = await firstRow<{ id: string }>(
    "SELECT id FROM admin_settings LIMIT 1"
  );
  return !!row;
}