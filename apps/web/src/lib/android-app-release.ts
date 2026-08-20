/**
 * CLAYBA P2 — single source of truth for the CLAYBA Driver Android
 * release currently offered for download (brief section 42: "ne pas
 * coder les versions dans plusieurs composants différents"). Mirrored
 * into the static `public/downloads/android/latest.json` this same file
 * generates, so a future in-app update check can read it without a
 * second, hand-maintained copy.
 *
 * P0 LAUNCH FAILURE FIX — renamed "Playba Driver" -> "CLAYBA Driver"
 * (app.json's `name`, this constant, install-instruction copy) and the
 * APK filename itself, so the old, broken, wrong-brand
 * `playba-driver-v0.1.0.apk` can never be confused with this fixed build.
 * The white-screen root cause (EAS `production` environment had none of
 * the `EXPO_PUBLIC_FIREBASE_*` values configured, so the release build's
 * Firebase init silently had `undefined` config — confirmed by
 * extracting the old APK's JS bundle and finding zero occurrences of the
 * real project id) is unrelated to this filename change; see
 * apps/driver-app/src/lib/firebase-client.ts and docs/deployment.md.
 */
export const ANDROID_DRIVER_APP_RELEASE = {
  appName: "CLAYBA Driver",
  latestVersion: "0.1.1",
  versionCode: 12,
  minimumSupportedVersion: "0.1.1",
  downloadUrl: "/downloads/android/clayba-driver-v0.1.1.apk",
  releaseNotes:
    "Fixes a launch failure where the app showed a blank white screen instead of Login/Driver Home (missing Firebase configuration in the release build). Also corrects the app name to CLAYBA Driver.",
  // Deliberately no `minAndroidVersion` claim — Expo SDK 52's real minimum
  // OS support wasn't independently verified against a physical/emulated
  // low-API device this sprint (see the final report's "remaining
  // limitations"), and the brief itself says only show this "uniquement
  // si cette version minimale est réellement choisie."
} as const;
