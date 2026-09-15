import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 stays native-external; sql.js asm must be traced onto the lambda.
  serverExternalPackages: ["better-sqlite3", "sql.js"],
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/sql.js/dist/sql-asm.js",
      "./node_modules/sql.js/package.json",
    ],
  },
};

export default nextConfig;
