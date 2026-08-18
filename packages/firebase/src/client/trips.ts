import {
  DEFAULT_TRIP_REQUEST_EXPIRY_SECONDS,
  TripRequestStatus,
  type FareBreakdown,
  type GeoLocation,
  type Trip,
  type TripRequest,
} from "@the-ride/types";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

const TRIP_REQUESTS = "tripRequests";
const TRIPS = "trips";

/**
 * Same reasoning as `driver-trips.ts`'s copy: `tripSchema` uses
 * `firestoreDateSchema`, but this module reads raw `snapshot.data()`
 * without `.parse()`, so a Firestore `Timestamp` needs converting by hand
 * for any date field passenger-side code actually calls `.getTime()`/
 * `.toLocaleString()` on (DRIVER-E2E-08 needs `driverLocationUpdatedAt`
 * for a location-freshness display).
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

/**
 * Client-side ride booking + history access (Sprint 6) — thin wrapper over
 * the client Firestore SDK. A booking creates a `tripRequest`; matching it
 * to a real `trips` document is the dispatch engine's job
 * (`packages/utils/src/trips/dispatch.ts` + a scheduled process), which
 * isn't deployed as a running service in this environment (same
 * disclosed gap as the admin Dispatch Center) — so a booked request will
 * genuinely sit in `searching_driver` rather than progress further. This
 * is real data reflecting real (if incomplete) infrastructure, not a
 * fabricated "matched" state.
 */

export interface NewTripRequestInput {
  passengerId: string;
  pickup: GeoLocation;
  dropoff: GeoLocation;
  stops: GeoLocation[];
  vehicleCategoryId: string;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  fareEstimate: FareBreakdown;
}

export async function createTripRequest(
  db: Firestore,
  input: NewTripRequestInput,
): Promise<string> {
  const ref = doc(collection(db, TRIP_REQUESTS));
  const expiresAt = new Date(Date.now() + DEFAULT_TRIP_REQUEST_EXPIRY_SECONDS * 1000);
  await setDoc(ref, {
    ...input,
    status: TripRequestStatus.SEARCHING_DRIVER,
    offeredDriverIds: [],
    requestedAt: serverTimestamp(),
    expiresAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeMyTripRequests(
  db: Firestore,
  passengerId: string,
  onNext: (requests: TripRequest[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, TRIP_REQUESTS),
    where("passengerId", "==", passengerId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TripRequest)),
    (err) => onError(err.message),
  );
}

export function subscribeMyTrips(
  db: Firestore,
  passengerId: string,
  onNext: (trips: Trip[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, TRIPS),
    where("passengerId", "==", passengerId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => onNext(snapshot.docs.map((d) => toTrip(d.id, d.data()))),
    (err) => onError(err.message),
  );
}

/** Owner cancellation only — see `firestore.rules`'s narrow owner-cancel path on `tripRequests`. */
export async function cancelTripRequest(db: Firestore, requestId: string): Promise<void> {
  await updateDoc(doc(db, TRIP_REQUESTS, requestId), {
    status: TripRequestStatus.CANCELLED,
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
