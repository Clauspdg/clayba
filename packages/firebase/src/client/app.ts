import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, initializeAuth, type Auth, type Persistence } from "firebase/auth";

/**
 * Browser/Expo-safe. Never import `firebase-admin` (or anything from
 * `@the-ride/firebase/admin`) from this module or its consumers.
 *
 * Client-side Firestore/Storage access lives alongside this in
 * `./firestore.ts`/`./storage.ts` (Sprint 5) — see docs/authentication.md.
 */
export type ClientAppConfig = FirebaseOptions;

let cachedApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;

export function initializeClientApp(config: ClientAppConfig): FirebaseApp {
  const existing = getApps()[0];
  cachedApp = existing ?? initializeApp(config);
  return cachedApp;
}

export function getClientApp(): FirebaseApp {
  if (!cachedApp) {
    throw new Error("Firebase client app has not been initialized. Call initializeClientApp() first.");
  }
  return cachedApp;
}

/**
 * Web callers: call with no arguments — `getAuth()`'s default
 * `browserLocalPersistence` already persists sessions to `localStorage`.
 *
 * React Native callers MUST pass `persistence` (see
 * `getExpoAuthPersistence()` in `./native-persistence.ts`, backed by
 * `@react-native-async-storage/async-storage`) — RN has no `localStorage`,
 * so an unconfigured `getAuth()` call would silently fail to persist
 * sessions across app restarts (Part 2: "persist sessions").
 */
export function getClientAuth(persistence?: Persistence | Persistence[]): Auth {
  if (cachedAuth) return cachedAuth;
  const app = getClientApp();
  cachedAuth = persistence ? initializeAuth(app, { persistence }) : getAuth(app);
  return cachedAuth;
}
