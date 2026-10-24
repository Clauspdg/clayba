import {
  DEFAULT_PLATFORM_SETTINGS,
  DriverAccountStatus,
  DriverAvailabilityStatus,
  VehicleStatus,
  type Driver,
  type RideOffer,
  type TripRequest,
} from "@the-ride/types";
import {
  driverEarningsFromFare,
  getDocumentExpirationStatus,
  getRadiusForAttempt,
  hasMoreExpansionTiers,
  rankMatchingCandidates,
  type MatchingCandidate,
  type MatchingCriteria,
} from "@the-ride/utils";
import { FieldValue, type UpdateData } from "firebase-admin/firestore";

import type { DriverPresenceRepository, DriversRepository } from "./drivers.repository";
import type { VehiclesRepository } from "./fleet-management.repository";
import type { SettingsRepository } from "./settings.repository";
import type {
  DispatchEventsRepository,
  DispatchQueueRepository,
  MatchingLogsRepository,
  RideOffersRepository,
  TripRequestsRepository,
  TripsRepository,
} from "./trips.repository";

export class NoDriversAvailableError extends Error {
  constructor(tripRequestId: string) {
    super(`No eligible drivers available for trip request "${tripRequestId}".`);
    this.name = "NoDriversAvailableError";
  }
}

export interface DispatchServiceDeps {
  drivers: DriversRepository;
  vehicles: VehiclesRepository;
  tripRequests: TripRequestsRepository;
  trips: TripsRepository;
  settings: SettingsRepository;
  presence: DriverPresenceRepository;
  offers: RideOffersRepository;
  dispatchQueue: DispatchQueueRepository;
  dispatchEvents: DispatchEventsRepository;
  matchingLogs: MatchingLogsRepository;
}

/**
 * Driver Matching Engine (Sprint 4). Orchestrates the pure algorithm in
 * `@the-ride/utils/trips/matching` against Firestore: builds candidates,
 * ranks them, creates a `RideOffer` for the winner, and drives search
 * radius expansion (Part 7) when nobody's eligible yet. No sockets/live
 * tracking — this runs once per dispatch attempt. See
 * docs/matching-engine.md and docs/dispatch-center.md.
 */
export class DispatchService {
  constructor(private readonly deps: DispatchServiceDeps) {}

  private async buildMatchingCandidates(
    excludeDriverIds: string[] = [],
  ): Promise<MatchingCandidate[]> {
    // Same V1 note as Sprint 3: filter on `status` server-side, the rest in memory.
    const activeDrivers = await this.deps.drivers.findWhere(
      "status",
      "==",
      DriverAccountStatus.ACTIVE,
    );
    const eligible = activeDrivers.filter(
      (driver) =>
        !excludeDriverIds.includes(driver.id) &&
        driver.availabilityStatus === DriverAvailabilityStatus.AVAILABLE &&
        driver.lastKnownLocation,
    );

    const candidates: MatchingCandidate[] = [];
    for (const driver of eligible) {
      const vehicle = driver.vehicleId ? await this.deps.vehicles.findById(driver.vehicleId) : null;
      const presence = await this.deps.presence.findById(driver.id);
      const hasValidDocuments = driver.documents.every(
        (document) => getDocumentExpirationStatus(document.expiresAt) !== "expired",
      );

      candidates.push({
        driverId: driver.id,
        isVerified: driver.status === DriverAccountStatus.ACTIVE,
        isSuspended: driver.status === DriverAccountStatus.SUSPENDED,
        isVehicleApproved: vehicle?.status === VehicleStatus.APPROVED,
        hasValidDocuments,
        availabilityStatus: driver.availabilityStatus,
        // Non-null: filtered on `driver.lastKnownLocation` truthiness above.
        location: driver.lastKnownLocation!,
        score: driver.score,
        acceptanceRate: driver.acceptanceRate,
        cancellationRate: driver.cancellationRate,
        activeJobsCount: driver.activeJobsCount,
        rating: driver.rating,
        completedTrips: driver.completedTrips,
        lastHeartbeatAt: presence?.lastHeartbeatAt,
        vehicleCategoryId: vehicle?.vehicleCategoryId,
      });
    }
    return candidates;
  }

  private estimateDriverEarnings(request: TripRequest): number {
    if (!request.fareEstimate) return 0;
    return driverEarningsFromFare(request.fareEstimate);
  }

  /**
   * One matching attempt at a specific radius: ranks candidates, logs the
   * evaluation (`MatchingLog`), and — if someone's eligible — creates and
   * sends a `RideOffer`, assigning the trip request to that driver.
   * Throws `NoDriversAvailableError` if nobody is eligible at this radius.
   */
  async runMatchingAttempt(
    tripRequestId: string,
    radiusKm: number,
  ): Promise<{ offer: RideOffer; request: TripRequest }> {
    const request = await this.deps.tripRequests.findById(tripRequestId);
    if (!request) throw new Error(`Trip request "${tripRequestId}" not found.`);

    const settings = await this.deps.settings.getGlobal();
    const weights = settings?.matchingWeights ?? DEFAULT_PLATFORM_SETTINGS.matchingWeights;
    const criteria: MatchingCriteria = {
      pickup: request.pickup,
      searchRadiusMeters: radiusKm * 1000,
      minDriverScore: settings?.minDriverScore ?? DEFAULT_PLATFORM_SETTINGS.minDriverScore,
      minAcceptanceRate: settings?.minAcceptanceRate ?? DEFAULT_PLATFORM_SETTINGS.minAcceptanceRate,
      maxCancellationRate:
        settings?.maxCancellationRate ?? DEFAULT_PLATFORM_SETTINGS.maxCancellationRate,
      maxActiveJobsPerDriver:
        settings?.maxActiveJobsPerDriver ?? DEFAULT_PLATFORM_SETTINGS.maxActiveJobsPerDriver,
      requestedVehicleCategoryId: request.vehicleCategoryId,
    };

    const queue = await this.deps.dispatchQueue.findById(tripRequestId);
    const candidates = await this.buildMatchingCandidates(queue?.offeredDriverIds ?? []);
    const ranked = rankMatchingCandidates(candidates, criteria, weights);

    await this.deps.matchingLogs.record({
      tripRequestId,
      radiusKm,
      candidatesEvaluated: candidates.length,
      candidatesEligible: ranked.length,
      // `MatchingScoreBreakdown` has fixed keys, all `number` values — a safe match for the log's `Record<string, number>` shape.
      topCandidates: ranked.slice(0, 5).map((c) => ({
        driverId: c.driverId,
        score: c.total,
        breakdown: c.breakdown as unknown as Record<string, number>,
        distanceMeters: c.distanceMeters,
        etaSeconds: c.etaSeconds,
      })),
      ranAt: new Date(),
    });

    const [topCandidate] = ranked;
    if (!topCandidate) {
      await this.deps.dispatchEvents.record({
        tripRequestId,
        type: "no_drivers_found",
        metadata: { radiusKm },
      });
      throw new NoDriversAvailableError(tripRequestId);
    }

    const offerTimeoutSeconds =
      settings?.assignmentTimeoutSeconds ?? DEFAULT_PLATFORM_SETTINGS.assignmentTimeoutSeconds;
    const expiresAt = new Date(Date.now() + offerTimeoutSeconds * 1000);

    const created = await this.deps.offers.createOffer({
      tripRequestId,
      driverId: topCandidate.driverId,
      searchRadiusKm: radiusKm,
      score: topCandidate.total,
      distanceMeters: topCandidate.distanceMeters,
      etaSeconds: topCandidate.etaSeconds,
      estimatedEarnings: this.estimateDriverEarnings(request),
      expiresAt,
    });
    const offer = await this.deps.offers.markSent(created.id);

    await this.deps.dispatchEvents.record({
      tripRequestId,
      driverId: topCandidate.driverId,
      offerId: offer.id,
      type: "offer_sent",
      metadata: { radiusKm, score: topCandidate.total },
    });
    await this.deps.dispatchQueue.recordOffer(tripRequestId, offer.id, topCandidate.driverId);

    const updatedRequest = await this.deps.tripRequests.assignDriver(
      tripRequestId,
      topCandidate.driverId,
      expiresAt,
    );
    await this.deps.drivers.setAvailabilityStatus({
      driverId: topCandidate.driverId,
      status: DriverAvailabilityStatus.BUSY,
      currentRideId: tripRequestId,
    });

    return { offer, request: updatedRequest };
  }

  /**
   * Full dispatch cycle (Parts 6-7): starts (or continues) the
   * search-radius expansion queue for a trip request, running one
   * matching attempt per configured radius tier (2/5/10/15 km) until a
   * driver is assigned or every tier is exhausted.
   */
  async dispatch(tripRequestId: string): Promise<TripRequest> {
    let queue = await this.deps.dispatchQueue.findById(tripRequestId);
    if (!queue) {
      const firstRadius = getRadiusForAttempt(0) ?? DEFAULT_PLATFORM_SETTINGS.searchRadiusKm;
      queue = await this.deps.dispatchQueue.start(tripRequestId, firstRadius);
    }

    for (let attempt = queue.expansionAttempt; ; attempt++) {
      const radiusKm = getRadiusForAttempt(attempt);
      if (radiusKm === undefined) {
        await this.deps.dispatchQueue.markExhausted(tripRequestId);
        await this.deps.dispatchEvents.record({
          tripRequestId,
          type: "no_drivers_found",
          metadata: { exhausted: true },
        });
        throw new NoDriversAvailableError(tripRequestId);
      }

      if (attempt > queue.expansionAttempt) {
        await this.deps.dispatchQueue.expand(tripRequestId, radiusKm, attempt);
        await this.deps.dispatchEvents.record({
          tripRequestId,
          type: "radius_expanded",
          metadata: { radiusKm, attempt },
        });
      }

      try {
        const { request } = await this.runMatchingAttempt(tripRequestId, radiusKm);
        await this.deps.dispatchQueue.markAssigned(tripRequestId);
        return request;
      } catch (error) {
        if (!(error instanceof NoDriversAvailableError) || !hasMoreExpansionTiers(attempt)) {
          throw error;
        }
      }
    }
  }

  /**
   * Driver taps Accept (Part 5/8, DRIVER-E2E-07) — accepts the offer, puts
   * the driver on-trip, moves the trip request forward, and creates the
   * `trips/{id}` document that bridges into the execution phase (see
   * `TripsRepository.createFromAcceptedOffer`'s doc comment — the driver
   * Space's "current ride" read path already expected this document to
   * exist; only the write side was missing).
   */
  async handleOfferAccepted(offerId: string): Promise<TripRequest> {
    const offer = await this.deps.offers.accept(offerId);
    await this.deps.dispatchEvents.record({
      tripRequestId: offer.tripRequestId,
      driverId: offer.driverId,
      offerId,
      type: "offer_accepted",
    });
    const driver = await this.deps.drivers.setAvailabilityStatus({
      driverId: offer.driverId,
      status: DriverAvailabilityStatus.ON_TRIP,
      currentRideId: offer.tripRequestId,
    });
    await this.deps.drivers.update(offer.driverId, {
      activeJobsCount: FieldValue.increment(1),
    } as UpdateData<Driver>);
    const request = await this.deps.tripRequests.driverAccept(offer.tripRequestId);
    await this.deps.trips.createFromAcceptedOffer(request, offer.driverId, driver.vehicleId);
    return request;
  }

  /** Driver taps Decline (Part 5/8), or the offer timer expires (Part 6) — frees the driver and automatically re-dispatches (Part 5: "Offer Reassigned"). */
  private async handleOfferNotAccepted(
    offerId: string,
    outcome: "declined" | "expired",
    reason?: string,
  ): Promise<TripRequest> {
    const offer =
      outcome === "declined"
        ? await this.deps.offers.decline(offerId, reason)
        : await this.deps.offers.expire(offerId);

    await this.deps.dispatchEvents.record({
      tripRequestId: offer.tripRequestId,
      driverId: offer.driverId,
      offerId,
      type: outcome === "declined" ? "offer_declined" : "offer_expired",
      // Omit the key entirely rather than `metadata: undefined` — the
      // Admin SDK rejects a literal `undefined` field value outright
      // (unlike `null`), so this crashed the whole decline/expire path
      // every time a driver declined without a reason (the common case).
      ...(reason ? { metadata: { reason } } : {}),
    });
    await this.deps.drivers.setAvailabilityStatus({
      driverId: offer.driverId,
      status: DriverAvailabilityStatus.AVAILABLE,
    });
    await this.deps.tripRequests.driverReject(offer.tripRequestId);
    await this.deps.offers.reassign(offer.id);
    await this.deps.dispatchEvents.record({
      tripRequestId: offer.tripRequestId,
      driverId: offer.driverId,
      offerId,
      type: "driver_reassigned",
    });

    return this.dispatch(offer.tripRequestId);
  }

  async handleOfferDeclined(offerId: string, reason?: string): Promise<TripRequest> {
    return this.handleOfferNotAccepted(offerId, "declined", reason);
  }

  async handleOfferExpired(offerId: string): Promise<TripRequest> {
    return this.handleOfferNotAccepted(offerId, "expired");
  }
}
