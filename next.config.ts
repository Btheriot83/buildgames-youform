import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native SQLite stays external; sql.js asm build is pure JS (no wasm file).
  serverExternalPackages: ["better-sqlite3", "sql.js"],
};

export default nextConfig;
