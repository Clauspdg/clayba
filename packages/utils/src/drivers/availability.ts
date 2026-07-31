import { DRIVER_AVAILABILITY_TRANSITIONS, DriverAvailabilityStatus } from "@the-ride/types";

/**
 * Driver real-time availability state machine (Sprint 4, Part 1). Same
 * pattern as `packages/utils/src/drivers/workflow.ts` (driver application
 * lifecycle) — this is the only place allowed to decide whether an
 * availability transition is legal. See docs/driver-presence.md.
 */

export function getNextAvailabilityStatuses(from: DriverAvailabilityStatus): DriverAvailabilityStatus[] {
  return DRIVER_AVAILABILITY_TRANSITIONS[from];
}

export function canTransitionAvailability(from: DriverAvailabilityStatus, to: DriverAvailabilityStatus): boolean {
  return getNextAvailabilityStatuses(from).includes(to);
}

export class InvalidAvailabilityTransitionError extends Error {
  constructor(
    public readonly from: DriverAvailabilityStatus,
    public readonly to: DriverAvailabilityStatus,
  ) {
    super(`Cannot transition driver availability from "${from}" to "${to}".`);
    this.name = "InvalidAvailabilityTransitionError";
  }
}

export function assertAvailabilityTransition(from: DriverAvailabilityStatus, to: DriverAvailabilityStatus): void {
  if (!canTransitionAvailability(from, to)) {
    throw new InvalidAvailabilityTransitionError(from, to);
  }
}

/** Whether a driver in this status can be offered a ride at all — used by the matching engine's eligibility filter. */
export function isAvailableForOffers(status: DriverAvailabilityStatus): boolean {
  return status === DriverAvailabilityStatus.AVAILABLE;
}
