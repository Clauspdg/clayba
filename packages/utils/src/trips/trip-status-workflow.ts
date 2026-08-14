import { TRIP_STATUS_TRANSITIONS, type TripStatus } from "@the-ride/types";

/**
 * `Trip.status` lifecycle state machine (UX-3 sprint — Dedicated Driver
 * Space, Part 7). Mirrors `packages/utils/src/drivers/workflow.ts`'s exact
 * pattern — the only place allowed to decide whether a `Trip` status
 * transition is legal.
 */

export function getNextTripStatuses(from: TripStatus): TripStatus[] {
  return TRIP_STATUS_TRANSITIONS[from];
}

export function canTransitionTrip(from: TripStatus, to: TripStatus): boolean {
  return getNextTripStatuses(from).includes(to);
}

export class InvalidTripTransitionError extends Error {
  constructor(
    public readonly from: TripStatus,
    public readonly to: TripStatus,
  ) {
    super(`Cannot transition trip from "${from}" to "${to}".`);
    this.name = "InvalidTripTransitionError";
  }
}

export function assertTripTransition(from: TripStatus, to: TripStatus): void {
  if (!canTransitionTrip(from, to)) {
    throw new InvalidTripTransitionError(from, to);
  }
}

export function isTerminalTripStatus(status: TripStatus): boolean {
  return getNextTripStatuses(status).length === 0;
}
