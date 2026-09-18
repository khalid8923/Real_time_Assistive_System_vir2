import { getDb, generateId, now } from "@/lib/db";
import type {
  UserSettings,
  SavedLecture,
  SavedGlossaryItem,
  FlashcardProgress,
  Theme,
} from "@/lib/db";

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

export function getSettings(userId: string): UserSettings {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM user_settings WHERE userId = ?")
    .get(userId) as RawSettings | undefined;

  if (row) return mapSettings(row);

  // Create default settings if not exist
  const id = generateId();
  const ts = now();
  db.prepare(
    `INSERT INTO user_settings (id, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?)`
  ).run(id, userId, ts, ts);

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

export function updateSettings(
  userId: string,
  patch: Partial<Omit<UserSettings, "id" | "userId" | "createdAt">>
): UserSettings {
  getSettings(userId); // ensure exists
  const db = getDb();
  const current = getSettings(userId);

  const updated = {
    theme: patch.theme ?? current.theme,
    transcriptFontSize:
      patch.transcriptFontSize ?? current.transcriptFontSize,
    colorCodingEnabled:
      patch.colorCodingEnabled ?? current.colorCodingEnabled,
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

  db.prepare(
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
     WHERE userId = ?`
  ).run(
    updated.theme,
    updated.transcriptFontSize,
    updated.colorCodingEnabled ? 1 : 0,
    updated.soundDetectionEnabled ? 1 : 0,
    updated.soundSensitivityQuiet,
    updated.soundSensitivityNormal,
    updated.soundSensitivityLoud,
    updated.soundSensitivitySpike,
    now(),
    userId
  );

  return getSettings(userId);
}

/* ------------------------------------------------------------------ */
/* LECTURES                                                           */
/* ------------------------------------------------------------------ */

interface RawLecture extends Omit<SavedLecture, never> {}

export function listLectures(userId: string): SavedLecture[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM saved_lectures
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(userId) as RawLecture[];
}

export function getLecture(
  userId: string,
  id: string
): SavedLecture | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT * FROM saved_lectures WHERE id = ? AND userId = ?"
    )
    .get(id, userId) as RawLecture | undefined;
  return row ?? null;
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

export function saveLecture(
  userId: string,
  input: SaveLectureInput
): SavedLecture {
  const db = getDb();
  const id = generateId();
  const ts = now();
  const wordCount =
    input.wordCount ??
    input.transcript.split(/\s+/).filter(Boolean).length;

  db.prepare(
    `INSERT INTO saved_lectures
     (id, userId, name, transcript, summary, mindMapJson, glossaryJson,
      wordCount, durationMs, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
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
    ts
  );

  return getLecture(userId, id)!;
}

export function deleteLecture(userId: string, id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM saved_lectures WHERE id = ? AND userId = ?")
    .run(id, userId);
  return result.changes > 0;
}

export function renameLecture(
  userId: string,
  id: string,
  newName: string
): boolean {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE saved_lectures SET name = ?, updatedAt = ? WHERE id = ? AND userId = ?"
    )
    .run(newName, now(), id, userId);
  return result.changes > 0;
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

export function listGlossary(userId: string): SavedGlossaryItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM saved_glossary
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(userId) as RawGlossary[];
  return rows.map(mapGlossary);
}

export function saveGlossaryTerm(
  userId: string,
  input: {
    term: string;
    definition: string;
    sourceLectureId?: string;
  }
): SavedGlossaryItem {
  const db = getDb();
  const id = generateId();
  const ts = now();

  db.prepare(
    `INSERT INTO saved_glossary
     (id, userId, term, definition, sourceLectureId, starred, createdAt)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  ).run(
    id,
    userId,
    input.term,
    input.definition,
    input.sourceLectureId ?? null,
    ts
  );

  const row = db
    .prepare("SELECT * FROM saved_glossary WHERE id = ?")
    .get(id) as RawGlossary;
  return mapGlossary(row);
}

export function deleteGlossaryTerm(userId: string, id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM saved_glossary WHERE id = ? AND userId = ?")
    .run(id, userId);
  return result.changes > 0;
}

/* ------------------------------------------------------------------ */
/* FLASHCARDS                                                         */
/* ------------------------------------------------------------------ */

interface RawFlashcard {
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

export function listFlashcards(userId: string): FlashcardProgress[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM flashcards_progress
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(userId) as RawFlashcard[];
}

export function saveFlashcard(
  userId: string,
  input: {
    question: string;
    answer: string;
    difficulty?: string;
    sourceLectureId?: string;
  }
): FlashcardProgress {
  const db = getDb();
  const id = generateId();
  const ts = now();

  db.prepare(
    `INSERT INTO flashcards_progress
     (id, userId, question, answer, difficulty, sourceLectureId,
      masteryLevel, reviewCount, lastReviewedAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL, ?)`
  ).run(
    id,
    userId,
    input.question,
    input.answer,
    input.difficulty ?? "medium",
    input.sourceLectureId ?? null,
    ts
  );

  return db
    .prepare("SELECT * FROM flashcards_progress WHERE id = ?")
    .get(id) as RawFlashcard;
}

export function reviewFlashcard(
  userId: string,
  id: string,
  newMastery: number
): boolean {
  const db = getDb();
  const clamped = Math.max(0, Math.min(100, newMastery));
  const result = db
    .prepare(
      `UPDATE flashcards_progress
       SET masteryLevel = ?,
           reviewCount = reviewCount + 1,
           lastReviewedAt = ?
       WHERE id = ? AND userId = ?`
    )
    .run(clamped, now(), id, userId);
  return result.changes > 0;
}

export function deleteFlashcard(userId: string, id: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM flashcards_progress WHERE id = ? AND userId = ?")
    .run(id, userId);
  return result.changes > 0;
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

export function getUserStats(userId: string): UserStats {
  const db = getDb();

  const lectures = db
    .prepare(
      "SELECT COUNT(*) as count, COALESCE(SUM(wordCount), 0) as words FROM saved_lectures WHERE userId = ?"
    )
    .get(userId) as { count: number; words: number };

  const glossary = db
    .prepare(
      "SELECT COUNT(*) as count FROM saved_glossary WHERE userId = ?"
    )
    .get(userId) as { count: number };

  const flashcards = db
    .prepare(
      "SELECT COUNT(*) as count, COALESCE(AVG(masteryLevel), 0) as avg FROM flashcards_progress WHERE userId = ?"
    )
    .get(userId) as { count: number; avg: number };

  return {
    totalLectures: lectures.count,
    totalWords: lectures.words,
    totalGlossary: glossary.count,
    totalFlashcards: flashcards.count,
    averageMastery: Math.round(flashcards.avg),
  };
}
/* ------------------------------------------------------------------ */
/* ADMIN SETTINGS                                                     */
/* ------------------------------------------------------------------ */

import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;

function hashPassword(password: string): {
  hash: string;
  salt: string;
} {
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

export function getAdminPassword(): {
  hash: string;
  salt: string;
} | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT passwordHash, passwordSalt FROM admin_settings LIMIT 1"
    )
    .get() as { passwordHash: string; passwordSalt: string } | undefined;

  if (!row) return null;
  return { hash: row.passwordHash, salt: row.passwordSalt };
}

export function setAdminPassword(password: string): void {
  const db = getDb();
  const { hash, salt } = hashPassword(password);
  const ts = now();

  const existing = db
    .prepare("SELECT id FROM admin_settings LIMIT 1")
    .get() as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE admin_settings
       SET passwordHash = ?, passwordSalt = ?, updatedAt = ?
       WHERE id = ?`
    ).run(hash, salt, ts, existing.id);
  } else {
    db.prepare(
      `INSERT INTO admin_settings (id, passwordHash, passwordSalt, updatedAt)
       VALUES (?, ?, ?, ?)`
    ).run(generateId(), hash, salt, ts);
  }
}

export function verifyAdminPassword(password: string): boolean {
  const stored = getAdminPassword();

  // If DB doesn't have a password, use .env fallback
  if (!stored) {
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    return !!envPassword && password === envPassword;
  }

  return verifyPasswordHash(password, stored.hash, stored.salt);
}

export function hasCustomAdminPassword(): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT id FROM admin_settings LIMIT 1")
    .get();
  return !!row;
}