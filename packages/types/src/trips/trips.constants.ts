import { OfferStatus, TripRequestStatus, TripStatus } from "./trips.enums";

export const TRIPS_COLLECTION = "trips";
export const TRIP_REQUESTS_COLLECTION = "tripRequests";
export const RATINGS_COLLECTION = "ratings";
export const REVIEWS_COLLECTION = "reviews";
export const RIDE_OFFERS_COLLECTION = "rideOffers";
export const DISPATCH_QUEUE_COLLECTION = "dispatchQueue";
export const DISPATCH_EVENTS_COLLECTION = "dispatchEvents";
export const MATCHING_LOGS_COLLECTION = "matchingLogs";
export const RIDE_SHARES_COLLECTION = "rideShares";

/** CLAYBA P1, Part C — how long a share link stays valid after the ride it points to completes/cancels. Centralized so the client (initial `expiresAt` guess) and the server trigger that trims it agree. */
export const RIDE_SHARE_EXPIRY_AFTER_COMPLETION_SECONDS = 30 * 60;
/** Generous upper bound while a ride is still active/searching — a share created early in a long ride shouldn't expire mid-trip. */
export const RIDE_SHARE_MAX_ACTIVE_LIFETIME_SECONDS = 6 * 60 * 60;

/** CLAYBA P1, Part A — centralized live-location freshness thresholds. See `packages/utils/src/trips/location-freshness.ts`. */
export const LOCATION_FRESH_THRESHOLD_MS = 30_000;
export const LOCATION_STALE_THRESHOLD_MS = 120_000;

/**
 * Valid forward transitions for a ride request. Consumed by
 * `packages/utils/src/trips/workflow.ts`, which is the only place allowed
 * to decide whether a transition is legal — mirrors the pattern in
 * `packages/types/src/drivers/drivers.constants.ts` (`DRIVER_APPLICATION_TRANSITIONS`).
 */
export const TRIP_REQUEST_TRANSITIONS: Record<TripRequestStatus, TripRequestStatus[]> = {
  [TripRequestStatus.DRAFT]: [TripRequestStatus.ESTIMATING, TripRequestStatus.CANCELLED],
  [TripRequestStatus.ESTIMATING]: [TripRequestStatus.CONFIRMED, TripRequestStatus.CANCELLED],
  [TripRequestStatus.CONFIRMED]: [TripRequestStatus.SEARCHING_DRIVER, TripRequestStatus.CANCELLED],
  [TripRequestStatus.SEARCHING_DRIVER]: [
    TripRequestStatus.DRIVER_ASSIGNED,
    TripRequestStatus.CANCELLED,
    TripRequestStatus.EXPIRED,
  ],
  [TripRequestStatus.DRIVER_ASSIGNED]: [
    TripRequestStatus.DRIVER_ACCEPTED,
    TripRequestStatus.DRIVER_REJECTED,
    TripRequestStatus.CANCELLED,
  ],
  [TripRequestStatus.DRIVER_ACCEPTED]: [TripRequestStatus.CANCELLED],
  [TripRequestStatus.DRIVER_REJECTED]: [
    TripRequestStatus.SEARCHING_DRIVER,
    TripRequestStatus.EXPIRED,
  ],
  [TripRequestStatus.CANCELLED]: [],
  [TripRequestStatus.EXPIRED]: [],
  // Sprint 1 legacy values — no new transitions authored for these, kept only for backward compatibility.
  [TripRequestStatus.PENDING]: [
    TripRequestStatus.MATCHED,
    TripRequestStatus.CANCELLED,
    TripRequestStatus.EXPIRED,
  ],
  [TripRequestStatus.MATCHED]: [TripRequestStatus.CANCELLED],
};

/** Default lifetime of a trip request before it expires if no driver accepts. */
export const DEFAULT_TRIP_REQUEST_EXPIRY_SECONDS = 120;

/**
 * Valid forward transitions for a `RideOffer` (Sprint 4, Part 5). Consumed
 * by `packages/utils/src/trips/offer-workflow.ts`.
 */
export const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  [OfferStatus.CREATED]: [OfferStatus.SENT, OfferStatus.CANCELLED],
  [OfferStatus.SENT]: [
    OfferStatus.VIEWED,
    OfferStatus.ACCEPTED,
    OfferStatus.DECLINED,
    OfferStatus.EXPIRED,
    OfferStatus.CANCELLED,
  ],
  [OfferStatus.VIEWED]: [
    OfferStatus.ACCEPTED,
    OfferStatus.DECLINED,
    OfferStatus.EXPIRED,
    OfferStatus.CANCELLED,
  ],
  [OfferStatus.ACCEPTED]: [OfferStatus.COMPLETED, OfferStatus.CANCELLED],
  [OfferStatus.DECLINED]: [OfferStatus.REASSIGNED],
  [OfferStatus.EXPIRED]: [OfferStatus.REASSIGNED],
  [OfferStatus.CANCELLED]: [],
  [OfferStatus.REASSIGNED]: [],
  [OfferStatus.COMPLETED]: [],
};

/**
 * Valid forward transitions for a `Trip`'s own `status` field (UX-3 sprint
 * — Dedicated Driver Space, Part 7: Current Ride's stage progression).
 * Nothing before this sprint defined this state machine — the driver app's
 * ride lifecycle UI was local/simulated (`apps/driver-app/src/stores/driver-store.ts`)
 * and no admin-side consumer needed it either — so this is a genuinely new,
 * additive constant, not a change to an existing one. Consumed by
 * `packages/utils/src/trips/trip-status-workflow.ts`, mirroring every
 * other transition map in this file. `CANCELLED` is reachable from any
 * non-terminal stage (matches how the rest of this codebase treats
 * cancellation); `REQUESTED` is the dispatch engine's own entry stage and
 * has no forward transition defined here since a client never drives it —
 * matching moves a request straight to `MATCHED`.
 */
export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.REQUESTED]: [TripStatus.MATCHED, TripStatus.CANCELLED],
  [TripStatus.MATCHED]: [TripStatus.EN_ROUTE_TO_PICKUP, TripStatus.CANCELLED],
  [TripStatus.EN_ROUTE_TO_PICKUP]: [TripStatus.ARRIVED, TripStatus.CANCELLED],
  [TripStatus.ARRIVED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};
