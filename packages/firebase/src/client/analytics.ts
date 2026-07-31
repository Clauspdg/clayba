import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

import { getClientApp } from "./app";

let cachedAnalytics: Analytics | null | undefined;

/**
 * Web-only (Sprint 5, Part 1) — `firebase/analytics` is built on `gtag.js`
 * and browser storage; it does not run in React Native. `apps/web`/
 * `apps/admin` call this; `apps/driver-app`/`apps/passenger-app` don't
 * (native Analytics needs `@react-native-firebase/analytics`, a separate
 * native module — not added this sprint, see docs/authentication.md).
 * `isSupported()` additionally guards SSR (Next.js renders this module
 * server-side too, where `window`/`gtag` don't exist).
 */
export async function getClientAnalytics(): Promise<Analytics | null> {
  if (cachedAnalytics !== undefined) return cachedAnalytics;
  cachedAnalytics = (await isSupported()) ? getAnalytics(getClientApp()) : null;
  return cachedAnalytics;
}
