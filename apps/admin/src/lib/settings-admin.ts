import {
  GLOBAL_SETTINGS_DOC_ID,
  SETTINGS_COLLECTION,
  type PlatformSettings,
} from "@the-ride/types";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

/**
 * Admin-dashboard global settings read/write (Web Phase W1, Parts 5-6) —
 * direct client Firestore access to the `settings/global` singleton,
 * authorized by `firestore.rules`'s `hasRole(['admin','super_admin'])`
 * check on `settings`'s write rule. `setDoc(..., { merge: true })` so a
 * partial save from one form (Fare Configuration) never clobbers fields
 * owned by another (Dispatch Settings) — both read/write the same document.
 */

export function subscribeGlobalSettings(
  db: Firestore,
  onNext: (settings: PlatformSettings | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID),
    (snapshot) =>
      onNext(
        snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as PlatformSettings) : null,
      ),
    (err) => onError(err.message),
  );
}

export async function updateGlobalSettings(
  db: Firestore,
  updatedBy: string,
  patch: Partial<Omit<PlatformSettings, "id" | "updatedBy" | "updatedAt">>,
): Promise<void> {
  await setDoc(
    doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID),
    { ...patch, updatedBy, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
