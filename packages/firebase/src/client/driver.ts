import {
  driverSchema,
  driverSuspensionSchema,
  type Driver,
  type DriverSuspension,
} from "@the-ride/types";
import { collection, doc, getDoc, getDocs, query, where, type Firestore } from "firebase/firestore";

const COLLECTION = "drivers";
const SUSPENSIONS_COLLECTION = "driverSuspensions";

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

/**
 * UX-2 sprint, Part 12 — a suspended driver's real reason/date, not just
 * the bare `DriverAccountStatus.SUSPENDED` flag `getOwnDriverRecord`
 * already exposes. `firestore.rules`' `driverSuspensions` rule lets a
 * signed-in user read a suspension whose `driverId` matches their own uid
 * (the same `drivers/{uid}` identity `getOwnDriverRecord` relies on); "the"
 * active one is whichever hasn't been lifted yet (mirrors
 * `DriverSuspensionsRepository.findActiveForDriver`'s admin-side
 * definition), most recent first — a driver only ever has one open
 * suspension at a time in practice, but this stays correct even if that
 * ever changes.
 */
export async function getActiveSuspensionForDriver(
  db: Firestore,
  driverId: string,
): Promise<DriverSuspension | null> {
  const snapshot = await getDocs(
    query(collection(db, SUSPENSIONS_COLLECTION), where("driverId", "==", driverId)),
  );
  const active = snapshot.docs
    .map((d) => driverSuspensionSchema.parse({ id: d.id, ...d.data() }))
    .filter((s) => !s.liftedAt)
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
  return active[0] ?? null;
}
