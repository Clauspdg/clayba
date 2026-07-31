import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only. Never import this module from client/Expo code — see
 * `docs/architecture-sprint1.md` ("Client vs. server Firebase SDKs").
 */
export interface AdminAppCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

let cachedApp: App | undefined;

/**
 * Initializes (or returns the already-initialized) Firebase Admin app.
 *
 * - Inside Cloud Functions, call with no arguments — the runtime provides
 *   credentials automatically via Application Default Credentials.
 * - From Next.js server code, pass `AdminAppCredentials` sourced from
 *   `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`.
 */
export function initializeAdminApp(credentials?: AdminAppCredentials): App {
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  cachedApp = credentials
    ? initializeApp({
        credential: cert({
          projectId: credentials.projectId,
          clientEmail: credentials.clientEmail,
          privateKey: credentials.privateKey.replace(/\\n/g, "\n"),
        }),
      })
    : initializeApp();

  return cachedApp;
}

export function getAdminApp(): App {
  if (!cachedApp) {
    throw new Error("Firebase Admin app has not been initialized. Call initializeAdminApp() first.");
  }
  return cachedApp;
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
