import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicit workspace root so Next does not infer C:\Users\Paul from a stray lockfile.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
