import {
  createFirebaseAuthAdapter,
  getClientAuth,
  getClientFirestore,
  getClientFunctions,
  getClientStorage,
  initializeClientApp,
  type ClientAuthAdapter,
} from "@the-ride/firebase/client";

/**
 * Real Firebase connection (Web Phase W1) — reads the public client config
 * from `NEXT_PUBLIC_FIREBASE_*` env vars (see apps/web/.env.local, never
 * committed; docs/deployment.md). Firebase's client API key is not a
 * secret (Google's own guidance — access control lives in
 * firestore.rules/storage.rules), so it's fine to inline directly from
 * `process.env` here rather than routing through the server. Mirrors
 * apps/admin/src/lib/firebase-client.ts exactly.
 */
initializeClientApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

export const webAuth = getClientAuth();
export const webAuthAdapter: ClientAuthAdapter = createFirebaseAuthAdapter(webAuth);
export const webFirestore = getClientFirestore();
export const webStorage = getClientStorage();
export const webFunctions = getClientFunctions();
