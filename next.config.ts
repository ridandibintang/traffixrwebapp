import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page in this app is behind auth and reads the session cookie,
  // so Cache Components (static prerendering) is intentionally off for Phase 0.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
