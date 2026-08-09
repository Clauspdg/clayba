import { driverSchema, type Driver } from "@the-ride/types";
import { doc, getDoc, type Firestore } from "firebase/firestore";

const COLLECTION = "drivers";

/**
 * Client-side driver record access (User State Experience sprint, Part 1)
 * — a thin read wrapper over the Firestore client SDK, matching
 * `driver-application.ts`'s pattern. The `drivers/{uid}` document id is
 * the same as the owning user's auth uid (see `activateApplication` in
 * apps/admin's driver-admin.ts), so a signed-in user can always read their
 * own driver record directly by uid — authorized by `firestore.rules`'s
 * `resource.data.userId == request.auth.uid` check on `drivers/{driverId}`.
 * This is the resolver's ground truth for "is this person an activated
 * driver" (see `resolveExperienceState` in `@the-ride/utils`).
 */
export async function getOwnDriverRecord(db: Firestore, uid: string): Promise<Driver | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, uid));
  if (!snapshot.exists()) return null;
  return driverSchema.parse({ id: snapshot.id, ...snapshot.data() });
}
