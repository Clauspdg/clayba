import {
  DriverAccountStatus,
  DriverApplicationStatus,
  DriverAvailabilityStatus,
  VehicleStatus,
  driverSchema,
  vehicleSchema,
  type DriverApplication,
} from "@the-ride/types";
import {
  assertDriverApplicationTransition,
  getNextDriverApplicationStatuses,
} from "@the-ride/utils";
import {
  doc,
  collection,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

/**
 * Admin-dashboard driver review actions (Web Phase W1, Parts 5-6) — real
 * writes via the client Firestore SDK (authorized by `firestore.rules`'s
 * `isAdmin()` checks), reusing the SAME pure transition-validation
 * functions (`@the-ride/utils`) the Admin-SDK repositories use server-side,
 * so an illegal status jump is rejected identically either way.
 *
 * Known gap: unlike `DriversRepository`'s server-side methods, these do
 * NOT write to `auditLogs` — that collection is `allow write: if false`
 * for every client (admin included) by design, and `apps/admin` is a
 * static export (no Next.js server runtime to host an Admin-SDK API
 * route without changing the hosting architecture). A Cloud Function
 * trigger on `driverApplications`/`drivers` writes would restore a real
 * audit trail without touching how `apps/admin` is deployed — tracked as
 * follow-up work, not implemented here.
 */

/** Advances an application to the next stage in its review pipeline (see `DRIVER_APPLICATION_TRANSITIONS`). */
export async function advanceApplication(
  db: Firestore,
  application: DriverApplication,
  to: DriverApplicationStatus,
): Promise<void> {
  assertDriverApplicationTransition(application.status, to);
  const batch = writeBatch(db);
  batch.update(doc(db, "driverApplications", application.id), {
    status: to,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function rejectApplication(
  db: Firestore,
  application: DriverApplication,
  reason: string,
): Promise<void> {
  assertDriverApplicationTransition(application.status, DriverApplicationStatus.REJECTED);
  const batch = writeBatch(db);
  batch.update(doc(db, "driverApplications", application.id), {
    status: DriverApplicationStatus.REJECTED,
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/** What admins actually see as buttons for a given application — one per legal next status. */
export function getApplicationActions(status: DriverApplicationStatus): DriverApplicationStatus[] {
  return getNextDriverApplicationStatuses(status);
}

/**
 * Activates an approved application: creates the real `Vehicle` and
 * `Driver` documents from the data staged on the application (see
 * docs — `driverApplicationSchema`'s `vehicleInfo`), then marks the
 * application activated. All in one batch so the three documents either
 * all land or none do.
 */
export async function activateApplication(
  db: Firestore,
  application: DriverApplication,
  reviewedBy: string,
): Promise<void> {
  assertDriverApplicationTransition(application.status, DriverApplicationStatus.ACTIVATED);
  if (!application.vehicleInfo) throw new Error("Application has no vehicle info to activate.");

  const now = new Date();
  const batch = writeBatch(db);

  const vehicleRef = doc(collection(db, "vehicles"));
  const vehicle = vehicleSchema.parse({
    id: vehicleRef.id,
    driverId: application.userId,
    make: application.vehicleInfo.make,
    model: application.vehicleInfo.model,
    year: application.vehicleInfo.year,
    color: application.vehicleInfo.color,
    plateNumber: application.vehicleInfo.plateNumber,
    status: VehicleStatus.APPROVED,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(vehicleRef, vehicle);

  const driverRef = doc(db, "drivers", application.userId);
  const driver = driverSchema.parse({
    id: application.userId,
    userId: application.userId,
    applicationId: application.id,
    status: DriverAccountStatus.ACTIVE,
    vehicleId: vehicleRef.id,
    availabilityStatus: DriverAvailabilityStatus.OFFLINE,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(driverRef, driver);

  batch.update(doc(db, "driverApplications", application.id), {
    status: DriverApplicationStatus.ACTIVATED,
    reviewedBy,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function suspendDriver(db: Firestore, driverId: string): Promise<void> {
  await updateDoc(doc(db, "drivers", driverId), {
    status: DriverAccountStatus.SUSPENDED,
    availabilityStatus: DriverAvailabilityStatus.SUSPENDED,
    updatedAt: serverTimestamp(),
  });
}

export async function reactivateDriver(db: Firestore, driverId: string): Promise<void> {
  await updateDoc(doc(db, "drivers", driverId), {
    status: DriverAccountStatus.ACTIVE,
    availabilityStatus: DriverAvailabilityStatus.OFFLINE,
    updatedAt: serverTimestamp(),
  });
}
