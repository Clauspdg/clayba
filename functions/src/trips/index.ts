import { createHash, randomBytes } from "node:crypto";

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeAdminApp, getAdminFirestore } from "@the-ride/firebase/admin";
import { createRepositories } from "@the-ride/firebase/firestore";
import {
  RIDE_SHARE_EXPIRY_AFTER_COMPLETION_SECONDS,
  RIDE_SHARE_MAX_ACTIVE_LIFETIME_SECONDS,
  TripRequestStatus,
  TripStatus,
  type LiveDriverLocation,
  type RideSharePublicView,
  type Trip,
} from "@the-ride/types";
import { estimateEtaSeconds, haversineDistanceMeters } from "@the-ride/utils";

import { PAYPAL_SECRETS, settleCompletedTrip } from "../payments/settlement";
import { runDispatch } from "./dispatch-runner";

initializeAdminApp();

/**
 * Trusted backend entry point into the existing DispatchService. Passenger
 * booking already writes `tripRequest.status = searching_driver` at create
 * time (see `createTripRequest` in the web client) — this trigger is the
 * only thing that turns that write into a real matching run.
 */
export const onTripRequestCreated = onDocumentCreated("tripRequests/{requestId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const requestId = event.params.requestId;
  const status = snapshot.data()?.status;
  if (status !== TripRequestStatus.SEARCHING_DRIVER) {
    logger.info("Skipping dispatch: tripRequest not in searching_driver state", {
      requestId,
      status,
    });
    return;
  }

  await runDispatch(createRepositories(getAdminFirestore()), requestId);
});

interface RespondToOfferData {
  offerId: string;
  reason?: string;
}

/**
 * DRIVER-E2E-07 — the missing entry point into `DispatchService.handleOfferAccepted`.
 * `rideOffers` is admin-only under `firestore.rules` (accept/decline
 * transitions "go through DispatchService server-side only"), so a driver
 * can't accept their own offer with a direct client write; this callable is
 * that trusted server-side path, authorizing the caller against the offer's
 * own `driverId` before delegating to the existing, unmodified service
 * method — no new business logic, just the connection that was missing.
 */
export const acceptRideOffer = onCall<RespondToOfferData>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const offerId = request.data?.offerId;
  if (!offerId) {
    throw new HttpsError("invalid-argument", "offerId is required.");
  }

  const repos = createRepositories(getAdminFirestore());
  const offer = await repos.rideOffers.findById(offerId);
  if (!offer) {
    throw new HttpsError("not-found", "This ride offer no longer exists.");
  }
  if (offer.driverId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "This offer was not sent to you.");
  }
  if (offer.expiresAt.getTime() < Date.now()) {
    throw new HttpsError("failed-precondition", "This offer has expired.");
  }

  try {
    const tripRequest = await repos.dispatch.handleOfferAccepted(offerId);
    logger.info("Ride offer accepted", {
      offerId,
      driverId: request.auth.uid,
      tripRequestId: tripRequest.id,
    });
    return { tripRequestId: tripRequest.id, status: tripRequest.status };
  } catch (error) {
    logger.error("Failed to accept ride offer", { offerId, driverId: request.auth.uid, error });
    throw new HttpsError(
      "failed-precondition",
      error instanceof Error ? error.message : "Could not accept this offer.",
    );
  }
});

/** DRIVER-E2E-07 — same missing-entry-point reasoning as `acceptRideOffer`, delegating to the existing `handleOfferDeclined`. */
export const declineRideOffer = onCall<RespondToOfferData>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const offerId = request.data?.offerId;
  if (!offerId) {
    throw new HttpsError("invalid-argument", "offerId is required.");
  }

  const repos = createRepositories(getAdminFirestore());
  const offer = await repos.rideOffers.findById(offerId);
  if (!offer) {
    throw new HttpsError("not-found", "This ride offer no longer exists.");
  }
  if (offer.driverId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "This offer was not sent to you.");
  }

  try {
    const tripRequest = await repos.dispatch.handleOfferDeclined(offerId, request.data?.reason);
    logger.info("Ride offer declined", {
      offerId,
      driverId: request.auth.uid,
      tripRequestId: tripRequest.id,
    });
    return { tripRequestId: tripRequest.id, status: tripRequest.status };
  } catch (error) {
    logger.error("Failed to decline ride offer", { offerId, driverId: request.auth.uid, error });
    throw new HttpsError(
      "failed-precondition",
      error instanceof Error ? error.message : "Could not decline this offer.",
    );
  }
});

interface CompleteTripData {
  tripId: string;
}

/**
 * CLAYBA P1, Part B — the trusted server-side path for "Complete Ride."
 * `apps/web`'s `current-ride/page.tsx` used to call `advanceTripStatus`
 * (a direct client write) for every stage including this one;
 * `firestore.rules`'s `trips` update rule no longer lets a client set
 * `actualDistanceMeters`/`actualDurationSeconds`/`finalFareBreakdown`/
 * `fareAmount` directly, so the terminal transition now goes through this
 * callable instead — every earlier stage (Navigate to pickup/Arrived/
 * Start ride) is untouched. `actualDurationSeconds` is computed here from
 * the trip's own `startedAt`, never trusted from the caller;
 * `actualDistanceMeters` is whatever `onTripDriverLocationWritten` has
 * already accumulated server-side (see that trigger below) — this
 * callable freezes it, it doesn't compute it from scratch.
 */
export const completeTrip = onCall<CompleteTripData>(
  { secrets: PAYPAL_SECRETS },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const tripId = request.data?.tripId;
    if (!tripId) {
      throw new HttpsError("invalid-argument", "tripId is required.");
    }

    const repos = createRepositories(getAdminFirestore());
    const trip = await repos.trips.findById(tripId);
    if (!trip) {
      throw new HttpsError("not-found", "This ride no longer exists.");
    }
    if (trip.driverId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "This isn't your ride.");
    }
    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new HttpsError("failed-precondition", "This ride isn't in progress.");
    }

    const now = new Date();
    const actualDurationSeconds = trip.startedAt
      ? Math.max(0, (now.getTime() - trip.startedAt.getTime()) / 1000)
      : 0;
    const actualDistanceMeters = trip.actualDistanceMeters ?? 0;

    try {
      const { trip: completedTrip, recomputed } = await repos.trips.completeWithFare(
        tripId,
        actualDistanceMeters,
        actualDurationSeconds,
      );
      if (!recomputed) {
        logger.warn(
          "completeTrip: could not recompute the final fare (category/settings unresolved) — kept the pre-trip estimate",
          { tripId },
        );
      }
      logger.info("Trip completed with server-computed final fare", {
        tripId,
        driverId: request.auth.uid,
        actualDistanceMeters,
        actualDurationSeconds,
        fareAmount: completedTrip.fareAmount,
      });
      // Payments — settle in the same call so the driver's app can show
      // "collect X in cash" / "paid by PayPal" right away. Never throws: a
      // settlement problem is recorded on the payment, the ride stays completed.
      const settlement = await settleCompletedTrip(repos, completedTrip);
      return {
        status: completedTrip.status,
        fareAmount: completedTrip.fareAmount,
        actualDistanceMeters,
        actualDurationSeconds,
        settlement,
      };
    } catch (error) {
      logger.error("completeTrip failed", { tripId, driverId: request.auth.uid, error });
      throw new HttpsError(
        "failed-precondition",
        error instanceof Error ? error.message : "Could not complete this ride.",
      );
    }
  },
);

/**
 * CLAYBA P1, Part A/D — the trusted follow-up to a driver's raw
 * `driverLocation` write (`updateTripDriverLocation`,
 * packages/firebase/src/client/driver-trips.ts, still a direct,
 * un-gated client write same as before). This trigger is what actually
 * decides whether that reading counts toward the fare-meter's
 * `actualDistanceMeters` — a client can send whatever GPS coordinates it
 * wants, but it can never write `actualDistanceMeters` itself (see
 * `firestore.rules`), and this is the only code path that increments it,
 * gated by `evaluateLocationUpdate`'s accuracy/speed/noise guards.
 */
export const onTripDriverLocationWritten = onDocumentUpdated("trips/{tripId}", async (event) => {
  const before = event.data?.before?.data() as Trip | undefined;
  const after = event.data?.after?.data() as Trip | undefined;
  if (!before || !after) return;

  const beforeLocation = before.driverLocation as LiveDriverLocation | undefined;
  const afterLocation = after.driverLocation as LiveDriverLocation | undefined;
  const afterUpdatedAt = toDate(after.driverLocationUpdatedAt);
  if (!afterLocation || !afterUpdatedAt) return;

  // Only react to an actual new reading, not some unrelated field changing
  // on the same document (status advance, fare freeze, etc.).
  const beforeUpdatedAt = toDate(before.driverLocationUpdatedAt);
  if (beforeUpdatedAt && afterUpdatedAt.getTime() === beforeUpdatedAt.getTime()) return;

  const repos = createRepositories(getAdminFirestore());
  await repos.trips.accumulateDistanceFromLocationDelta(
    event.params.tripId,
    after.status,
    beforeLocation && beforeUpdatedAt
      ? { location: beforeLocation, updatedAt: beforeUpdatedAt }
      : null,
    { location: afterLocation, updatedAt: afterUpdatedAt },
  );
});

function toDate(value: unknown): Date | undefined {
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

interface CreateRideShareData {
  tripId: string;
}

function maskPlate(plateNumber: string | undefined): string | undefined {
  if (!plateNumber || plateNumber.length <= 4) return plateNumber;
  return `····${plateNumber.slice(-4)}`;
}

/**
 * CLAYBA P1, Part C — the one place that turns a real `Trip` (+ its
 * driver/vehicle) into the redacted `RideSharePublicView`, used by both
 * `createRideShare`'s initial seed and `onTripUpdatedForShares`'s ongoing
 * sync, so the two can never drift apart. `progressFraction`/`etaSeconds`
 * are computed here, server-side, from real pickup/dropoff/driverLocation
 * — the public view itself never carries raw pickup/dropoff coordinates
 * (a passenger's destination can be sensitive), only this derived,
 * general progress figure, plus the live driver marker position.
 */
async function buildPublicView(
  repos: ReturnType<typeof createRepositories>,
  trip: Trip,
): Promise<RideSharePublicView> {
  const [driver, vehicle] = await Promise.all([
    trip.driverId ? repos.drivers.findById(trip.driverId) : null,
    trip.vehicleId ? repos.vehicles.findById(trip.vehicleId) : null,
  ]);
  const driverUser = driver ? await repos.users.findById(driver.userId) : null;
  const driverFirstName = driverUser?.displayName?.trim().split(/\s+/)[0];

  let progressFraction: number | undefined;
  let etaSeconds: number | undefined;
  if (trip.driverLocation) {
    const target = trip.status === TripStatus.IN_PROGRESS ? trip.dropoff : trip.pickup;
    const distanceRemainingMeters = haversineDistanceMeters(trip.driverLocation, target);
    etaSeconds = estimateEtaSeconds(distanceRemainingMeters);
    if (trip.status === TripStatus.IN_PROGRESS) {
      const totalLegMeters = haversineDistanceMeters(trip.pickup, trip.dropoff);
      if (totalLegMeters > 0) {
        progressFraction = Math.min(1, Math.max(0, 1 - distanceRemainingMeters / totalLegMeters));
      }
    }
  }

  return {
    status: trip.status,
    pickupLabel: trip.pickup.address,
    dropoffLabel: trip.dropoff.address,
    driverFirstName,
    vehicleMakeModel: vehicle ? `${vehicle.make} ${vehicle.model}` : undefined,
    platePartial: maskPlate(vehicle?.plateNumber),
    driverLocation: trip.driverLocation,
    driverLocationUpdatedAt: trip.driverLocationUpdatedAt,
    progressFraction,
    etaSeconds,
    updatedAt: new Date(),
  };
}

/**
 * CLAYBA P1, Part C — "Share My Ride." Generates the random token
 * server-side (never round-tripped from the client), stores only its
 * SHA-256 hash as the `rideShares` document id, and seeds `publicView`
 * with the redacted fields the public page is allowed to show — critically
 * including the driver's first name, which the Admin SDK can read from
 * `users/{driver.userId}` but the passenger's own client legitimately
 * cannot (no `firestore.rules` grants a passenger read access to
 * `drivers/{driverId}`). Returns the raw token once; the caller is
 * responsible for building the `/share/ride?token=...` link (a static-export
 * app has no dynamic `[param]` routes — see `apps/web/next.config.ts`).
 */
export const createRideShare = onCall<CreateRideShareData>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const tripId = request.data?.tripId;
  if (!tripId) {
    throw new HttpsError("invalid-argument", "tripId is required.");
  }

  const repos = createRepositories(getAdminFirestore());
  const trip = await repos.trips.findById(tripId);
  if (!trip) {
    throw new HttpsError("not-found", "This ride no longer exists.");
  }
  if (trip.passengerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "This isn't your ride.");
  }
  if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
    throw new HttpsError("failed-precondition", "This ride has already ended.");
  }

  const publicView = await buildPublicView(repos, trip);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RIDE_SHARE_MAX_ACTIVE_LIFETIME_SECONDS * 1000);

  await repos.rideShares.createShare(tokenHash, {
    rideId: tripId,
    createdBy: request.auth.uid,
    expiresAt,
    publicView,
  });

  logger.info("Ride share created", { tripId, passengerId: request.auth.uid });
  return { token, expiresAt: expiresAt.toISOString() };
});

/**
 * CLAYBA P1, Part C — keeps every active share's `publicView` current as
 * the underlying trip changes (status advances, driver location updates,
 * fare freezes), and shortens (never extends) `expiresAt` once the ride
 * ends — see `RIDE_SHARE_EXPIRY_AFTER_COMPLETION_SECONDS`. The public page
 * never reads `trips/{tripId}` directly (that collection's rules stay
 * passenger/driver/staff-only); this is the only bridge.
 */
export const onTripUpdatedForShares = onDocumentUpdated("trips/{tripId}", async (event) => {
  const after = event.data?.after?.data() as Trip | undefined;
  if (!after) return;

  const repos = createRepositories(getAdminFirestore());
  const shares = await repos.rideShares.listActiveForRide(event.params.tripId);
  if (shares.length === 0) return;

  const ended = after.status === TripStatus.COMPLETED || after.status === TripStatus.CANCELLED;
  const trimmedExpiresAt = ended
    ? new Date(Date.now() + RIDE_SHARE_EXPIRY_AFTER_COMPLETION_SECONDS * 1000)
    : null;

  const publicView = await buildPublicView(repos, after);

  await Promise.all(
    shares.map(async (share) => {
      await repos.rideShares.syncPublicView(share.id, publicView);
      if (trimmedExpiresAt && trimmedExpiresAt.getTime() < share.expiresAt.getTime()) {
        await repos.rideShares.trimExpiryAfterRideEnded(share.id, trimmedExpiresAt);
      }
    }),
  );
});
