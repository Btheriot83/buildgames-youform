import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const globalForDb = globalThis as unknown as {
  __youformDb?: Database.Database;
};

function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "data", "youform.db");
}

function migrate(db: Database.Database) {
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

export function getDb(): Database.Database {
  if (globalForDb.__youformDb) {
    return globalForDb.__youformDb;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  globalForDb.__youformDb = db;
  return db;
}

export function getDbPath(): string {
  return resolveDbPath();
}

/** Test helper: open an isolated in-memory database with schema. */
export function createMemoryDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}
