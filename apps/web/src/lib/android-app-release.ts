/**
 * CLAYBA P2 — single source of truth for the Playba Driver Android
 * release currently offered for download (brief section 42: "ne pas
 * coder les versions dans plusieurs composants différents"). Mirrored
 * into the static `public/downloads/android/latest.json` this same file
 * generates, so a future in-app update check can read it without a
 * second, hand-maintained copy.
 */
export const ANDROID_DRIVER_APP_RELEASE = {
  appName: "Playba Driver",
  latestVersion: "0.1.0",
  versionCode: 10,
  minimumSupportedVersion: "0.1.0",
  downloadUrl: "/downloads/android/playba-driver-v0.1.0.apk",
  releaseNotes:
    "First Playba Driver release: real-time ride offers, live trip tracking, the progressive fare meter, and offline/reconnecting handling.",
  // Deliberately no `minAndroidVersion` claim — Expo SDK 52's real minimum
  // OS support wasn't independently verified against a physical/emulated
  // low-API device this sprint (see the final report's "remaining
  // limitations"), and the brief itself says only show this "uniquement
  // si cette version minimale est réellement choisie."
} as const;
