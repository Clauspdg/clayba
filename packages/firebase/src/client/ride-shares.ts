import type { RideShare } from "@the-ride/types";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { httpsCallable, type Functions } from "firebase/functions";

const RIDE_SHARES = "rideShares";

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

function toRideShare(id: string, data: Record<string, unknown>): RideShare {
  const publicView = (data.publicView ?? {}) as Record<string, unknown>;
  return {
    ...data,
    id,
    createdAt: toDateSafe(data.createdAt) ?? new Date(0),
    expiresAt: toDateSafe(data.expiresAt) ?? new Date(0),
    revokedAt: toDateSafe(data.revokedAt),
    publicView: {
      ...publicView,
      driverLocationUpdatedAt: toDateSafe(publicView.driverLocationUpdatedAt),
      updatedAt: toDateSafe(publicView.updatedAt) ?? new Date(0),
    },
  } as RideShare;
}

/**
 * CLAYBA P1, Part C — "Share My Ride." Token generation, hashing, and the
 * public-view seed all happen server-side (the `createRideShare`
 * callable, functions/src/trips/index.ts) rather than client-side:
 * the driver's first name is only legitimately readable by staff/the
 * driver themselves under `firestore.rules` (no rule grants a passenger
 * read access to `drivers/{driverId}`, a gap documented in the Passenger
 * Command Center sprint) — the Admin SDK can read it and fold it into the
 * redacted `publicView` the callable returns/writes, which the passenger
 * client never could. The raw token is returned once, here, and never
 * itself written to Firestore — only its hash (the document id) is.
 */
export async function createRideShare(
  functions: Functions,
  tripId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const call = httpsCallable<{ tripId: string }, { token: string; expiresAt: string }>(
    functions,
    "createRideShare",
  );
  const result = await call({ tripId });
  return { token: result.data.token, expiresAt: new Date(result.data.expiresAt) };
}

/** Owner-only, direct write — `firestore.rules` only lets `rideShares.createdBy` flip their own share to `revoked`. Immediately invalidates the public link (the public `get` rule requires `status == 'active'`). */
export async function stopSharingRide(db: Firestore, tokenHash: string): Promise<void> {
  await updateDoc(doc(db, RIDE_SHARES, tokenHash), {
    status: "revoked",
    revokedAt: new Date(),
  });
}

/** SHA-256 of the raw share token — the same hash the `createRideShare` callable stored as the document id, and the public page's own lookup key. `SubtleCrypto` requires a secure context (https, or localhost in dev), which every real deployment target here already is. */
export async function hashShareToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** One-shot read for the public tracking page's initial "does this link even exist" check, before subscribing live. */
export async function getRideShare(db: Firestore, tokenHash: string): Promise<RideShare | null> {
  const snapshot = await getDoc(doc(db, RIDE_SHARES, tokenHash));
  if (!snapshot.exists()) return null;
  return toRideShare(snapshot.id, snapshot.data());
}

/** Public, unauthenticated live subscription — see `firestore.rules`'s `rideShares` `get` rule, which requires no `request.auth`. Used by the `/share/ride` page only. */
export function subscribePublicRideShare(
  db: Firestore,
  tokenHash: string,
  onNext: (share: RideShare | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, RIDE_SHARES, tokenHash),
    (snapshot) => onNext(snapshot.exists() ? toRideShare(snapshot.id, snapshot.data()) : null),
    (err) => onError(err.message),
  );
}
