import {
  passengerPreferencesSchema,
  type PassengerPreferences,
  type PassengerProfile,
} from "@the-ride/types";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";

const COLLECTION = "passengers";

/**
 * Client-side passenger profile access (Sprint 6) — thin wrapper over the
 * client Firestore SDK, following `driver-application.ts`'s pattern. The
 * passenger document id is the user's auth uid (one profile per account —
 * the same one-doc-per-uid convention `driver-admin.ts` uses for the
 * `drivers` collection), so no lookup query is needed to find "my" profile,
 * and `firestore.rules`'s `isPassengerOwner()` cross-reference always
 * resolves correctly.
 */

export async function getOrCreatePassengerProfile(
  db: Firestore,
  userId: string,
): Promise<PassengerProfile> {
  const ref = doc(db, COLLECTION, userId);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as PassengerProfile;
  }

  const preferences = passengerPreferencesSchema.parse({});
  const now = new Date();
  await setDoc(ref, {
    userId,
    preferences,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: userId, userId, preferences, createdAt: now, updatedAt: now };
}

export async function updatePassengerAddresses(
  db: Firestore,
  userId: string,
  data: { homeAddress?: string; workAddress?: string },
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, userId), { ...data, updatedAt: serverTimestamp() });
}

export async function updatePassengerPreferences(
  db: Firestore,
  userId: string,
  preferences: Partial<PassengerPreferences>,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const [key, value] of Object.entries(preferences)) {
    updates[`preferences.${key}`] = value;
  }
  await updateDoc(doc(db, COLLECTION, userId), updates);
}
