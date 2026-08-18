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
  increment,
  onSnapshot,
  query,
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
 * FLOW-02A, extended DRIVER-E2E-06 — a driver's own real-time
 * online/available/offline toggle, written directly by the client (same
 * pattern as `advanceTripStatus` in `driver-trips.ts`) rather than through
 * `DriversRepository` (admin SDK, server-only). Scoped to exactly the
 * three self-service states `firestore.rules`'s `isOwnAvailabilityToggle()`
 * allows — `ONLINE`/`AVAILABLE`/`OFFLINE` — never `BUSY`/`ON_TRIP`/etc.,
 * which require the dispatch engine and stay admin-only.
 * `isOnline`/`isAvailable` mirror the same formula
 * `DriversRepository.setAvailabilityStatus()` uses server-side, so the
 * deprecated booleans agree with the real `availabilityStatus` regardless
 * of which path wrote the doc. `location` is optional and, when passed,
 * is the ONLY way `lastKnownLocation`/`lastLocationUpdatedAt` get set for
 * a driver — required by `DispatchService.buildMatchingCandidates`'s
 * eligibility filter, which excludes any driver without one.
 * `firestore.rules`'s `drivers/{driverId}` rule enforces both the
 * transition allowlist and that every other field (status, documents,
 * score, vehicle, …) is unchanged — this function relies on that, it
 * doesn't re-validate it.
 */
export async function setOwnAvailabilityStatus(
  db: Firestore,
  driverId: string,
  status:
    | DriverAvailabilityStatus.ONLINE
    | DriverAvailabilityStatus.AVAILABLE
    | DriverAvailabilityStatus.OFFLINE,
  location?: { lat: number; lng: number },
): Promise<void> {
  const update: Record<string, unknown> = {
    availabilityStatus: status,
    isOnline: status !== DriverAvailabilityStatus.OFFLINE,
    isAvailable: status === DriverAvailabilityStatus.AVAILABLE,
    // A plain client Date, not `serverTimestamp()` — `subscribeOwnDriverRecord`'s
    // own-write local echo resolves a pending serverTimestamp() as null, which
    // fails `driverSchema`'s `updatedAt` parse in `useExperienceInputs` (same
    // reasoning as `advanceApplication` in apps/admin's driver-admin.ts).
    updatedAt: new Date(),
  };
  if (location) {
    update.lastKnownLocation = location;
    update.lastLocationUpdatedAt = new Date();
  }
  await updateDoc(doc(db, COLLECTION, driverId), update);
}

/**
 * DRIVER-E2E-10 — a driver's own self-service return to `AVAILABLE` after
 * completing their current trip. `DRIVER_AVAILABILITY_TRANSITIONS` makes
 * `ON_TRIP -> AVAILABLE` legal, but nothing ever performed it: dispatch
 * only ever moves a driver INTO `on_trip` (`handleOfferAccepted`), never
 * back out. Distinct from `setOwnAvailabilityStatus` because this is the
 * one self-service path allowed to also touch `activeJobsCount` — by
 * exactly -1, enforced by `firestore.rules`'s `isOwnAvailabilityToggle()`
 * — since completing a trip is what actually frees that concurrency slot.
 */
export async function setAvailableAfterTripCompletion(
  db: Firestore,
  driverId: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, driverId), {
    availabilityStatus: DriverAvailabilityStatus.AVAILABLE,
    isOnline: true,
    isAvailable: true,
    activeJobsCount: increment(-1),
    updatedAt: new Date(),
  });
}
