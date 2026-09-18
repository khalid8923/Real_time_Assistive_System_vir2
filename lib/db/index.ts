import { createClient, type Client } from "@libsql/client";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Theme = "light" | "dark" | "focus";

export interface UserSettings {
  id: string;
  userId: string;
  theme: Theme;
  transcriptFontSize: number;
  colorCodingEnabled: boolean;
  soundDetectionEnabled: boolean;
  soundSensitivityQuiet: number;
  soundSensitivityNormal: number;
  soundSensitivityLoud: number;
  soundSensitivitySpike: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavedLecture {
  id: string;
  userId: string;
  name: string;
  transcript: string;
  summary: string | null;
  mindMapJson: string | null;
  glossaryJson: string | null;
  wordCount: number;
  durationMs: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavedGlossaryItem {
  id: string;
  userId: string;
  term: string;
  definition: string;
  sourceLectureId: string | null;
  starred: boolean;
  createdAt: number;
}

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

/* ------------------------------------------------------------------ */
/* Connection (Singleton)                                             */
/* ------------------------------------------------------------------ */

const globalForDb = globalThis as unknown as {
  __cb_db?: Client;
  __cb_db_ready?: Promise<Client>;
};

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add it to .env.local"
    );
  }

  return createClient({ url, authToken });
}

export function getDb(): Client {
  if (globalForDb.__cb_db) return globalForDb.__cb_db;
  const db = createDbClient();
  globalForDb.__cb_db = db;
  return db;
}

/* ------------------------------------------------------------------ */
/* Migrations                                                         */
/* ------------------------------------------------------------------ */

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    theme TEXT NOT NULL DEFAULT 'dark',
    transcriptFontSize INTEGER NOT NULL DEFAULT 16,
    colorCodingEnabled INTEGER NOT NULL DEFAULT 1,
    soundDetectionEnabled INTEGER NOT NULL DEFAULT 0,
    soundSensitivityQuiet INTEGER NOT NULL DEFAULT 15,
    soundSensitivityNormal INTEGER NOT NULL DEFAULT 45,
    soundSensitivityLoud INTEGER NOT NULL DEFAULT 70,
    soundSensitivitySpike INTEGER NOT NULL DEFAULT 30,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS saved_lectures (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    transcript TEXT NOT NULL,
    summary TEXT,
    mindMapJson TEXT,
    glossaryJson TEXT,
    wordCount INTEGER NOT NULL DEFAULT 0,
    durationMs INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_lectures_user
    ON saved_lectures(userId, createdAt DESC)`,

  `CREATE TABLE IF NOT EXISTS saved_glossary (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    sourceLectureId TEXT,
    starred INTEGER NOT NULL DEFAULT 1,
    createdAt INTEGER NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_glossary_user
    ON saved_glossary(userId, createdAt DESC)`,

  `CREATE TABLE IF NOT EXISTS flashcards_progress (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    sourceLectureId TEXT,
    masteryLevel INTEGER NOT NULL DEFAULT 0,
    reviewCount INTEGER NOT NULL DEFAULT 0,
    lastReviewedAt INTEGER,
    createdAt INTEGER NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_flashcards_user
    ON flashcards_progress(userId, createdAt DESC)`,

  `CREATE TABLE IF NOT EXISTS admin_settings (
    id TEXT PRIMARY KEY,
    passwordHash TEXT NOT NULL,
    passwordSalt TEXT NOT NULL,
    updatedAt INTEGER NOT NULL
  )`,
];

export async function ensureDbReady(): Promise<Client> {
  if (globalForDb.__cb_db_ready) {
    return globalForDb.__cb_db_ready;
  }

  const db = getDb();

  const readyPromise = (async () => {
    await db.batch(MIGRATIONS, "write");
    return db;
  })();

  globalForDb.__cb_db_ready = readyPromise;
  return readyPromise;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function now(): number {
  return Date.now();
}