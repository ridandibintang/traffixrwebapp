import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page in this app is behind auth and reads the session cookie,
  // so Cache Components (static prerendering) is intentionally off.
  // PDF rendering runs in Node; keep the renderer out of the server bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
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
