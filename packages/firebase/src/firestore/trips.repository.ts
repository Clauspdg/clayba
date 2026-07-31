import {
  DEFAULT_TRIP_REQUEST_EXPIRY_SECONDS,
  DISPATCH_EVENTS_COLLECTION,
  DISPATCH_QUEUE_COLLECTION,
  DispatchQueueStatus,
  MATCHING_LOGS_COLLECTION,
  OfferStatus,
  RATINGS_COLLECTION,
  REVIEWS_COLLECTION,
  RIDE_OFFERS_COLLECTION,
  TRIP_REQUESTS_COLLECTION,
  TRIPS_COLLECTION,
  TripRequestStatus,
  dispatchEventSchema,
  dispatchQueueSchema,
  matchingLogSchema,
  ratingSchema,
  reviewSchema,
  rideOfferSchema,
  tripRequestSchema,
  tripSchema,
  type CreateDispatchEventInput,
  type CreateRideOfferInput,
  type CreateTripRequestInput,
  type DispatchEvent,
  type DispatchQueue,
  type FareBreakdown,
  type MatchingLog,
  type Rating,
  type Review,
  type RideOffer,
  type Trip,
  type TripRequest,
} from "@the-ride/types";
import { assertOfferTransition, assertTripRequestTransition } from "@the-ride/utils";
import { FieldValue, type Firestore, type UpdateData } from "firebase-admin/firestore";

import { FirestoreRepository } from "./base.repository";
import { createFirestoreConverter } from "./converter";

export class TripsRepository extends FirestoreRepository<Trip> {
  constructor(db: Firestore) {
    super(db, TRIPS_COLLECTION, createFirestoreConverter(tripSchema));
  }

  async listForPassenger(passengerId: string): Promise<Trip[]> {
    return this.findWhere("passengerId", "==", passengerId);
  }

  async listForDriver(driverId: string): Promise<Trip[]> {
    return this.findWhere("driverId", "==", driverId);
  }
}

/**
 * Ride request lifecycle (Sprint 3, Part 1 + Part 5). Every method
 * validates the transition via `@the-ride/utils`'s `assertTripRequestTransition`
 * before writing — see docs/ride-request.md for the full diagram.
 */
export class TripRequestsRepository extends FirestoreRepository<TripRequest> {
  constructor(db: Firestore) {
    super(db, TRIP_REQUESTS_COLLECTION, createFirestoreConverter(tripRequestSchema));
  }

  /** Starts a new request at `draft` — pickup/destination/stops chosen, nothing estimated yet. */
  async createDraft(input: CreateTripRequestInput): Promise<TripRequest> {
    const id = this.newId();
    const now = new Date();
    const request = tripRequestSchema.parse({
      ...input,
      id,
      status: TripRequestStatus.DRAFT,
      offeredDriverIds: [],
      requestedAt: now,
      createdAt: now,
    });
    return this.create(id, request);
  }

  private async requireRequest(id: string): Promise<TripRequest> {
    const request = await this.findById(id);
    if (!request) throw new Error(`Trip request "${id}" not found.`);
    return request;
  }

  private async transition(id: string, to: TripRequestStatus, extra: Partial<TripRequest> = {}): Promise<TripRequest> {
    const request = await this.requireRequest(id);
    assertTripRequestTransition(request.status, to);

    const updatedAt = new Date();
    await this.update(id, { ...extra, status: to, updatedAt } as UpdateData<TripRequest>);
    return { ...request, ...extra, status: to, updatedAt };
  }

  /** Vehicle category chosen and fare/distance/duration computed — `draft` -> `estimating`. */
  async setEstimate(
    id: string,
    params: { vehicleCategoryId: string; estimatedDistanceMeters: number; estimatedDurationSeconds: number; fareEstimate: FareBreakdown },
  ): Promise<TripRequest> {
    return this.transition(id, TripRequestStatus.ESTIMATING, params);
  }

  /** Passenger confirms the estimate — `estimating` -> `confirmed`. */
  async confirm(id: string, expiryInSeconds: number = DEFAULT_TRIP_REQUEST_EXPIRY_SECONDS): Promise<TripRequest> {
    const expiresAt = new Date(Date.now() + expiryInSeconds * 1000);
    return this.transition(id, TripRequestStatus.CONFIRMED, { expiresAt });
  }

  /** Dispatch begins searching for a driver — `confirmed` (or `driver_rejected`, to re-offer) -> `searching_driver`. */
  async startSearching(id: string, offeredDriverIds: string[]): Promise<TripRequest> {
    return this.transition(id, TripRequestStatus.SEARCHING_DRIVER, { offeredDriverIds });
  }

  /** A driver has been offered the ride and must respond by `responseDeadline` — `searching_driver` -> `driver_assigned`. */
  async assignDriver(id: string, driverId: string, responseDeadline: Date): Promise<TripRequest> {
    return this.transition(id, TripRequestStatus.DRIVER_ASSIGNED, { assignedDriverId: driverId, driverResponseDeadline: responseDeadline });
  }

  /** `driver_assigned` -> `driver_accepted`. Trip execution itself is out of scope this sprint. */
  async driverAccept(id: string): Promise<TripRequest> {
    return this.transition(id, TripRequestStatus.DRIVER_ACCEPTED);
  }

  /** `driver_assigned` -> `driver_rejected`. The caller (dispatch service) decides whether to re-offer or expire. */
  async driverReject(id: string): Promise<TripRequest> {
    const request = await this.requireRequest(id);
    assertTripRequestTransition(request.status, TripRequestStatus.DRIVER_REJECTED);

    // FieldValue.delete() (not `undefined`, which Firestore's Admin SDK rejects) clears the prior assignment.
    await this.update(id, {
      status: TripRequestStatus.DRIVER_REJECTED,
      assignedDriverId: FieldValue.delete(),
      driverResponseDeadline: FieldValue.delete(),
      updatedAt: new Date(),
    } as UpdateData<TripRequest>);

    return this.requireRequest(id);
  }

  /** Passenger cancels — legal from any non-terminal status (Part 1: "Cancel booking before assignment" is the common case, but not the only one). */
  async cancel(id: string, reason?: string): Promise<TripRequest> {
    return this.transition(id, TripRequestStatus.CANCELLED, { cancelledAt: new Date(), cancellationReason: reason });
  }

  /** No driver accepted in time — `searching_driver`/`driver_rejected` -> `expired`. */
  async expire(id: string): Promise<TripRequest> {
    return this.transition(id, TripRequestStatus.EXPIRED);
  }
}

export class RatingsRepository extends FirestoreRepository<Rating> {
  constructor(db: Firestore) {
    super(db, RATINGS_COLLECTION, createFirestoreConverter(ratingSchema));
  }

  async listForRatee(rateeId: string): Promise<Rating[]> {
    return this.findWhere("rateeId", "==", rateeId);
  }
}

export class ReviewsRepository extends FirestoreRepository<Review> {
  constructor(db: Firestore) {
    super(db, REVIEWS_COLLECTION, createFirestoreConverter(reviewSchema));
  }
}

/**
 * Ride offer lifecycle (Sprint 4, Part 5). One document per driver a trip
 * request is offered to — every method validates the transition via
 * `@the-ride/utils`'s `assertOfferTransition` before writing. See
 * docs/ride-offers.md for the full diagram.
 */
export class RideOffersRepository extends FirestoreRepository<RideOffer> {
  constructor(db: Firestore) {
    super(db, RIDE_OFFERS_COLLECTION, createFirestoreConverter(rideOfferSchema));
  }

  async createOffer(input: CreateRideOfferInput): Promise<RideOffer> {
    const id = this.newId();
    const now = new Date();
    const offer = rideOfferSchema.parse({ ...input, id, status: OfferStatus.CREATED, createdAt: now, updatedAt: now });
    return this.create(id, offer);
  }

  private async requireOffer(id: string): Promise<RideOffer> {
    const offer = await this.findById(id);
    if (!offer) throw new Error(`Ride offer "${id}" not found.`);
    return offer;
  }

  private async transition(id: string, to: OfferStatus, extra: Partial<RideOffer> = {}): Promise<RideOffer> {
    const offer = await this.requireOffer(id);
    assertOfferTransition(offer.status, to);

    const updatedAt = new Date();
    await this.update(id, { ...extra, status: to, updatedAt } as UpdateData<RideOffer>);
    return { ...offer, ...extra, status: to, updatedAt };
  }

  async markSent(id: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.SENT, { sentAt: new Date() });
  }

  async markViewed(id: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.VIEWED, { viewedAt: new Date() });
  }

  async accept(id: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.ACCEPTED, { respondedAt: new Date() });
  }

  async decline(id: string, reason?: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.DECLINED, { respondedAt: new Date(), declineReason: reason });
  }

  async expire(id: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.EXPIRED);
  }

  async cancel(id: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.CANCELLED);
  }

  async reassign(id: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.REASSIGNED);
  }

  async complete(id: string): Promise<RideOffer> {
    return this.transition(id, OfferStatus.COMPLETED);
  }

  /** Offer history for a trip request (admin Dispatch Center's "Offer History" page) — most recent first. Requires a composite index. */
  async listForTripRequest(tripRequestId: string): Promise<RideOffer[]> {
    return this.findWhereOrdered("tripRequestId", "==", tripRequestId, "createdAt", "desc");
  }

  async listForDriver(driverId: string): Promise<RideOffer[]> {
    return this.findWhereOrdered("driverId", "==", driverId, "createdAt", "desc");
  }
}

/**
 * The active search/expansion cycle for one trip request (Sprint 4, Parts
 * 6-7). Document id === tripRequestId. See docs/search-expansion.md.
 */
export class DispatchQueueRepository extends FirestoreRepository<DispatchQueue> {
  constructor(db: Firestore) {
    super(db, DISPATCH_QUEUE_COLLECTION, createFirestoreConverter(dispatchQueueSchema));
  }

  async start(tripRequestId: string, initialRadiusKm: number): Promise<DispatchQueue> {
    const now = new Date();
    const queue = dispatchQueueSchema.parse({
      id: tripRequestId,
      tripRequestId,
      status: DispatchQueueStatus.SEARCHING,
      currentRadiusKm: initialRadiusKm,
      expansionAttempt: 0,
      offeredDriverIds: [],
      searchStartedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return this.create(tripRequestId, queue);
  }

  private async requireQueue(tripRequestId: string): Promise<DispatchQueue> {
    const queue = await this.findById(tripRequestId);
    if (!queue) throw new Error(`Dispatch queue "${tripRequestId}" not found.`);
    return queue;
  }

  async expand(tripRequestId: string, radiusKm: number, attempt: number): Promise<DispatchQueue> {
    await this.update(tripRequestId, { currentRadiusKm: radiusKm, expansionAttempt: attempt, updatedAt: new Date() } as UpdateData<DispatchQueue>);
    return this.requireQueue(tripRequestId);
  }

  async recordOffer(tripRequestId: string, offerId: string, driverId: string): Promise<DispatchQueue> {
    const queue = await this.requireQueue(tripRequestId);
    await this.update(tripRequestId, {
      currentOfferId: offerId,
      offeredDriverIds: [...queue.offeredDriverIds, driverId],
      updatedAt: new Date(),
    } as UpdateData<DispatchQueue>);
    return this.requireQueue(tripRequestId);
  }

  async markAssigned(tripRequestId: string): Promise<DispatchQueue> {
    await this.update(tripRequestId, { status: DispatchQueueStatus.ASSIGNED, updatedAt: new Date() } as UpdateData<DispatchQueue>);
    return this.requireQueue(tripRequestId);
  }

  async markExhausted(tripRequestId: string): Promise<DispatchQueue> {
    await this.update(tripRequestId, { status: DispatchQueueStatus.EXHAUSTED, updatedAt: new Date() } as UpdateData<DispatchQueue>);
    return this.requireQueue(tripRequestId);
  }

  async cancel(tripRequestId: string): Promise<DispatchQueue> {
    await this.update(tripRequestId, { status: DispatchQueueStatus.CANCELLED, updatedAt: new Date() } as UpdateData<DispatchQueue>);
    return this.requireQueue(tripRequestId);
  }
}

/**
 * High-frequency dispatch audit trail (Sprint 4, Part 12) — deliberately
 * separate from `AuditLogsRepository` (Sprint 1's compliance-grade trail
 * for admin-triggered actions). See docs/dispatch-center.md.
 */
export class DispatchEventsRepository extends FirestoreRepository<DispatchEvent> {
  constructor(db: Firestore) {
    super(db, DISPATCH_EVENTS_COLLECTION, createFirestoreConverter(dispatchEventSchema));
  }

  async record(input: CreateDispatchEventInput): Promise<DispatchEvent> {
    const id = this.newId();
    const event = dispatchEventSchema.parse({ ...input, id, createdAt: new Date() });
    return this.create(id, event);
  }

  async listForTripRequest(tripRequestId: string): Promise<DispatchEvent[]> {
    return this.findWhereOrdered("tripRequestId", "==", tripRequestId, "createdAt", "asc");
  }
}

/** Matching engine debug/tuning trail (Sprint 4, Part 11) — see docs/matching-engine.md. */
export class MatchingLogsRepository extends FirestoreRepository<MatchingLog> {
  constructor(db: Firestore) {
    super(db, MATCHING_LOGS_COLLECTION, createFirestoreConverter(matchingLogSchema));
  }

  async record(input: Omit<MatchingLog, "id">): Promise<MatchingLog> {
    const id = this.newId();
    const log = matchingLogSchema.parse({ ...input, id });
    return this.create(id, log);
  }

  async listForTripRequest(tripRequestId: string): Promise<MatchingLog[]> {
    return this.findWhereOrdered("tripRequestId", "==", tripRequestId, "ranAt", "desc");
  }
}
