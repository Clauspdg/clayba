import { DriverAvailabilityStatus, SEARCH_RADIUS_EXPANSION_KM, type GeoLocation, type MatchingWeights } from "@the-ride/types";
import { getDriverLevelScore, getDriverLevel } from "../drivers/driver-level";

import { estimateEtaSeconds, haversineDistanceMeters } from "./distance";

/**
 * Everything the matching engine needs to know about one candidate
 * driver. Deliberately flat and Firestore-independent (same rationale as
 * Sprint 3's `DispatchCandidate` in `dispatch.ts`) — `@the-ride/firebase`'s
 * `MatchingEngine`/`DispatchService` assembles this from
 * `DriversRepository`/`VehiclesRepository`/`DriverPresenceRepository`
 * before calling into here. See docs/matching-engine.md.
 */
export interface MatchingCandidate {
  driverId: string;
  isVerified: boolean;
  isSuspended: boolean;
  isVehicleApproved: boolean;
  hasValidDocuments: boolean;
  availabilityStatus: DriverAvailabilityStatus;
  location: GeoLocation;
  score: number;
  acceptanceRate: number;
  cancellationRate: number;
  activeJobsCount: number;
  rating: number;
  completedTrips: number;
  lastHeartbeatAt?: Date;
  vehicleCategoryId?: string;
}

export interface MatchingCriteria {
  pickup: GeoLocation;
  searchRadiusMeters: number;
  minDriverScore: number;
  minAcceptanceRate: number;
  maxCancellationRate: number;
  maxActiveJobsPerDriver: number;
  requestedVehicleCategoryId?: string;
  now?: Date;
}

/** All eleven eligibility checks from Part 3, each independently testable. */
export function isMatchingCandidateEligible(candidate: MatchingCandidate, criteria: MatchingCriteria): boolean {
  if (!candidate.isVerified) return false;
  if (candidate.isSuspended) return false;
  if (!candidate.isVehicleApproved) return false;
  if (!candidate.hasValidDocuments) return false;
  if (candidate.availabilityStatus !== DriverAvailabilityStatus.AVAILABLE) return false;
  if (candidate.score < criteria.minDriverScore) return false;
  if (candidate.acceptanceRate < criteria.minAcceptanceRate) return false;
  if (candidate.cancellationRate > criteria.maxCancellationRate) return false;
  if (candidate.activeJobsCount >= criteria.maxActiveJobsPerDriver) return false;
  return haversineDistanceMeters(candidate.location, criteria.pickup) <= criteria.searchRadiusMeters;
}

export interface MatchingScoreBreakdown {
  distance: number;
  eta: number;
  rating: number;
  acceptanceRate: number;
  completionRate: number;
  recentActivity: number;
  driverLevel: number;
  vehicleCategoryMatch: number;
  serviceZone: number;
}

export interface MatchingScoreResult {
  total: number;
  breakdown: MatchingScoreBreakdown;
  distanceMeters: number;
  etaSeconds: number;
}

const RECENT_ACTIVITY_STALE_AFTER_SECONDS = 5 * 60;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Weighted composite matching score (Sprint 4, Part 4). Every component
 * is normalized to 0-1 before its weight is applied, and the total is
 * divided by the sum of weights actually used — so a platform operator
 * tuning `PlatformSettings.matchingWeights` doesn't have to keep them
 * summing to exactly 1 for scores to stay comparable.
 */
export function calculateMatchingScore(candidate: MatchingCandidate, criteria: MatchingCriteria, weights: MatchingWeights): MatchingScoreResult {
  const now = criteria.now ?? new Date();
  const distanceMeters = haversineDistanceMeters(candidate.location, criteria.pickup);
  const etaSeconds = estimateEtaSeconds(distanceMeters);
  const maxEtaSeconds = estimateEtaSeconds(criteria.searchRadiusMeters);

  const distanceScore = clamp01(1 - distanceMeters / criteria.searchRadiusMeters);
  const etaScore = clamp01(1 - etaSeconds / maxEtaSeconds);
  const ratingScore = clamp01(candidate.rating / 5);
  const acceptanceRateScore = clamp01(candidate.acceptanceRate);
  // No separate "completed ride" rate is tracked on `Driver` — cancellation rate's
  // inverse is used as the completion-rate signal (see docs/matching-engine.md).
  const completionRateScore = clamp01(1 - candidate.cancellationRate);
  const recentActivitySeconds = candidate.lastHeartbeatAt ? (now.getTime() - candidate.lastHeartbeatAt.getTime()) / 1000 : Infinity;
  const recentActivityScore = clamp01(1 - recentActivitySeconds / RECENT_ACTIVITY_STALE_AFTER_SECONDS);
  const driverLevelScore = getDriverLevelScore(getDriverLevel(candidate.completedTrips));
  const vehicleCategoryMatchScore = !criteria.requestedVehicleCategoryId || !candidate.vehicleCategoryId ? 0.5 : candidate.vehicleCategoryId === criteria.requestedVehicleCategoryId ? 1 : 0;
  const serviceZoneScore = getServiceZoneScore(distanceMeters);

  const breakdown: MatchingScoreBreakdown = {
    distance: distanceScore,
    eta: etaScore,
    rating: ratingScore,
    acceptanceRate: acceptanceRateScore,
    completionRate: completionRateScore,
    recentActivity: recentActivityScore,
    driverLevel: driverLevelScore,
    vehicleCategoryMatch: vehicleCategoryMatchScore,
    serviceZone: serviceZoneScore,
  };

  const weightedSum = (Object.keys(breakdown) as Array<keyof MatchingScoreBreakdown>).reduce(
    (sum, key) => sum + breakdown[key] * weights[key],
    0,
  );
  const totalWeight = (Object.keys(breakdown) as Array<keyof MatchingScoreBreakdown>).reduce((sum, key) => sum + weights[key], 0);

  return { total: totalWeight > 0 ? weightedSum / totalWeight : 0, breakdown, distanceMeters, etaSeconds };
}

/**
 * Proxy for "service zone" without a real geofencing/zone subsystem
 * (out of scope this sprint): scores higher the closer a driver is to
 * the *smallest* search-radius expansion tier (`SEARCH_RADIUS_EXPANSION_KM`),
 * treating that innermost ring as the pickup's "home zone." See
 * docs/matching-engine.md for the reasoning.
 */
export function getServiceZoneScore(distanceMeters: number): number {
  const distanceKm = distanceMeters / 1000;
  const tierIndex = SEARCH_RADIUS_EXPANSION_KM.findIndex((radiusKm) => distanceKm <= radiusKm);
  if (tierIndex === -1) return 0;
  return clamp01(1 - tierIndex / SEARCH_RADIUS_EXPANSION_KM.length);
}

export interface RankedMatchingCandidate extends MatchingScoreResult {
  driverId: string;
}

/** Filters to eligible candidates, scores each, and ranks highest-score-first. */
export function rankMatchingCandidates(candidates: MatchingCandidate[], criteria: MatchingCriteria, weights: MatchingWeights): RankedMatchingCandidate[] {
  return candidates
    .filter((candidate) => isMatchingCandidateEligible(candidate, criteria))
    .map((candidate) => ({ driverId: candidate.driverId, ...calculateMatchingScore(candidate, criteria, weights) }))
    .sort((a, b) => b.total - a.total);
}
