import { TRIP_REQUEST_TRANSITIONS, type TripRequestStatus } from "@the-ride/types";

/**
 * Ride request lifecycle state machine (Sprint 3, Part 5). Mirrors
 * `packages/utils/src/drivers/workflow.ts`'s pattern exactly — this is the
 * only place allowed to decide whether a `TripRequest` status transition
 * is legal. See docs/ride-request.md for the full diagram.
 */

export function getNextTripRequestStatuses(from: TripRequestStatus): TripRequestStatus[] {
  return TRIP_REQUEST_TRANSITIONS[from];
}

export function canTransitionTripRequest(from: TripRequestStatus, to: TripRequestStatus): boolean {
  return getNextTripRequestStatuses(from).includes(to);
}

export class InvalidTripRequestTransitionError extends Error {
  constructor(
    public readonly from: TripRequestStatus,
    public readonly to: TripRequestStatus,
  ) {
    super(`Cannot transition trip request from "${from}" to "${to}".`);
    this.name = "InvalidTripRequestTransitionError";
  }
}

export function assertTripRequestTransition(from: TripRequestStatus, to: TripRequestStatus): void {
  if (!canTransitionTripRequest(from, to)) {
    throw new InvalidTripRequestTransitionError(from, to);
  }
}

export function isTerminalTripRequestStatus(status: TripRequestStatus): boolean {
  return getNextTripRequestStatuses(status).length === 0;
}
