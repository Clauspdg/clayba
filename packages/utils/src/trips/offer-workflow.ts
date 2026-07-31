import { OFFER_TRANSITIONS, type OfferStatus } from "@the-ride/types";

/**
 * Ride offer lifecycle state machine (Sprint 4, Part 5). Same pattern as
 * `packages/utils/src/trips/workflow.ts` (trip request lifecycle) — the
 * only place allowed to decide whether an `OfferStatus` transition is
 * legal. See docs/ride-offers.md.
 */

export function getNextOfferStatuses(from: OfferStatus): OfferStatus[] {
  return OFFER_TRANSITIONS[from];
}

export function canTransitionOffer(from: OfferStatus, to: OfferStatus): boolean {
  return getNextOfferStatuses(from).includes(to);
}

export class InvalidOfferTransitionError extends Error {
  constructor(
    public readonly from: OfferStatus,
    public readonly to: OfferStatus,
  ) {
    super(`Cannot transition ride offer from "${from}" to "${to}".`);
    this.name = "InvalidOfferTransitionError";
  }
}

export function assertOfferTransition(from: OfferStatus, to: OfferStatus): void {
  if (!canTransitionOffer(from, to)) {
    throw new InvalidOfferTransitionError(from, to);
  }
}

export function isTerminalOfferStatus(status: OfferStatus): boolean {
  return getNextOfferStatuses(status).length === 0;
}
