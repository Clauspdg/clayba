import { DRIVER_APPLICATION_TRANSITIONS, type DriverApplicationStatus } from "@the-ride/types";

/**
 * Driver recruitment pipeline state machine. This is the ONLY place allowed
 * to decide whether a `DriverApplication` may move from one status to
 * another — `@the-ride/firebase`'s driver repository calls
 * `assertDriverApplicationTransition` before writing any status change.
 * See `docs/driver-management.md` for the full diagram.
 */

export function getNextDriverApplicationStatuses(from: DriverApplicationStatus): DriverApplicationStatus[] {
  return DRIVER_APPLICATION_TRANSITIONS[from];
}

export function canTransitionDriverApplication(from: DriverApplicationStatus, to: DriverApplicationStatus): boolean {
  return getNextDriverApplicationStatuses(from).includes(to);
}

export class InvalidDriverApplicationTransitionError extends Error {
  constructor(
    public readonly from: DriverApplicationStatus,
    public readonly to: DriverApplicationStatus,
  ) {
    super(`Cannot transition driver application from "${from}" to "${to}".`);
    this.name = "InvalidDriverApplicationTransitionError";
  }
}

export function assertDriverApplicationTransition(from: DriverApplicationStatus, to: DriverApplicationStatus): void {
  if (!canTransitionDriverApplication(from, to)) {
    throw new InvalidDriverApplicationTransitionError(from, to);
  }
}

export function isTerminalDriverApplicationStatus(status: DriverApplicationStatus): boolean {
  return getNextDriverApplicationStatuses(status).length === 0;
}
