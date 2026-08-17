import {
  DriverAvailabilityStatus,
  driverSchema,
  driverSuspensionSchema,
  vehicleSchema,
  type Driver,
  type DriverSuspension,
  type Vehicle,
} from "@the-ride/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

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
 * UX-3 sprint (Dedicated Driver Space) audit fix, Part 19 — a live
 * suspension/reactivation must reflect in the Driver Space without a manual
 * reload, but `useExperienceInputs` (the shared UX-1 hook every page's
 * `useUserExperience()` reads from) fetches `driver`/`driverApplication`
 * once per mount via one-shot `getDoc`s, not `onSnapshot` — changing that
 * shared hook to realtime would affect every consumer across the whole web
 * app (homepage, login, dashboard, profile...), a much bigger change than
 * this gap calls for. `DriverShell` instead mounts a small, purpose-built
 * subscription (this function) scoped to the Driver Space alone, and calls
 * `useUserExperience()`'s own `refresh()` when the doc actually changes —
 * reusing the existing one-shot fetch/resolve pipeline instead of adding a
 * second, parallel notion of "the driver record."
 */
export function subscribeOwnDriverRecord(
  db: Firestore,
  uid: string,
  onChange: () => void,
): Unsubscribe {
  let first = true;
  return onSnapshot(
    doc(db, COLLECTION, uid),
    () => {
      // Skip the initial emission — the mounting page already has a fresh
      // fetch in flight via `useExperienceInputs`; only a LATER change
      // (an admin action while this session is open) should trigger a refresh.
      if (first) {
        first = false;
        return;
      }
      onChange();
    },
    () => {
      // Permission errors etc. are surfaced by the existing one-shot fetch
      // path already; this listener only needs to know "did it change."
    },
  );
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

/**
 * UX-3 sprint (Dedicated Driver Space), Part 10 — a driver's own linked
 * vehicle (`driver.vehicleId`). `firestore.rules`' `vehicles` rule is
 * `allow read: if isSignedIn()` (any signed-in user, not owner-scoped —
 * dispatch/booking flows already need to read vehicle info broadly), so
 * this is a plain read, same shape as `getOwnDriverRecord` above.
 */
export async function getVehicle(db: Firestore, vehicleId: string): Promise<Vehicle | null> {
  const snapshot = await getDoc(doc(db, "vehicles", vehicleId));
  if (!snapshot.exists()) return null;
  return vehicleSchema.parse({ id: snapshot.id, ...snapshot.data() });
}

/**
 * FLOW-02A — a driver's own real-time online/offline toggle, written
 * directly by the client (same pattern as `advanceTripStatus` in
 * `driver-trips.ts`) rather than through `DriversRepository` (admin SDK,
 * server-only). Scoped to exactly the two states this sprint covers —
 * `ONLINE`/`OFFLINE` — never `AVAILABLE`/`BUSY`/etc., which require the
 * dispatch engine (not implemented yet). `isAvailable` is therefore
 * always `false` here: dispatch-matchability is a distinct, later state
 * this function deliberately can't reach. `firestore.rules`'s
 * `drivers/{driverId}` rule enforces both the two-state allowlist and
 * that every other field (status, documents, score, vehicle, …) is
 * unchanged — this function relies on that, it doesn't re-validate it.
 */
export async function setOwnAvailabilityStatus(
  db: Firestore,
  driverId: string,
  status: DriverAvailabilityStatus.ONLINE | DriverAvailabilityStatus.OFFLINE,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, driverId), {
    availabilityStatus: status,
    isOnline: status === DriverAvailabilityStatus.ONLINE,
    isAvailable: false,
    updatedAt: serverTimestamp(),
  });
}
