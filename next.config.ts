import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native + WASM SQLite backends stay external to the server bundle.
  serverExternalPackages: ["better-sqlite3", "sql.js"],
  // Ensure sql.js WASM is traced into every serverless function that may initDb.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/sql.js/dist/sql-wasm.wasm"],
    "/**": ["./node_modules/sql.js/dist/sql-wasm.wasm"],
    "/api/**/*": ["./node_modules/sql.js/dist/sql-wasm.wasm"],
    "/f/**/*": ["./node_modules/sql.js/dist/sql-wasm.wasm"],
    "/forms/**/*": ["./node_modules/sql.js/dist/sql-wasm.wasm"],
  },
};

export default nextConfig;
