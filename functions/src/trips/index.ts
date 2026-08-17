import { onDocumentCreated } from "firebase-functions/v2/firestore";
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
