import type { GeoLocation } from "@the-ride/types";

import { estimateEtaSeconds, haversineDistanceMeters } from "./distance";

/**
 * Everything the dispatch algorithm needs to know about one candidate
 * driver. Deliberately a flat, plain interface (not `Driver`/`Vehicle`
 * directly) so this stays pure and testable without touching Firestore —
 * `@the-ride/firebase`'s `DispatchService` is responsible for assembling
 * this from `DriversRepository`/`VehiclesRepository`/`DriverWarningsRepository`
 * before calling into here. See docs/dispatch-engine.md.
 */
export interface DispatchCandidate {
  driverId: string;
  isOnline: boolean;
  isAvailable: boolean;
  /** Driver account status is Active. */
  isVerified: boolean;
  isSuspended: boolean;
  /** No expired/missing required documents — see `@the-ride/utils`'s `getExpiringDocuments`. */
  hasValidDocuments: boolean;
  isVehicleApproved: boolean;
  location: GeoLocation;
  score: number;
}

export interface DispatchCriteria {
  pickup: GeoLocation;
  searchRadiusMeters: number;
}

export interface RankedDispatchCandidate extends DispatchCandidate {
  distanceMeters: number;
  etaSeconds: number;
}

/** All seven eligibility checks from Part 6, each independently testable. */
export function isDriverEligible(candidate: DispatchCandidate, criteria: DispatchCriteria): boolean {
  if (!candidate.isOnline) return false;
  if (!candidate.isAvailable) return false;
  if (!candidate.isVerified) return false;
  if (candidate.isSuspended) return false;
  if (!candidate.hasValidDocuments) return false;
  if (!candidate.isVehicleApproved) return false;
  return haversineDistanceMeters(candidate.location, criteria.pickup) <= criteria.searchRadiusMeters;
}

/**
 * Filters to eligible drivers, then ranks them highest-score-first,
 * breaking ties by closest (estimated) ETA — the two ranking rules from
 * Part 6. ETA here is the haversine-distance placeholder from
 * `@the-ride/utils`'s `estimateEtaSeconds`, not a live routing call (see
 * `distance.ts` for why) — "Dispatch Engine V1" per this sprint's title.
 */
export function rankEligibleDrivers(candidates: DispatchCandidate[], criteria: DispatchCriteria): RankedDispatchCandidate[] {
  return candidates
    .filter((candidate) => isDriverEligible(candidate, criteria))
    .map((candidate) => {
      const distanceMeters = haversineDistanceMeters(candidate.location, criteria.pickup);
      return { ...candidate, distanceMeters, etaSeconds: estimateEtaSeconds(distanceMeters) };
    })
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.etaSeconds - b.etaSeconds));
}

/** Top N ranked candidates to offer the ride to, in offer order — see `TripRequest.offeredDriverIds`. */
export function selectDriverOffers(candidates: DispatchCandidate[], criteria: DispatchCriteria, maxOffers: number): RankedDispatchCandidate[] {
  return rankEligibleDrivers(candidates, criteria).slice(0, maxOffers);
}
