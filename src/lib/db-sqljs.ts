import fs from "fs";
import path from "path";
import type { AppDatabase, RunResult, Statement } from "./db-types";

type SqlJsDatabase = {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): void;
  prepare(sql: string): {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    getAsObject(params?: unknown[]): Record<string, unknown>;
    free(): void;
    reset(): void;
  };
  getRowsModified(): number;
  export(): Uint8Array;
  close(): void;
};

type SqlJsStatic = {
  Database: new (data?: ArrayLike<number> | Buffer | null) => SqlJsDatabase;
};

function wrapDatabase(
  raw: SqlJsDatabase,
  persistPath: string | null
): AppDatabase {
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  const persist = () => {
    if (!persistPath) return;
    try {
      fs.mkdirSync(path.dirname(persistPath), { recursive: true });
      fs.writeFileSync(persistPath, Buffer.from(raw.export()));
    } catch {
      // Ephemeral FS / cold start — demo data may reset.
    }
  };

  const schedulePersist = () => {
    if (!persistPath) return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persist, 50);
  };

  const wrapStatement = (sql: string): Statement => {
    return {
      get(...params: unknown[]) {
        const stmt = raw.prepare(sql);
        try {
          if (params.length) stmt.bind(params as unknown[]);
          if (!stmt.step()) return undefined;
          return stmt.getAsObject();
        } finally {
          stmt.free();
        }
      },
      all(...params: unknown[]) {
        const stmt = raw.prepare(sql);
        const rows: unknown[] = [];
        try {
          if (params.length) stmt.bind(params as unknown[]);
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      },
      run(...params: unknown[]): RunResult {
        const stmt = raw.prepare(sql);
        try {
          if (params.length) stmt.bind(params as unknown[]);
          stmt.step();
          const changes = raw.getRowsModified();
          schedulePersist();
          return { changes };
        } finally {
          stmt.free();
        }
      },
    };
  };

  return {
    prepare(sql: string) {
      return wrapStatement(sql);
    },
    exec(sql: string) {
      raw.exec(sql);
      schedulePersist();
    },
    pragma(source: string) {
      try {
        raw.exec(`PRAGMA ${source}`);
      } catch {
        // ignore unsupported pragmas in sql.js
      }
      return null;
    },
  };
}

export async function openSqlJsDatabase(opts: {
  filePath: string | null;
  memory?: boolean;
}): Promise<AppDatabase> {
  const initSqlJs = (await import("sql.js")).default;
  const wasmPath = path.join(
    process.cwd(),
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm"
  );
  const wasmBinary = fs.readFileSync(wasmPath).buffer;
  const SQL = (await initSqlJs({ wasmBinary })) as SqlJsStatic;

  let raw: SqlJsDatabase;
  const persistPath = opts.memory ? null : opts.filePath;

  if (!opts.memory && persistPath && fs.existsSync(persistPath)) {
    const buf = fs.readFileSync(persistPath);
    raw = new SQL.Database(new Uint8Array(buf));
  } else {
    raw = new SQL.Database();
  }

  return wrapDatabase(raw, persistPath);
}
