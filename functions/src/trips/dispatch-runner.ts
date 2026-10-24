import * as logger from "firebase-functions/logger";
import { NoDriversAvailableError, type Repositories } from "@the-ride/firebase/firestore";

/**
 * Runs `DispatchService` for one request that is already in
 * `searching_driver`. Shared by `onTripRequestCreated` (cash bookings,
 * which are created straight into `searching_driver`) and
 * `authorizePaypalOrder` (PayPal bookings, released into it only once the
 * fare is held).
 */
export async function runDispatch(repos: Repositories, requestId: string): Promise<void> {
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
}
