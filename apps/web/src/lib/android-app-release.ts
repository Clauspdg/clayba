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
 * APK filename itself.
 *
 * v0.1.2 — v0.1.1 (EAS-built, Firebase env vars fixed) still white-screened
 * on the real physical device that actually mattered. Root-caused via
 * `docs/android-build.md`'s local build pipeline (no device/emulator was
 * needed to find this one — a real local Gradle release build reproduces
 * a real release build's behavior far more reliably than bundle
 * inspection): EAS's build quota was exhausted, forcing a genuine local
 * Android/Gradle build, which surfaced and fixed several previously
 * untested local-build-environment bugs unrelated to app code (a
 * malformed keystore path, a malformed SDK path, a leaked Git-Bash HOME
 * env var, hung Android Studio analytics telemetry) — none of which
 * EAS's cloud build environment would ever hit, and none of which explain
 * the physical-device white screen by themselves.
 *
 * v0.1.3 — v0.1.2 STILL white-screened on the real physical device
 * (confirmed by the user, not assumed). Since the app's own JS boot
 * architecture already defends against every JS-level failure mode
 * (dynamic imports, error boundary, visible boot-stage UI — see
 * _layout.tsx and docs/mobile-boot-architecture.md) and the screen never
 * even reaches that UI, the likeliest remaining explanation is a native
 * failure before Hermes ever executes app code. `newArchEnabled` (React
 * Native's New Architecture / Fabric+TurboModules) is disabled here as a
 * single, targeted, reversible test of that hypothesis. NOT YET CONFIRMED
 * to fix anything — this is an untested hypothesis shipped for real
 * device verification, not a claimed fix. See the final report.
 */
export const ANDROID_DRIVER_APP_RELEASE = {
  appName: "CLAYBA Driver",
  latestVersion: "0.1.3",
  versionCode: 14,
  minimumSupportedVersion: "0.1.3",
  downloadUrl: "/downloads/android/clayba-driver-v0.1.3.apk",
  releaseNotes:
    "Disables React Native's New Architecture (Fabric/TurboModules) as a targeted test for a persistent physical-device white-screen launch failure that survived the v0.1.2 Firebase-config fix. Root cause not yet confirmed without real-device testing of this build.",
  // Deliberately no `minAndroidVersion` claim — Expo SDK 52's real minimum
  // OS support wasn't independently verified against a physical/emulated
  // low-API device this sprint (see the final report's "remaining
  // limitations"), and the brief itself says only show this "uniquement
  // si cette version minimale est réellement choisie."
} as const;
