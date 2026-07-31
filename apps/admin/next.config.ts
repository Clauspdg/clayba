import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export (Sprint 4.6, Part 2) — firebase.json's "admin" hosting
  // target serves apps/admin/out. See apps/web/next.config.ts for the same
  // rationale; nothing in this app requires a Node server either.
  output: "export",
  transpilePackages: [
    "@the-ride/ui",
    "@the-ride/firebase",
    "@the-ride/types",
    "@the-ride/utils",
    "@the-ride/api",
    "@the-ride/hooks",
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
