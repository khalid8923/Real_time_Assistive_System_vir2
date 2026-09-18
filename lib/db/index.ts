import Database from "better-sqlite3";
import path from "path";

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

const DB_PATH = path.join(process.cwd(), "sqlite.db");

const globalForDb = globalThis as unknown as {
  __cb_db?: Database.Database;
};

function runMigrations(db: Database.Database) {
  db.exec(`
    /* ============ User Settings ============ */
    CREATE TABLE IF NOT EXISTS user_settings (
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
    );

    /* ============ Saved Lectures ============ */
    CREATE TABLE IF NOT EXISTS saved_lectures (
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
    );

    CREATE INDEX IF NOT EXISTS idx_lectures_user
      ON saved_lectures(userId, createdAt DESC);

    /* ============ Saved Glossary ============ */
    CREATE TABLE IF NOT EXISTS saved_glossary (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      sourceLectureId TEXT,
      starred INTEGER NOT NULL DEFAULT 1,
      createdAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_glossary_user
      ON saved_glossary(userId, createdAt DESC);

    /* ============ Flashcards Progress ============ */
    CREATE TABLE IF NOT EXISTS flashcards_progress (
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
    );

    CREATE INDEX IF NOT EXISTS idx_flashcards_user
      ON flashcards_progress(userId, createdAt DESC);

    /* ============ Admin Settings ============ */
    CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}

export function getDb(): Database.Database {
  if (globalForDb.__cb_db) return globalForDb.__cb_db;

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);

  globalForDb.__cb_db = db;
  return db;
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