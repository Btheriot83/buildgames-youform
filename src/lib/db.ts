import fs from "fs";
import path from "path";
import type { AppDatabase } from "./db-types";
import { openSqlJsDatabase } from "./db-sqljs";

export type { AppDatabase, RunResult, Statement } from "./db-types";

const globalForDb = globalThis as unknown as {
  __emberFormsDb?: AppDatabase;
  __emberFormsDbInit?: Promise<AppDatabase>;
  __emberFormsBackend?: "better-sqlite3" | "sql.js";
};

function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  // Vercel / serverless: only /tmp is writable
  if (process.env.VERCEL || process.env.USE_SQLJS === "1") {
    return path.join("/tmp", "ember-forms.db");
  }
  return path.join(process.cwd(), "data", "youform.db");
}

function migrate(db: AppDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      schema_json TEXT NOT NULL,
      webhook_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
    CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function preferSqlJs(): boolean {
  if (process.env.USE_SQLJS === "1") return true;
  if (process.env.USE_BETTER_SQLITE3 === "1") return false;
  if (process.env.VERCEL) return true;
  return false;
}

function tryOpenBetterSqlite3(dbPath: string): AppDatabase | null {
  try {
    // Dynamic require so Vercel/webpack does not hard-fail on the native addon.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db as unknown as AppDatabase);
    return db as unknown as AppDatabase;
  } catch (err) {
    console.warn(
      "[ember-forms] better-sqlite3 unavailable, falling back to sql.js:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function openDatabase(): Promise<AppDatabase> {
  const dbPath = resolveDbPath();

  if (!preferSqlJs()) {
    const native = tryOpenBetterSqlite3(dbPath);
    if (native) {
      globalForDb.__emberFormsBackend = "better-sqlite3";
      return native;
    }
  }

  globalForDb.__emberFormsBackend = "sql.js";
  const db = await openSqlJsDatabase({ filePath: dbPath });
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

/**
 * Ensure the database is ready. Call from API routes / RSC pages before getDb().
 * Safe to call repeatedly — caches on globalThis across hot reloads / warm lambdas.
 */
export async function initDb(): Promise<AppDatabase> {
  if (globalForDb.__emberFormsDb) {
    return globalForDb.__emberFormsDb;
  }
  if (!globalForDb.__emberFormsDbInit) {
    globalForDb.__emberFormsDbInit = openDatabase()
      .then((db) => {
        globalForDb.__emberFormsDb = db;
        return db;
      })
      .catch((err) => {
        globalForDb.__emberFormsDbInit = undefined;
        throw err;
      });
  }
  return globalForDb.__emberFormsDbInit;
}

/** Sync accessor — only valid after await initDb() (or createMemoryDb). */
export function getDb(): AppDatabase {
  if (globalForDb.__emberFormsDb) {
    return globalForDb.__emberFormsDb;
  }
  // Local DX: open better-sqlite3 synchronously when possible.
  if (!preferSqlJs()) {
    const native = tryOpenBetterSqlite3(resolveDbPath());
    if (native) {
      globalForDb.__emberFormsDb = native;
      globalForDb.__emberFormsBackend = "better-sqlite3";
      return native;
    }
  }
  throw new Error(
    "Database not initialized. Call `await initDb()` first (required on Vercel / sql.js)."
  );
}

export function getDbPath(): string {
  return resolveDbPath();
}

export function getDbBackend(): "better-sqlite3" | "sql.js" | "unknown" {
  return globalForDb.__emberFormsBackend ?? "unknown";
}

/** Test helper: isolated in-memory DB (prefers better-sqlite3, else sql.js sync-via-async not used). */
export function createMemoryDb(): AppDatabase {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    migrate(db as unknown as AppDatabase);
    return db as unknown as AppDatabase;
  } catch {
    throw new Error(
      "createMemoryDb requires better-sqlite3 in the local/test environment"
    );
  }
}

/** Async in-memory sql.js DB for environments without better-sqlite3. */
export async function createMemoryDbAsync(): Promise<AppDatabase> {
  const db = await openSqlJsDatabase({ filePath: null, memory: true });
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}
