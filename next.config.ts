import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page in this app is behind auth and reads the session cookie,
  // so Cache Components (static prerendering) is intentionally off.
  experimental: {
    serverActions: {
      // Screaming Frog exports: several CSVs of a few MB each in one upload.
      bodySizeLimit: "40mb",
    },
  },
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
