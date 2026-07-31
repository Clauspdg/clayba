export enum TripStatus {
  REQUESTED = "requested",
  MATCHED = "matched",
  EN_ROUTE_TO_PICKUP = "en_route_to_pickup",
  ARRIVED = "arrived",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

/**
 * Ride request lifecycle (Sprint 3, Part 5). `PENDING`/`MATCHED` are the
 * original Sprint 1 placeholder values, kept for backward compatibility —
 * new flows use `SEARCHING_DRIVER`/`DRIVER_ASSIGNED` instead, which mean
 * the same thing but are named to match the rest of this richer lifecycle.
 * See `packages/utils/src/trips/workflow.ts` for the transition rules and
 * docs/ride-request.md for the full diagram.
 */
export enum TripRequestStatus {
  DRAFT = "draft",
  ESTIMATING = "estimating",
  CONFIRMED = "confirmed",
  /** @deprecated superseded by SEARCHING_DRIVER for flows built after Sprint 3 */
  PENDING = "pending",
  SEARCHING_DRIVER = "searching_driver",
  /** @deprecated superseded by DRIVER_ASSIGNED for flows built after Sprint 3 */
  MATCHED = "matched",
  DRIVER_ASSIGNED = "driver_assigned",
  DRIVER_ACCEPTED = "driver_accepted",
  DRIVER_REJECTED = "driver_rejected",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

/**
 * Ride offer lifecycle (Sprint 4, Part 5) — one `RideOffer` document per
 * driver a trip request is offered to. Distinct from `TripRequestStatus`:
 * a single trip request can accumulate many offers (one per candidate
 * driver, across search-radius expansions) before one is accepted. See
 * `packages/utils/src/trips/offer-workflow.ts` and docs/ride-offers.md.
 */
export enum OfferStatus {
  CREATED = "created",
  SENT = "sent",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  DECLINED = "declined",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  REASSIGNED = "reassigned",
  COMPLETED = "completed",
}

/** Status of the overall search-and-offer cycle for one trip request (Sprint 4, Parts 5-7). */
export enum DispatchQueueStatus {
  PENDING = "pending",
  SEARCHING = "searching",
  ASSIGNED = "assigned",
  EXHAUSTED = "exhausted",
  CANCELLED = "cancelled",
}

/** Dispatch audit event types (Sprint 4, Part 12) — see docs/dispatch-center.md. */
export const DISPATCH_EVENT_TYPES = [
  "offer_sent",
  "offer_viewed",
  "offer_accepted",
  "offer_declined",
  "offer_expired",
  "offer_cancelled",
  "driver_reassigned",
  "radius_expanded",
  "no_drivers_found",
] as const;

export type DispatchEventType = (typeof DISPATCH_EVENT_TYPES)[number];
