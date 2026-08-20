import {
  OfferStatus,
  TripStatus,
  type LiveDriverLocation,
  type RideOffer,
  type Trip,
  type TripRequest,
} from "@the-ride/types";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable, type Functions } from "firebase/functions";

const TRIPS = "trips";
const TRIP_REQUESTS = "tripRequests";
const RIDE_OFFERS = "rideOffers";

const ACTIVE_TRIP_STATUSES = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];
const FINISHED_TRIP_STATUSES = [TripStatus.COMPLETED, TripStatus.CANCELLED];

/**
 * Client-side driver trip/offer read access (UX-3 sprint — Dedicated
 * Driver Space). Firestore's client SDK hands back a `Timestamp`, not a
 * `Date`, for every date-typed field — `tripSchema`/`rideOfferSchema`/
 * `tripRequestSchema` use plain `z.date()` (not the `firestoreDateSchema`
 * bridge `@the-ride/types`'s driver schemas use), so parsing a raw
 * snapshot through them here would throw. `toDateSafe` below converts just
 * the fields these functions actually read, matching this module's own
 * risk surface rather than changing those three schemas' stricter date
 * handling for every other consumer.
 */
function toDateSafe(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}

function toTrip(id: string, data: Record<string, unknown>): Trip {
  return {
    ...data,
    id,
    requestedAt: toDateSafe(data.requestedAt) ?? new Date(0),
    startedAt: toDateSafe(data.startedAt),
    arrivedAt: toDateSafe(data.arrivedAt),
    completedAt: toDateSafe(data.completedAt),
    cancelledAt: toDateSafe(data.cancelledAt),
    driverLocationUpdatedAt: toDateSafe(data.driverLocationUpdatedAt),
    createdAt: toDateSafe(data.createdAt) ?? new Date(0),
    updatedAt: toDateSafe(data.updatedAt) ?? new Date(0),
  } as Trip;
}

function toRideOffer(id: string, data: Record<string, unknown>): RideOffer {
  return {
    ...data,
    id,
    createdAt: toDateSafe(data.createdAt) ?? new Date(0),
    sentAt: toDateSafe(data.sentAt),
    viewedAt: toDateSafe(data.viewedAt),
    respondedAt: toDateSafe(data.respondedAt),
    expiresAt: toDateSafe(data.expiresAt) ?? new Date(0),
    updatedAt: toDateSafe(data.updatedAt) ?? new Date(0),
  } as RideOffer;
}

function toTripRequest(id: string, data: Record<string, unknown>): TripRequest {
  return {
    ...data,
    id,
    driverResponseDeadline: toDateSafe(data.driverResponseDeadline),
    cancelledAt: toDateSafe(data.cancelledAt),
    requestedAt: toDateSafe(data.requestedAt) ?? new Date(0),
    expiresAt: toDateSafe(data.expiresAt),
    createdAt: toDateSafe(data.createdAt) ?? new Date(0),
    updatedAt: toDateSafe(data.updatedAt),
  } as TripRequest;
}

/** Live-updating pending ride offers for this driver (Part 6) — `SENT` only; a `VIEWED`/`ACCEPTED`/etc. offer belongs on Current Ride instead, not the requests inbox. */
export function subscribeMyRideOffers(
  db: Firestore,
  driverId: string,
  onNext: (offers: RideOffer[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, RIDE_OFFERS),
    where("driverId", "==", driverId),
    where("status", "==", OfferStatus.SENT),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => toRideOffer(d.id, d.data()))),
    (err) => onError(err.message),
  );
}

/**
 * DRIVER-E2E-07 — driver Accept/Decline, routed through the callable
 * Cloud Functions `acceptRideOffer`/`declineRideOffer` rather than a direct
 * Firestore write: `firestore.rules`'s `rideOffers` rule is `allow write:
 * if isAdmin()` (accept/decline transitions go through `DispatchService`
 * server-side only), so this is the one legitimate path a driver has to
 * respond to their own offer.
 */
export async function acceptRideOffer(functions: Functions, offerId: string): Promise<void> {
  const call = httpsCallable(functions, "acceptRideOffer");
  await call({ offerId });
}

export async function declineRideOffer(
  functions: Functions,
  offerId: string,
  reason?: string,
): Promise<void> {
  const call = httpsCallable(functions, "declineRideOffer");
  await call({ offerId, reason });
}

/** One-shot read of the trip request behind an offer/trip — pickup/dropoff live here, not on the offer or (pre-assignment) the trip. */
export async function getTripRequest(
  db: Firestore,
  tripRequestId: string,
): Promise<TripRequest | null> {
  const snapshot = await getDoc(doc(db, TRIP_REQUESTS, tripRequestId));
  if (!snapshot.exists()) return null;
  return toTripRequest(snapshot.id, snapshot.data());
}

/** This driver's single active trip, if any (Part 7) — at most one at a time in this codebase (`activeJobsCount` is 0 or 1, no queuing yet). */
export function subscribeCurrentDriverTrip(
  db: Firestore,
  driverId: string,
  onNext: (trip: Trip | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, TRIPS),
    where("driverId", "==", driverId),
    where("status", "in", ACTIVE_TRIP_STATUSES),
  );
  return onSnapshot(
    q,
    (snapshot) =>
      onNext(snapshot.empty ? null : toTrip(snapshot.docs[0]!.id, snapshot.docs[0]!.data())),
    (err) => onError(err.message),
  );
}

/** Completed/cancelled trips for this driver (Part 8), most recent first. */
export function subscribeDriverTripHistory(
  db: Firestore,
  driverId: string,
  onNext: (trips: Trip[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, TRIPS),
    where("driverId", "==", driverId),
    where("status", "in", FINISHED_TRIP_STATUSES),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => toTrip(d.id, d.data()))),
    (err) => onError(err.message),
  );
}

/**
 * Advances the driver's current trip to the next real stage (Part 7 —
 * "Navigate to pickup" / "Driver arrived" / "Start ride" / complete).
 * `firestore.rules`'s `trips` rule already lets the assigned driver update
 * their own trip document directly; `assertTripTransition` is the same
 * guard `apps/admin`-style review workflows use elsewhere in this
 * codebase, so an illegal jump is rejected client-side before the write.
 */
export async function advanceTripStatus(
  db: Firestore,
  tripId: string,
  to: TripStatus,
): Promise<void> {
  const now = new Date();
  const extra: Record<string, Date> =
    to === TripStatus.ARRIVED
      ? { arrivedAt: now }
      : to === TripStatus.IN_PROGRESS
        ? { startedAt: now }
        : to === TripStatus.COMPLETED
          ? { completedAt: now }
          : {};
  await updateDoc(doc(db, TRIPS, tripId), { status: to, updatedAt: now, ...extra });
}

/**
 * DRIVER-E2E-08 — the driver's live position during pickup approach, one
 * `watchPosition` reading at a time (throttled by the caller, not here —
 * see `current-ride/page.tsx`). Kept on the trip doc (see `tripSchema`'s
 * `driverLocation` doc comment) rather than the `Driver` doc, so the
 * assigned passenger can read it via the same `trips/{tripId}` read rule
 * that already scopes them to their own ride — no rules change needed.
 *
 * CLAYBA P1, Part A — `location` now accepts the fuller
 * `LiveDriverLocation` shape (heading/speed/accuracy, all optional) and
 * the caller now also calls this during `in_progress`, not only
 * `en_route_to_pickup`. This write itself stays a direct, un-gated
 * client write (same trust level as before — `firestore.rules` only
 * lets the assigned driver touch `driverLocation`/`driverLocationUpdatedAt`
 * on their own trip); the *trusted* distance accumulation this now feeds
 * happens server-side in `onTripDriverLocationWritten`
 * (functions/src/trips/index.ts), which validates each delta before it
 * ever counts toward `actualDistanceMeters` — see
 * `evaluateLocationUpdate` in `@the-ride/utils`.
 */
export async function updateTripDriverLocation(
  db: Firestore,
  tripId: string,
  location: LiveDriverLocation,
): Promise<void> {
  await updateDoc(doc(db, TRIPS, tripId), {
    driverLocation: location,
    driverLocationUpdatedAt: new Date(),
  });
}

/**
 * CLAYBA P1, Part B — routes the final "Complete Ride" transition through
 * the `completeTrip` callable instead of `advanceTripStatus`'s direct
 * client write: `firestore.rules`'s `trips` update rule no longer lets a
 * driver's client set `actualDistanceMeters`/`actualDurationSeconds`/
 * `finalFareBreakdown`/`fareAmount` directly (see the rule's own comment),
 * so freezing the real final price has to happen server-side. Every other
 * stage (`Navigate to pickup`/`I've arrived`/`Start ride`) is untouched —
 * still `advanceTripStatus`, exactly as before.
 */
export async function completeTrip(functions: Functions, tripId: string): Promise<void> {
  const call = httpsCallable(functions, "completeTrip");
  await call({ tripId });
}
