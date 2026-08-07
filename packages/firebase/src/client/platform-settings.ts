import {
  GLOBAL_SETTINGS_DOC_ID,
  SETTINGS_COLLECTION,
  type PlatformSettings,
} from "@the-ride/types";
import { doc, getDoc, type Firestore } from "firebase/firestore";

/**
 * Read-only global platform settings access (Sprint 6) — used for fare
 * estimation on the passenger web app. Writing remains admin-only; see
 * `firestore.rules` (`settings`: `allow read: if isSignedIn()`) and the
 * admin dashboard's own `settings-admin.ts` for the write half, which this
 * intentionally does not duplicate or touch.
 */
export async function getGlobalSettings(db: Firestore): Promise<PlatformSettings | null> {
  const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as PlatformSettings) : null;
}
