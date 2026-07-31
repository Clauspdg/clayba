import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export (Sprint 4.6, Part 2) — firebase.json's "web" hosting target
  // serves apps/web/out. No API routes/server actions/dynamic [param] routes
  // exist in this app, so `next build` producing a static `out/` is safe;
  // `images.unoptimized` is required alongside `output: "export"` since the
  // Image Optimization API needs a Node server, which static hosting has
  // none of. See docs/firebase-hosting.md.
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
