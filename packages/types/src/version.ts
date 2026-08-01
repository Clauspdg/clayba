/**
 * Centralized release version metadata (Sprint 4.6, Part 6) — the single
 * source of truth every app's About/Build Info screen (Part 7) and the
 * release pipeline (`scripts/version.mjs`, `scripts/generate-release.mjs`)
 * reads from. Not a Firestore domain — this is package-level release
 * metadata, same tier as this package's other plain constants (e.g.
 * `DEFAULT_OFFER_TIMEOUT_SECONDS`), just not nested under any of the 15
 * business domains.
 *
 * `major`/`minor`/`patch` and `ANDROID_VERSION_CODES` are bumped by
 * `scripts/version.mjs bump`, which rewrites this file plus
 * `apps/driver-app/app.json` and `apps/passenger-app/app.json` together —
 * see docs/versioning.md. Never edit `sprint` here directly except at the
 * start of a new sprint.
 *
 * `commit`/`buildDate`/`environment`/`firebaseProjectId` are NOT static:
 * they only exist at build time, injected via env vars the build pipeline
 * sets (`NEXT_PUBLIC_*` for web/admin, `EXPO_PUBLIC_*` for the native
 * apps — see docs/versioning.md for exactly which var backs which field).
 * `resolveBuildInfo()` assembles them from whatever the caller's bundler
 * exposed, so this module stays framework-agnostic and testable without
 * mocking `process.env`.
 */
export const RELEASE_VERSION = {
  major: 0,
  minor: 1,
  patch: 0,
} as const;

/** Current sprint label, shown on every Build Info screen (Part 7). */
export const RELEASE_SPRINT = "5";

export const RELEASE_VERSION_STRING = `${RELEASE_VERSION.major}.${RELEASE_VERSION.minor}.${RELEASE_VERSION.patch}`;

/**
 * Android `versionCode` per app (Part 4) — the Play Store requires a
 * monotonically increasing integer per package, and driver/passenger are
 * two independent listings with independent sequences.
 */
export const ANDROID_VERSION_CODES = {
  driver: 1,
  passenger: 1,
} as const;

export interface BuildInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  sprint: string;
  environment: string;
  firebaseProjectId: string;
  commit: string;
  buildDate: string;
}

/**
 * Assembles the full `BuildInfo` shape (Part 7) from already-resolved env
 * values. Every field falls back to a clearly-labeled placeholder so a
 * local dev build (no build-time env injection) still renders a sensible
 * Build Info screen instead of `undefined`.
 */
export function resolveBuildInfo(params: { environment?: string; firebaseProjectId?: string; commit?: string; buildDate?: string }): BuildInfo {
  return {
    version: RELEASE_VERSION_STRING,
    major: RELEASE_VERSION.major,
    minor: RELEASE_VERSION.minor,
    patch: RELEASE_VERSION.patch,
    sprint: RELEASE_SPRINT,
    environment: params.environment ?? "development",
    firebaseProjectId: params.firebaseProjectId ?? "unknown",
    commit: params.commit ?? "dev",
    buildDate: params.buildDate ?? "unknown",
  };
}
