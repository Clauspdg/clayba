import { DriverAccountStatus, VehicleStatus, type Driver, type Vehicle } from "@the-ride/types";

import { getDocumentExpirationStatus } from "./document-expiration";

export type OnlineBlockReason =
  "suspended" | "inactive" | "no_vehicle" | "vehicle_not_approved" | "document_expired";

export interface OnlineEligibility {
  eligible: boolean;
  reasons: OnlineBlockReason[];
}

/**
 * UX-3 sprint (Dedicated Driver Space), Part 5 — whether a driver may go
 * online right now, and exactly why not when they can't. Pure function so
 * it's testable without Firestore and reusable by both the web Driver
 * Space and (eventually) the driver app; mirrors the SAME conditions
 * `DispatchService.buildMatchingCandidates` in `@the-ride/firebase`
 * already checks server-side (`driver.status`, vehicle approval,
 * `getDocumentExpirationStatus`) — this doesn't invent a second eligibility
 * definition, it surfaces the existing one to the driver before they try.
 * Multiple reasons can apply at once (e.g. suspended AND no vehicle) — all
 * are returned so the UI can list every real blocker, not just the first.
 */
export function getOnlineEligibility(driver: Driver, vehicle: Vehicle | null): OnlineEligibility {
  const reasons: OnlineBlockReason[] = [];

  if (driver.status === DriverAccountStatus.SUSPENDED) {
    reasons.push("suspended");
  } else if (driver.status === DriverAccountStatus.TERMINATED) {
    reasons.push("inactive");
  }

  if (!driver.vehicleId) {
    reasons.push("no_vehicle");
  } else if (
    !vehicle ||
    (vehicle.status !== VehicleStatus.APPROVED && vehicle.status !== VehicleStatus.ACTIVE)
  ) {
    reasons.push("vehicle_not_approved");
  }

  const hasExpiredDocument = driver.documents.some(
    (document) => getDocumentExpirationStatus(document.expiresAt) === "expired",
  );
  if (hasExpiredDocument) {
    reasons.push("document_expired");
  }

  return { eligible: reasons.length === 0, reasons };
}
