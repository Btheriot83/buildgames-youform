import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only native addon is external. sql.js asm is pure JS and must be bundled.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
