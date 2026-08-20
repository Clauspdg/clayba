import {
  createFirebaseAuthAdapter,
  getClientAuth,
  getClientFirestore,
  getClientFunctions,
  initializeClientApp,
  type ClientAuthAdapter,
} from "@the-ride/firebase/client";
import { getExpoAuthPersistence } from "@the-ride/firebase/client/native-persistence";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";

/**
 * CLAYBA Driver P0 — root cause of the white-screen launch: this whole
 * module used to run `initializeClientApp`/`getClientAuth` unguarded at
 * import time. EAS's `production`/`production-apk` build profiles never
 * had the `EXPO_PUBLIC_FIREBASE_*` values configured (only local dev,
 * via the gitignored `.env.local`, ever had them — confirmed by
 * extracting the shipped APK's JS bundle and finding the real project id
 * string nowhere in it), so `initializeApp({ apiKey: undefined, ... })`
 * threw during module evaluation — before React ever renders a single
 * frame, so no ErrorBoundary could ever have caught it. Real fix: the
 * EAS project's `production`/`preview` environments now carry these
 * values (`eas env:list --environment production`). This guard is the
 * belt-and-suspenders half — if Firebase init ever fails again for any
 * reason (bad config, EAS env misconfigured again, etc.), the app must
 * still boot to a real "Unable to connect" screen instead of a blank one.
 */
export let driverFirebaseInitError: string | null = null;
let driverAuthInstance: Auth | undefined;
let driverAuthAdapterInstance: ClientAuthAdapter | undefined;
let driverFirestoreInstance: Firestore | undefined;
let driverFunctionsInstance: Functions | undefined;

function initDriverFirebase(): void {
  try {
    initializeClientApp({
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    });
    if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY || !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error("Firebase config is missing from this build's environment variables.");
    }
    driverAuthInstance = getClientAuth(getExpoAuthPersistence());
    driverAuthAdapterInstance = createFirebaseAuthAdapter(driverAuthInstance);
    driverFirestoreInstance = getClientFirestore();
    driverFunctionsInstance = getClientFunctions();
    driverFirebaseInitError = null;
    console.warn("[boot] Firebase initialized");
  } catch (err) {
    driverFirebaseInitError = err instanceof Error ? err.message : "Firebase failed to initialize.";
    console.error("[boot] Firebase initialization failed:", driverFirebaseInitError);
  }
}

/** Re-attempts initialization — the real action behind the "Try again" button on the boot-failure screen. */
export function retryDriverFirebaseInit(): boolean {
  initDriverFirebase();
  return driverFirebaseInitError === null;
}

initDriverFirebase();

// Asserted non-null: every screen that reads these is mounted only behind
// `_layout.tsx`'s `BootGate`, which renders the boot-failure screen instead
// of the app tree whenever `driverFirebaseInitError !== null` — so by the
// time any real screen imports these, initialization has already
// succeeded and the instances above are genuinely set.
export const driverAuth = driverAuthInstance as Auth;
export const driverAuthAdapter = driverAuthAdapterInstance as ClientAuthAdapter;
export const driverFirestore = driverFirestoreInstance as Firestore;
export const driverFunctions = driverFunctionsInstance as Functions;
