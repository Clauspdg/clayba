import { z } from "zod";

import { firestoreDateSchema } from "../common/firestore-date.schema";
import { paymentMethodTypeSchema } from "../payments/payments.schemas";
import {
  DISPATCH_EVENT_TYPES,
  DispatchQueueStatus,
  OfferStatus,
  TripRequestStatus,
  TripStatus,
} from "./trips.enums";

export const tripStatusSchema = z.nativeEnum(TripStatus);
export const tripRequestStatusSchema = z.nativeEnum(TripRequestStatus);
export const offerStatusSchema = z.nativeEnum(OfferStatus);
export const dispatchQueueStatusSchema = z.nativeEnum(DispatchQueueStatus);
export const dispatchEventTypeSchema = z.enum(DISPATCH_EVENT_TYPES);

export const geoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
});

export type GeoLocation = z.infer<typeof geoLocationSchema>;

/**
 * A driver location reading, enriched beyond plain `GeoLocation` with the
 * fields a live-tracking marker/ETA/distance-accumulator needs (CLAYBA P1
 * — Real-Time Ride Experience). Kept as its own schema rather than adding
 * these fields onto `geoLocationSchema` itself: that schema is shared by
 * `pickup`/`dropoff`/`stops`, none of which have (or need) a heading/speed
 * — only a live driver reading does.
 */
export const liveDriverLocationSchema = geoLocationSchema.extend({
  /** Compass heading in degrees (0-360), when the device reports one. */
  heading: z.number().min(0).max(360).optional(),
  /** Ground speed in meters/second, when the device reports one. */
  speed: z.number().min(0).optional(),
  /** Horizontal accuracy in meters, as reported by the Geolocation API. */
  accuracy: z.number().min(0).optional(),
});

export type LiveDriverLocation = z.infer<typeof liveDriverLocationSchema>;

/**
 * Output of the pricing engine (`@the-ride/utils`'s `calculateFare`) — see
 * docs/pricing-engine.md for the formula. Every line is broken out so the
 * passenger app and admin dashboard can render an itemized estimate
 * instead of a single opaque number.
 */
export const fareBreakdownSchema = z.object({
  baseFare: z.number().min(0),
  distanceFare: z.number().min(0),
  timeFare: z.number().min(0),
  bookingFee: z.number().min(0),
  serviceFee: z.number().min(0),
  /** Placeholder — always 1 until real surge pricing ships. */
  surgeMultiplier: z.number().min(1).default(1),
  /** Placeholder — always 0 until a discount engine ships. */
  discount: z.number().min(0).default(0),
  /** Placeholder — always 0 until promo codes ship. */
  promoCodeDiscount: z.number().min(0).default(0),
  /** Placeholder — always 0 until tax rules ship. */
  tax: z.number().min(0).default(0),
  /** Platform's cut of the fare — informational, not subtracted from `total` (the passenger pays `total`; commission is settled with the driver separately, see `@the-ride/firebase`'s `CommissionsRepository`). */
  commission: z.number().min(0).default(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  currency: z.string().length(3).default("USD"),
});

export type FareBreakdown = z.infer<typeof fareBreakdownSchema>;

/**
 * Source of truth for the `trips` collection document shape. Trip matching,
 * dispatch, and fare calculation are out of scope for this sprint — this is
 * the data shape only.
 */
export const tripSchema = z.object({
  id: z.string().min(1),
  /** Links back to the `tripRequests` doc this trip was created from (DRIVER-E2E-07: offer acceptance). Optional so any earlier trip docs without it still validate. */
  tripRequestId: z.string().min(1).optional(),
  passengerId: z.string().min(1),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  status: tripStatusSchema,
  pickup: geoLocationSchema,
  dropoff: geoLocationSchema,
  requestedAt: firestoreDateSchema,
  startedAt: firestoreDateSchema.optional(),
  /** Set when the driver marks Arrived at pickup (DRIVER-E2E-08) — en_route_to_pickup -> arrived. */
  arrivedAt: firestoreDateSchema.optional(),
  completedAt: firestoreDateSchema.optional(),
  cancelledAt: firestoreDateSchema.optional(),
  /**
   * Live driver position during the pickup approach (DRIVER-E2E-08) — kept
   * on the trip doc, not the `Driver` doc, deliberately: `drivers/{uid}` is
   * only readable by its owner or staff, and broadening that to any
   * passenger would leak a driver's live position outside their own active
   * trip. `trips/{tripId}` is already readable by exactly the assigned
   * passenger and driver, so this scopes location to "this ride" for free.
   * CLAYBA P1 — extended (still optional/backward-compatible) to
   * `LiveDriverLocation` and now also written during `in_progress`, not
   * only `en_route_to_pickup` — see `updateTripDriverLocation`.
   */
  driverLocation: liveDriverLocationSchema.optional(),
  driverLocationUpdatedAt: firestoreDateSchema.optional(),
  /**
   * CLAYBA P1 — server-accumulated distance actually driven since
   * `startedAt`, built up incrementally by `onTripDriverLocationWritten`
   * (functions/src/trips/index.ts) from validated `driverLocation` deltas.
   * Never client-writable directly (see firestore.rules) — this is the
   * trusted input `completeTrip` freezes into `finalFareBreakdown`.
   */
  actualDistanceMeters: z.number().min(0).optional(),
  /** CLAYBA P1 — set by the `completeTrip` callable as `completedAt - startedAt`, not client-supplied. */
  actualDurationSeconds: z.number().min(0).optional(),
  /**
   * CLAYBA P1 — the frozen, itemized final price, computed server-side by
   * `completeTrip` from `actualDistanceMeters`/`actualDurationSeconds`
   * through the same `calculateFare` engine the pre-booking estimate uses.
   * Once set, never rewritten. `fareAmount` (below) is kept equal to
   * `finalFareBreakdown.total` at that point so every existing display
   * site that already reads `fareAmount` shows the real final price
   * without needing its own change.
   */
  finalFareBreakdown: fareBreakdownSchema.optional(),
  fareAmount: z.number().min(0).optional(),
  /** Copied from the trip request at match time. Absent on rides booked before payments shipped — treat as cash. */
  paymentMethod: paymentMethodTypeSchema.optional(),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type Trip = z.infer<typeof tripSchema>;

/**
 * Source of truth for the `tripRequests` collection document shape.
 * Extended in Sprint 3 (Part 5) with the full ride-request lifecycle —
 * every new field below is optional/defaulted so Sprint 1's original
 * (smaller) shape still validates unchanged.
 */
export const tripRequestSchema = z.object({
  id: z.string().min(1),
  passengerId: z.string().min(1),
  status: tripRequestStatusSchema,
  pickup: geoLocationSchema,
  dropoff: geoLocationSchema,
  /** Optional intermediate stops, in visiting order (Part 1: "Add optional stops"). */
  stops: z.array(geoLocationSchema).default([]),
  /** How many riders this request is for — drives `vehicleCategoryId` eligibility (a category's `maximumPassengers` must be >= this). Optional so pre-existing trip request docs without it still validate. */
  passengerCount: z.number().int().min(1).optional(),
  vehicleCategoryId: z.string().optional(),
  estimatedDistanceMeters: z.number().min(0).optional(),
  estimatedDurationSeconds: z.number().min(0).optional(),
  fareEstimate: fareBreakdownSchema.optional(),
  /**
   * Cash or PayPal (see docs/payments.md). A PayPal request is created at
   * `confirmed` and only moves to `searching_driver` once the
   * `authorizePaypalOrder` callable has held the fare — `firestore.rules`
   * enforces that pairing. Absent on older requests — treat as cash.
   */
  paymentMethod: paymentMethodTypeSchema.optional(),
  /** Driver ids offered this request, in dispatch order — see `packages/utils/src/trips/dispatch.ts`. */
  offeredDriverIds: z.array(z.string()).default([]),
  assignedDriverId: z.string().optional(),
  driverResponseDeadline: firestoreDateSchema.optional(),
  cancelledAt: firestoreDateSchema.optional(),
  cancellationReason: z.string().optional(),
  requestedAt: firestoreDateSchema,
  /** Optional at `draft`/`estimating` — set once the request enters `searching_driver`. */
  expiresAt: firestoreDateSchema.optional(),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema.optional(),
});

export type TripRequest = z.infer<typeof tripRequestSchema>;

/** Input shape for creating a new ride request (Part 1: booking flow) — server assigns id/status/timestamps. */
export const createTripRequestInputSchema = tripRequestSchema.omit({
  id: true,
  status: true,
  offeredDriverIds: true,
  assignedDriverId: true,
  driverResponseDeadline: true,
  cancelledAt: true,
  cancellationReason: true,
  requestedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTripRequestInput = z.infer<typeof createTripRequestInputSchema>;

/** Source of truth for the `ratings` collection document shape. */
export const ratingSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  raterId: z.string().min(1),
  rateeId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  createdAt: firestoreDateSchema,
});

export type Rating = z.infer<typeof ratingSchema>;

/** Source of truth for the `reviews` collection document shape. */
export const reviewSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  authorId: z.string().min(1),
  targetId: z.string().min(1),
  content: z.string().min(1),
  isModerated: z.boolean().default(false),
  createdAt: firestoreDateSchema,
});

export type Review = z.infer<typeof reviewSchema>;

/**
 * Source of truth for the `rideOffers` collection document shape (Sprint
 * 4, Part 5). One document per driver a trip request is offered to —
 * `score`/`distanceMeters`/`etaSeconds`/`estimatedEarnings` are a snapshot
 * from `@the-ride/utils`'s matching engine at the moment the offer was
 * created, not a live reference (a driver's score can keep changing after
 * the offer that used it).
 */
export const rideOfferSchema = z.object({
  id: z.string().min(1),
  tripRequestId: z.string().min(1),
  driverId: z.string().min(1),
  status: offerStatusSchema,
  searchRadiusKm: z.number().min(0),
  score: z.number(),
  distanceMeters: z.number().min(0),
  etaSeconds: z.number().min(0),
  estimatedEarnings: z.number().min(0),
  createdAt: firestoreDateSchema,
  sentAt: firestoreDateSchema.optional(),
  viewedAt: firestoreDateSchema.optional(),
  respondedAt: firestoreDateSchema.optional(),
  expiresAt: firestoreDateSchema,
  // Nullable as well as optional: some existing documents have this field
  // literally `null` rather than absent (DRIVER-E2E-07's decline crash
  // investigation) — both mean "no reason given."
  declineReason: z.string().nullable().optional(),
  updatedAt: firestoreDateSchema,
});

export type RideOffer = z.infer<typeof rideOfferSchema>;

export const createRideOfferInputSchema = rideOfferSchema.omit({
  id: true,
  status: true,
  sentAt: true,
  viewedAt: true,
  respondedAt: true,
  declineReason: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateRideOfferInput = z.infer<typeof createRideOfferInputSchema>;

/**
 * The redacted, public-safe view of an active `RideShare`'s ride —
 * everything the public tracking page is allowed to render, nothing else
 * (CLAYBA P1, Part C — Share My Ride). Deliberately excludes the
 * passenger's identity entirely and only ever carries the driver's first
 * name (never their full profile) and a partially-masked plate — see
 * `docs/ride-sharing.md` and section 30/31 of the brief this shipped
 * under. Kept in sync onto the `rideShares/{tokenHash}` doc itself by
 * `onTripUpdatedForShares` (functions/src/trips/index.ts) so the public
 * page can subscribe with a plain `onSnapshot`, never touching the real
 * `trips` collection its `firestore.rules` keep private.
 */
export const rideSharePublicViewSchema = z.object({
  status: tripStatusSchema,
  pickupLabel: z.string().optional(),
  dropoffLabel: z.string().optional(),
  driverFirstName: z.string().optional(),
  vehicleMakeModel: z.string().optional(),
  /** Last 4 characters only, e.g. "····9F2A" — never the full plate. */
  platePartial: z.string().optional(),
  driverLocation: liveDriverLocationSchema.optional(),
  driverLocationUpdatedAt: firestoreDateSchema.optional(),
  /** 0-1, how far along the pickup→destination leg the driver is (only meaningful once `in_progress`). */
  progressFraction: z.number().min(0).max(1).optional(),
  etaSeconds: z.number().min(0).optional(),
  updatedAt: firestoreDateSchema,
});

export type RideSharePublicView = z.infer<typeof rideSharePublicViewSchema>;

export const rideShareStatusSchema = z.enum(["active", "revoked", "expired"]);
export type RideShareStatus = z.infer<typeof rideShareStatusSchema>;

/**
 * Source of truth for the `rideShares` collection document shape (CLAYBA
 * P1, Part C). Document id === SHA-256 hex of the random share token —
 * the raw token is never stored (see `firestore.rules`'s public `get`
 * rule, which relies on the id itself being unguessable). One passenger
 * may hold multiple shares over a ride's lifetime (share, stop, share
 * again), each an independent document/token.
 */
export const rideShareSchema = z.object({
  id: z.string().min(1),
  rideId: z.string().min(1),
  createdBy: z.string().min(1),
  status: rideShareStatusSchema,
  createdAt: firestoreDateSchema,
  expiresAt: firestoreDateSchema,
  revokedAt: firestoreDateSchema.optional(),
  publicView: rideSharePublicViewSchema,
});

export type RideShare = z.infer<typeof rideShareSchema>;

export const createRideShareInputSchema = rideShareSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  revokedAt: true,
});

export type CreateRideShareInput = z.infer<typeof createRideShareInputSchema>;

/**
 * Source of truth for the `dispatchQueue` collection document shape
 * (Sprint 4, Parts 6-7). Document id === tripRequestId — one active
 * search/expansion cycle per trip request. Represents the state a
 * scheduled process would read to decide "expand the radius" vs. "time
 * out" vs. "assigned, stop searching."
 */
export const dispatchQueueSchema = z.object({
  id: z.string().min(1),
  tripRequestId: z.string().min(1),
  status: dispatchQueueStatusSchema,
  currentRadiusKm: z.number().min(0),
  expansionAttempt: z.number().int().min(0).default(0),
  offeredDriverIds: z.array(z.string()).default([]),
  currentOfferId: z.string().optional(),
  nextExpansionAt: firestoreDateSchema.optional(),
  searchStartedAt: firestoreDateSchema,
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type DispatchQueue = z.infer<typeof dispatchQueueSchema>;

/**
 * Source of truth for the `dispatchEvents` collection document shape
 * (Sprint 4, Part 12). A lighter-weight, high-frequency operational log
 * distinct from `@the-ride/types`'s `authentication` domain `AuditLog`
 * (which is the compliance-grade trail for admin-triggered actions) — see
 * docs/dispatch-center.md for why these are kept separate.
 */
export const dispatchEventSchema = z.object({
  id: z.string().min(1),
  tripRequestId: z.string().min(1),
  driverId: z.string().optional(),
  offerId: z.string().optional(),
  type: dispatchEventTypeSchema,
  metadata: z.record(z.unknown()).optional(),
  createdAt: firestoreDateSchema,
});

export type DispatchEvent = z.infer<typeof dispatchEventSchema>;

export const createDispatchEventInputSchema = dispatchEventSchema.omit({
  id: true,
  createdAt: true,
});
export type CreateDispatchEventInput = z.infer<typeof createDispatchEventInputSchema>;

/** One candidate's evaluated score within a `MatchingLog` — see `packages/utils/src/trips/matching.ts`. */
export const matchingLogCandidateSchema = z.object({
  driverId: z.string().min(1),
  score: z.number(),
  breakdown: z.record(z.number()),
  distanceMeters: z.number().min(0),
  etaSeconds: z.number().min(0),
});

export type MatchingLogCandidate = z.infer<typeof matchingLogCandidateSchema>;

/**
 * Source of truth for the `matchingLogs` collection document shape
 * (Sprint 4, Part 11) — a debugging/tuning trail for the scoring engine:
 * what it evaluated and why it ranked candidates the way it did.
 */
export const matchingLogSchema = z.object({
  id: z.string().min(1),
  tripRequestId: z.string().min(1),
  radiusKm: z.number().min(0),
  candidatesEvaluated: z.number().int().min(0),
  candidatesEligible: z.number().int().min(0),
  topCandidates: z.array(matchingLogCandidateSchema).default([]),
  ranAt: firestoreDateSchema,
});

export type MatchingLog = z.infer<typeof matchingLogSchema>;
