import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native + WASM SQLite backends stay external to the server bundle.
  serverExternalPackages: ["better-sqlite3", "sql.js"],
};

export default nextConfig;
