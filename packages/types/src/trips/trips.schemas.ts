import { z } from "zod";

import { firestoreDateSchema } from "../common/firestore-date.schema";
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
   */
  driverLocation: geoLocationSchema.optional(),
  driverLocationUpdatedAt: firestoreDateSchema.optional(),
  fareAmount: z.number().min(0).optional(),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type Trip = z.infer<typeof tripSchema>;

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
