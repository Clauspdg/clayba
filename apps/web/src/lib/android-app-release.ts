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
 *
 * v0.1.5 — CLAYBA Driver V2: full design-system rewrite (dual light/dark
 * palette, no hardcoded colors left in shared components, the three
 * confirmed dark-mode contrast bugs fixed), 5-tab bottom navigation
 * (Home/Rides/Earnings/Wallet/Profile), and the Go Online P0 fix —
 * root-caused against `firestore.rules`' `isOwnAvailabilityToggle()`,
 * which rejects a single-write offline->available transition. Go Online
 * now performs the same two-step online->available sequence already
 * proven correct on the web driver app, wrapped in an explicit state
 * machine with real error/retry UI. Built and installed on a physical
 * device (Samsung Galaxy A17); boots cleanly per `adb logcat` with no
 * fatal exceptions, and the redesigned Welcome screen was visually
 * confirmed on-device. The on-device session available for this build
 * was not driver-role, so the Home/Go-Online screens themselves could
 * not be visually or functionally exercised live — see the final report
 * for the CONFIRMED vs CODE-VERIFIED breakdown.
 *
 * v0.1.6 — CLAYBA Driver V3: map-first Home redesign (real
 * react-native-maps, a floating status pill, and a bottom-sheet panel
 * for online/offline state — replacing the mostly-empty V2 dashboard),
 * real vector icons (@expo/vector-icons) replacing V2's plain-glyph tab
 * bar, a fixed i18n bug (a raw untranslated key was visible on Home —
 * root cause: the greeting string lived under a different i18n
 * namespace than the one Home was reading from), a hardened driver
 * avatar (falls back to initials on a broken/stale photo URL instead of
 * a broken-image icon), and redesigned Rides/Earnings/Wallet/Profile/
 * Settings/Welcome screens per the V3 visual spec. Building this
 * version also surfaced and fixed a real, previously-latent Metro/
 * monorepo bundling bug (Expo CLI's default workspace-root
 * auto-detection was silently overriding this app's own manual
 * monorepo Metro config, corrupting the production entry-file path on
 * a cold bundler cache) — fixed via `EXPO_NO_METRO_WORKSPACE_ROOT=1` in
 * the local build pipeline. Built, signed, installed, and confirmed
 * crash-free via `adb logcat` on the physical Samsung Galaxy A17. The
 * device's lock screen could not be bypassed non-interactively this
 * session, so the new screens could not be visually screenshotted this
 * round — see the final report for the full CONFIRMED vs CODE-VERIFIED
 * breakdown.
 */
export const ANDROID_DRIVER_APP_RELEASE = {
  appName: "CLAYBA Driver",
  latestVersion: "0.1.6",
  versionCode: 17,
  minimumSupportedVersion: "0.1.6",
  downloadUrl: "/downloads/android/clayba-driver-v0.1.6.apk",
  releaseNotes:
    "CLAYBA Driver V3: map-first Home redesign, real vector icons, redesigned Rides/Earnings/Wallet/Profile/Settings/Welcome, a fixed i18n bug, and a hardened avatar fallback.",
  // Deliberately no `minAndroidVersion` claim — Expo SDK 52's real minimum
  // OS support wasn't independently verified against a physical/emulated
  // low-API device this sprint (see the final report's "remaining
  // limitations"), and the brief itself says only show this "uniquement
  // si cette version minimale est réellement choisie."
} as const;
