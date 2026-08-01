import { createFirebaseAuthAdapter, getClientAuth, initializeClientApp, type ClientAuthAdapter } from "@the-ride/firebase/client";
import { getExpoAuthPersistence } from "@the-ride/firebase/client/native-persistence";

/**
 * Real Firebase connection (Sprint 5, Part 1-2) — reads the public client
 * config from `EXPO_PUBLIC_FIREBASE_*` env vars (see
 * apps/passenger-app/.env.local, never committed; docs/deployment.md).
 */
initializeClientApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

export const passengerAuth = getClientAuth(getExpoAuthPersistence());
export const passengerAuthAdapter: ClientAuthAdapter = createFirebaseAuthAdapter(passengerAuth);
