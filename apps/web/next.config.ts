import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Sprint 8.4d diagnostic: short commit hash baked in at build time, so a
 * deployed page can prove which build it's actually serving (see
 * `SiteFooter.tsx`'s dev-only marker) — this sprint's whole premise is that
 * several rounds of UI fixes were committed and locally verified but never
 * actually redeployed, so "the code is correct" and "the live site reflects
 * it" turned out to be two different claims. Falls back to "unknown" rather
 * than throwing if `git` isn't on PATH in some build environment.
 *
 * UX-2 sprint: unlike the build date below, a `git rev-parse` of a fixed
 * HEAD is deterministic no matter how many times/processes call it, so
 * always resolving it here (rather than requiring callers to pre-set it)
 * carries none of the hydration risk that a fresh `Date` would.
 */
function getBuildCommit(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: process.env.NEXT_PUBLIC_BUILD_COMMIT || getBuildCommit(),
    // UX-2 sprint, Part 1 (hydration-warning root cause): this used to fall
    // back to `new Date().toISOString()` here. Next's static export loads
    // this config module separately for the client bundle compile and for
    // the server-side static-render pass, each a few seconds apart — a
    // fresh `Date` produced two different literal timestamp strings baked
    // into SiteFooter's dev-build banner text, so every page hydrated with
    // a text mismatch (React error #418) the instant it loaded. A
    // timestamp must come from a real environment variable set ONCE,
    // before `next build` runs (see `scripts/deploy-hosting.mjs`'s
    // `getBuildDate()` call) — never computed inside this module, whose
    // evaluation count/timing across build phases isn't something app code
    // controls. Ad-hoc local builds that skip that script simply get no
    // timestamp (SiteFooter renders the commit only) rather than a
    // fabricated, inconsistent one.
    NEXT_PUBLIC_BUILD_DATE: process.env.NEXT_PUBLIC_BUILD_DATE || "",
  },
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
