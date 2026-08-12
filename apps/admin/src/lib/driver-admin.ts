import {
  DriverAccountStatus,
  DriverApplicationStatus,
  DriverAvailabilityStatus,
  VehicleStatus,
  driverSchema,
  vehicleSchema,
  type AdminNote,
  type DocumentReviewStatus,
  type DriverApplication,
  type DriverDocumentType,
} from "@the-ride/types";
import {
  assertDriverApplicationTransition,
  documentReviewRequiresReason,
  getNextDriverApplicationStatuses,
} from "@the-ride/utils";
import {
  arrayUnion,
  doc,
  collection,
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

/**
 * Advances an application to the next stage in its review pipeline (see
 * `DRIVER_APPLICATION_TRANSITIONS`). `updatedAt` uses a plain client
 * `Date`, not `serverTimestamp()` — see `reviewDocument`'s doc comment for
 * why: every document this file writes to is realtime-subscribed
 * (`ApplicationReviewWorkspace`/`ApplicationsTab`), and a server-timestamp
 * sentinel resolves to `null` in the local-echo snapshot that listener
 * receives before the server acks, which fails `driverApplicationSchema`'s
 * strict `updatedAt` and crashes the subscriber. A client timestamp is
 * accurate enough for this field's purpose (admin-audit display).
 */
export async function advanceApplication(
  db: Firestore,
  application: DriverApplication,
  to: DriverApplicationStatus,
): Promise<void> {
  assertDriverApplicationTransition(application.status, to);
  const batch = writeBatch(db);
  batch.update(doc(db, "driverApplications", application.id), {
    status: to,
    updatedAt: new Date(),
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
    updatedAt: new Date(),
  });
  await batch.commit();
}

/**
 * What admins actually see as advance/activate buttons for a given
 * application — one per legal next status, EXCLUDING `REJECTED`.
 *
 * Bug fix (Admin Driver Application Review Workspace sprint): every
 * pre-`APPROVED` status legally transitions to both its next review stage
 * AND `REJECTED` (see `DRIVER_APPLICATION_TRANSITIONS` — rejection is
 * possible from any stage). This function used to return that whole set
 * unfiltered, and the table rendered every entry that wasn't `ACTIVATED`
 * as a plain "Advance" button — so `REJECTED` rendered as a SECOND,
 * mislabeled "Advance" button that silently rejected the application via
 * `advanceApplication()` with no reason collected at all, alongside the
 * real "Reject" button that correctly requires one. `REJECTED` already
 * has its own dedicated, reason-requiring flow (`rejectApplication`) —
 * it was never meant to appear here.
 */
export function getApplicationActions(status: DriverApplicationStatus): DriverApplicationStatus[] {
  return getNextDriverApplicationStatuses(status).filter(
    (next) => next !== DriverApplicationStatus.REJECTED,
  );
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
    updatedAt: now,
  });

  await batch.commit();
}

/**
 * Records a reviewer decision on one uploaded document (Part 12/13).
 * `reviewedAt`/`updatedAt` use a plain client `Date`, not
 * `serverTimestamp()` — a real DEV QA run against `ApplicationReviewWorkspace`
 * (whose per-document `onSnapshot` receives the local-echo snapshot for
 * this exact write before the server acks it) caught `serverTimestamp()`
 * resolving to `null` in that echo, which fails `documentReviewSchema`'s
 * required `updatedAt` and crashes the subscriber with a generic error
 * screen — the write itself succeeds, only the immediate re-render breaks.
 * Same root cause as `addAdminNote`'s array-element limitation below, just
 * triggered by an active listener instead of by the SDK rejecting the
 * write outright. A new review replaces whatever was there before — see
 * `documentReviewSchema`'s doc comment on why that's an accepted,
 * disclosed limitation rather than silently-lost history.
 */
export async function reviewDocument(
  db: Firestore,
  applicationId: string,
  documentType: DriverDocumentType,
  status: DocumentReviewStatus,
  reviewedBy: string,
  reason?: string,
): Promise<void> {
  if (documentReviewRequiresReason(status) && !reason?.trim()) {
    throw new Error("A reason is required for this document review outcome.");
  }
  const now = new Date();
  await updateDoc(doc(db, "driverApplications", applicationId), {
    [`documentReviews.${documentType}`]: {
      status,
      reviewedBy,
      reviewedAt: now,
      updatedAt: now,
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
    },
  });
}

/**
 * Appends one admin-only review note (Part 15). Client Firestore SDK's
 * `serverTimestamp()` cannot resolve inside an array element at all (a
 * documented SDK limitation — arrays have no per-element write path for
 * the server to target), so `createdAt` is a plain client `Date`; the
 * application's own `updatedAt` uses one too, for the same local-echo
 * reason documented on `reviewDocument` above. `arrayUnion` only appends —
 * it can never remove or reorder existing notes, so prior notes are never
 * lost.
 */
export async function addAdminNote(
  db: Firestore,
  applicationId: string,
  body: string,
  authorId: string,
  authorName?: string,
): Promise<void> {
  if (!body.trim()) throw new Error("Note body cannot be empty.");
  const note: AdminNote = {
    id: doc(collection(db, "driverApplications")).id,
    authorId,
    ...(authorName?.trim() ? { authorName: authorName.trim() } : {}),
    body: body.trim(),
    createdAt: new Date(),
    applicantFacing: false,
  };
  await updateDoc(doc(db, "driverApplications", applicationId), {
    adminNotes: arrayUnion(note),
    updatedAt: new Date(),
  });
}

/**
 * `updatedAt` uses a client `Date`, not `serverTimestamp()` — same
 * local-echo reason as `reviewDocument` above: `DriverDetailWorkspace`
 * subscribes to this exact document in realtime.
 */
export async function suspendDriver(db: Firestore, driverId: string): Promise<void> {
  await updateDoc(doc(db, "drivers", driverId), {
    status: DriverAccountStatus.SUSPENDED,
    availabilityStatus: DriverAvailabilityStatus.SUSPENDED,
    updatedAt: new Date(),
  });
}

export async function reactivateDriver(db: Firestore, driverId: string): Promise<void> {
  await updateDoc(doc(db, "drivers", driverId), {
    status: DriverAccountStatus.ACTIVE,
    availabilityStatus: DriverAvailabilityStatus.OFFLINE,
    updatedAt: new Date(),
  });
}
