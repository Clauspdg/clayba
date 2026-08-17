import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeAdminApp, getAdminFirestore } from "@the-ride/firebase/admin";
import { createRepositories, NoDriversAvailableError } from "@the-ride/firebase/firestore";
import { TripRequestStatus } from "@the-ride/types";

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

  const repos = createRepositories(getAdminFirestore());

  try {
    await repos.dispatch.dispatch(requestId);
    logger.info("Dispatch completed for tripRequest", { requestId });
  } catch (error) {
    if (error instanceof NoDriversAvailableError) {
      logger.info("Dispatch exhausted all radius tiers with no eligible drivers", { requestId });
      return;
    }
    logger.error("Dispatch failed for tripRequest", { requestId, error });
  }
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
