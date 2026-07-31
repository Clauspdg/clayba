import { fetchAndActivate, getRemoteConfig, type RemoteConfig } from "firebase/remote-config";
import { initializeAppCheck as firebaseInitializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";

import { getClientApp } from "./app";

/**
 * Remote Config, App Check, Crashlytics — Sprint 5, Part 1: "prepare only".
 * None of these are called from any app yet; they exist so wiring them for
 * real later is a one-line change, not a new investigation. See
 * docs/authentication.md.
 */

let cachedRemoteConfig: RemoteConfig | undefined;

/** Web-compatible (JS SDK). Not called by any app yet — no default config values have been authored. */
export function getClientRemoteConfig(): RemoteConfig {
  if (!cachedRemoteConfig) {
    cachedRemoteConfig = getRemoteConfig(getClientApp());
  }
  return cachedRemoteConfig;
}

export async function activateRemoteConfig(): Promise<boolean> {
  return fetchAndActivate(getClientRemoteConfig());
}

let cachedAppCheck: AppCheck | undefined;

/**
 * Web-compatible (JS SDK, reCAPTCHA v3 provider). Not called by any app
 * yet — needs a real reCAPTCHA site key (Firebase Console → App Check)
 * that doesn't exist yet; `siteKey` is required so a blank env var fails
 * loudly instead of silently no-op'ing.
 */
export function initializeAppCheck(siteKey: string): AppCheck {
  if (!cachedAppCheck) {
    cachedAppCheck = firebaseInitializeAppCheck(getClientApp(), {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  return cachedAppCheck;
}

/**
 * Crashlytics has no Firebase JS SDK equivalent — it's Android/iOS-only,
 * via `@react-native-firebase/crashlytics` (a native module needing its
 * own native build config, distinct from the pure-JS `firebase` package
 * this repo uses everywhere else). Nothing to stub here at the JS-SDK
 * level; adding real crash reporting to `apps/driver-app`/
 * `apps/passenger-app` means introducing that native module in a later
 * sprint. Tracked in docs/authentication.md's "Remaining work" section.
 */
export const CRASHLYTICS_REQUIRES_NATIVE_MODULE = "@react-native-firebase/crashlytics" as const;
