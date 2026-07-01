import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client does its own Node-specific module resolution (picking a
  // transport implementation at require-time); letting Turbopack/webpack
  // bundle it into the server chunks instead of requiring it natively is a
  // known source of runtime failures on Vercel. Keep it external.
  serverExternalPackages: ["@libsql/client"]
};

export default nextConfig;
