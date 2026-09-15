import fs from "fs";
import path from "path";
import crypto from "crypto";
import vm from "vm";
import Module from "module";
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

/**
 * Load vendored sql-asm.js via vm (no webpack require/createRequire).
 * File is traced onto the lambda via outputFileTracingIncludes.
 */
function loadVendorAsm(filePath: string): (
  cfg?: Record<string, unknown>
) => Promise<SqlJsStatic> {
  const code = fs.readFileSync(filePath, "utf8");
  const m: { exports: unknown } = { exports: {} };
  const wrapped = Module.wrap(code);
  const compiled = vm.runInThisContext(wrapped, { filename: filePath });
  const fakeRequire = (id: string) => {
    if (id === "node:fs" || id === "fs") return fs;
    if (id === "node:crypto" || id === "crypto") return crypto;
    throw new Error(`sql-asm unexpected require: ${id}`);
  };
  compiled(m.exports, fakeRequire as NodeRequire, m, filePath, path.dirname(filePath));
  const exp = m.exports as
    | ((cfg?: Record<string, unknown>) => Promise<SqlJsStatic>)
    | { default: (cfg?: Record<string, unknown>) => Promise<SqlJsStatic> };
  const init = typeof exp === "function" ? exp : exp.default;
  if (typeof init !== "function") {
    throw new Error("sql-asm.js did not export an initializer function");
  }
  return init;
}

async function initSqlJsEngine(): Promise<SqlJsStatic> {
  const filePath = path.join(process.cwd(), "vendor", "sql-asm.js");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing vendor sql-asm at ${filePath}`);
  }
  const initSqlJs = loadVendorAsm(filePath);
  return (await initSqlJs({})) as SqlJsStatic;
}

export async function openSqlJsDatabase(opts: {
  filePath: string | null;
  memory?: boolean;
}): Promise<AppDatabase> {
  const SQL = await initSqlJsEngine();

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
