import { OfferStatus, TripRequestStatus } from "./trips.enums";

export const TRIPS_COLLECTION = "trips";
export const TRIP_REQUESTS_COLLECTION = "tripRequests";
export const RATINGS_COLLECTION = "ratings";
export const REVIEWS_COLLECTION = "reviews";
export const RIDE_OFFERS_COLLECTION = "rideOffers";
export const DISPATCH_QUEUE_COLLECTION = "dispatchQueue";
export const DISPATCH_EVENTS_COLLECTION = "dispatchEvents";
export const MATCHING_LOGS_COLLECTION = "matchingLogs";

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
  [TripRequestStatus.SEARCHING_DRIVER]: [TripRequestStatus.DRIVER_ASSIGNED, TripRequestStatus.CANCELLED, TripRequestStatus.EXPIRED],
  [TripRequestStatus.DRIVER_ASSIGNED]: [TripRequestStatus.DRIVER_ACCEPTED, TripRequestStatus.DRIVER_REJECTED, TripRequestStatus.CANCELLED],
  [TripRequestStatus.DRIVER_ACCEPTED]: [TripRequestStatus.CANCELLED],
  [TripRequestStatus.DRIVER_REJECTED]: [TripRequestStatus.SEARCHING_DRIVER, TripRequestStatus.EXPIRED],
  [TripRequestStatus.CANCELLED]: [],
  [TripRequestStatus.EXPIRED]: [],
  // Sprint 1 legacy values — no new transitions authored for these, kept only for backward compatibility.
  [TripRequestStatus.PENDING]: [TripRequestStatus.MATCHED, TripRequestStatus.CANCELLED, TripRequestStatus.EXPIRED],
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
  [OfferStatus.SENT]: [OfferStatus.VIEWED, OfferStatus.ACCEPTED, OfferStatus.DECLINED, OfferStatus.EXPIRED, OfferStatus.CANCELLED],
  [OfferStatus.VIEWED]: [OfferStatus.ACCEPTED, OfferStatus.DECLINED, OfferStatus.EXPIRED, OfferStatus.CANCELLED],
  [OfferStatus.ACCEPTED]: [OfferStatus.COMPLETED, OfferStatus.CANCELLED],
  [OfferStatus.DECLINED]: [OfferStatus.REASSIGNED],
  [OfferStatus.EXPIRED]: [OfferStatus.REASSIGNED],
  [OfferStatus.CANCELLED]: [],
  [OfferStatus.REASSIGNED]: [],
  [OfferStatus.COMPLETED]: [],
};
