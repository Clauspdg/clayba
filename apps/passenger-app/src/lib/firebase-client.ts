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
 * Same guard CLAYBA Driver P0 added after a real white-screen launch: this
 * whole module used to run `initializeClientApp`/`getClientAuth` unguarded
 * at import time, with a non-null-asserted `EXPO_PUBLIC_FIREBASE_API_KEY`.
 * If that env var is ever absent from a build's environment (an EAS/local
 * build profile misconfiguration, exactly as happened once for Driver),
 * `initializeApp({ apiKey: undefined, ... })` throws during module
 * evaluation — before React ever renders a single frame, so no
 * ErrorBoundary could ever catch it. This guard is belt-and-suspenders: if
 * Firebase init ever fails for any reason, the app must still boot to a
 * real "Unable to connect" screen instead of a blank one.
 */
export let passengerFirebaseInitError: string | null = null;
let passengerAuthInstance: Auth | undefined;
let passengerAuthAdapterInstance: ClientAuthAdapter | undefined;
let passengerFirestoreInstance: Firestore | undefined;
let passengerFunctionsInstance: Functions | undefined;

function initPassengerFirebase(): void {
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
    passengerAuthInstance = getClientAuth(getExpoAuthPersistence());
    passengerAuthAdapterInstance = createFirebaseAuthAdapter(passengerAuthInstance);
    passengerFirestoreInstance = getClientFirestore();
    passengerFunctionsInstance = getClientFunctions();
    passengerFirebaseInitError = null;
    console.warn("[boot] Firebase initialized");
  } catch (err) {
    passengerFirebaseInitError =
      err instanceof Error ? err.message : "Firebase failed to initialize.";
    console.error("[boot] Firebase initialization failed:", passengerFirebaseInitError);
  }
}

/** Re-attempts initialization — the real action behind the "Try again" button on the boot-failure screen. */
export function retryPassengerFirebaseInit(): boolean {
  initPassengerFirebase();
  return passengerFirebaseInitError === null;
}

initPassengerFirebase();

// Asserted non-null: every screen that reads these is mounted only behind
// `_layout.tsx`'s boot gate, which renders the boot-failure screen instead
// of the app tree whenever `passengerFirebaseInitError !== null` — so by
// the time any real screen imports these, initialization has already
// succeeded and the instances above are genuinely set.
export const passengerAuth = passengerAuthInstance as Auth;
export const passengerAuthAdapter = passengerAuthAdapterInstance as ClientAuthAdapter;
export const passengerFirestore = passengerFirestoreInstance as Firestore;
export const passengerFunctions = passengerFunctionsInstance as Functions;
