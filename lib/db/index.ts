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
/* Connection (singleton)                                             */
/* ------------------------------------------------------------------ */

const globalForDb = globalThis as unknown as {
  __cb_db?: Client;
  __cb_db_ready?: Promise<Client>;
  __cb_db_last_ping?: number;
};

const QUERY_TIMEOUT_MS = 15_000;
const DB_PING_INTERVAL_MS = 60_000;

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set. Add it to .env.local");
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
/* Query timeout wrapper                                              */
/* ------------------------------------------------------------------ */

function withTimeout<T>(promise: Promise<T>, ms = QUERY_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`DB query timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

export async function safeExecute(
  db: Client,
  query: { sql: string; args?: unknown[] }
) {
  return withTimeout(
    db.execute({ sql: query.sql, args: (query.args ?? []) as never })
  );
}

/* ------------------------------------------------------------------ */
/* Health check                                                       */
/* ------------------------------------------------------------------ */

export async function dbHealth(): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const t0 = Date.now();
  try {
    const db = getDb();
    await withTimeout(db.execute("SELECT 1 as ok"), 5000);
    globalForDb.__cb_db_last_ping = Date.now();
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Migrations (versioned)                                             */
/* ------------------------------------------------------------------ */

interface Migration {
  id: string;
  sql: string;
}

const MIGRATIONS: Migration[] = [
  {
    id: "001_user_settings",
    sql: `CREATE TABLE IF NOT EXISTS user_settings (
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
  },
  {
    id: "002_saved_lectures",
    sql: `CREATE TABLE IF NOT EXISTS saved_lectures (
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
  },
  {
    id: "003_idx_lectures_user",
    sql: `CREATE INDEX IF NOT EXISTS idx_lectures_user
      ON saved_lectures(userId, createdAt DESC)`,
  },
  {
    id: "004_saved_glossary",
    sql: `CREATE TABLE IF NOT EXISTS saved_glossary (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      sourceLectureId TEXT,
      starred INTEGER NOT NULL DEFAULT 1,
      createdAt INTEGER NOT NULL
    )`,
  },
  {
    id: "005_idx_glossary_user",
    sql: `CREATE INDEX IF NOT EXISTS idx_glossary_user
      ON saved_glossary(userId, createdAt DESC)`,
  },
  {
    id: "006_flashcards",
    sql: `CREATE TABLE IF NOT EXISTS flashcards_progress (
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
  },
  {
    id: "007_idx_flashcards_user",
    sql: `CREATE INDEX IF NOT EXISTS idx_flashcards_user
      ON flashcards_progress(userId, createdAt DESC)`,
  },
  {
    id: "008_admin_settings",
    sql: `CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY,
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    )`,
  },
  {
    id: "009_migrations_table",
    sql: `CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      appliedAt INTEGER NOT NULL
    )`,
  },
];

async function runMigrations(db: Client): Promise<void> {
  // 1. تأكد من وجود جدول _migrations
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      appliedAt INTEGER NOT NULL
    )`,
    args: [],
  });

  // 2. اقرأ الـ migrations المُطبّقة
  const appliedResult = await db.execute({
    sql: "SELECT id FROM _migrations",
    args: [],
  });
  const appliedSet = new Set(
    appliedResult.rows.map((r) => String(r.id))
  );

  // 3. طبّق الجديدة فقط
  const newlyApplied: string[] = [];
  for (const mig of MIGRATIONS) {
    if (appliedSet.has(mig.id)) continue;
    try {
      await db.execute({ sql: mig.sql, args: [] });
      await db.execute({
        sql: "INSERT OR IGNORE INTO _migrations (id, appliedAt) VALUES (?, ?)",
        args: [mig.id, Date.now()],
      });
      newlyApplied.push(mig.id);
    } catch (err) {
      console.error(`[db] Migration ${mig.id} failed:`, err);
      throw err;
    }
  }

  if (newlyApplied.length > 0) {
    console.log(`[db] Applied ${newlyApplied.length} migrations:`, newlyApplied);
  }
}

/* ------------------------------------------------------------------ */
/* Ensure DB ready                                                    */
/* ------------------------------------------------------------------ */

export async function ensureDbReady(): Promise<Client> {
  if (globalForDb.__cb_db_ready) return globalForDb.__cb_db_ready;

  const db = getDb();
  const readyPromise = (async () => {
    await runMigrations(db);
    return db;
  })();

  globalForDb.__cb_db_ready = readyPromise;

  try {
    await readyPromise;
  } catch (err) {
    // لو فشلت، اسمح بمحاولة تانية بعدين
    globalForDb.__cb_db_ready = undefined;
    throw err;
  }

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