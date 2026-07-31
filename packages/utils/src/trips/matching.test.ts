import { DEFAULT_PLATFORM_SETTINGS, DriverAvailabilityStatus } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { calculateMatchingScore, getServiceZoneScore, isMatchingCandidateEligible, rankMatchingCandidates, type MatchingCandidate, type MatchingCriteria } from "./matching";

const pickup = { lat: 40.7128, lng: -74.006 };
const nearby = { lat: 40.7138, lng: -74.007 };
const farAway = { lat: 34.0522, lng: -118.2437 };

function makeCandidate(overrides: Partial<MatchingCandidate> = {}): MatchingCandidate {
  return {
    driverId: "driver-1",
    isVerified: true,
    isSuspended: false,
    isVehicleApproved: true,
    hasValidDocuments: true,
    availabilityStatus: DriverAvailabilityStatus.AVAILABLE,
    location: nearby,
    score: 90,
    acceptanceRate: 0.9,
    cancellationRate: 0.05,
    activeJobsCount: 0,
    rating: 4.8,
    completedTrips: 500,
    lastHeartbeatAt: new Date(),
    ...overrides,
  };
}

const criteria: MatchingCriteria = {
  pickup,
  searchRadiusMeters: 5000,
  minDriverScore: DEFAULT_PLATFORM_SETTINGS.minDriverScore,
  minAcceptanceRate: DEFAULT_PLATFORM_SETTINGS.minAcceptanceRate,
  maxCancellationRate: DEFAULT_PLATFORM_SETTINGS.maxCancellationRate,
  maxActiveJobsPerDriver: DEFAULT_PLATFORM_SETTINGS.maxActiveJobsPerDriver,
};

const weights = DEFAULT_PLATFORM_SETTINGS.matchingWeights;

describe("isMatchingCandidateEligible", () => {
  it("is eligible when every condition passes", () => {
    expect(isMatchingCandidateEligible(makeCandidate(), criteria)).toBe(true);
  });

  it("is not eligible when not verified", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ isVerified: false }), criteria)).toBe(false);
  });

  it("is not eligible when suspended", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ isSuspended: true }), criteria)).toBe(false);
  });

  it("is not eligible with an unapproved vehicle", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ isVehicleApproved: false }), criteria)).toBe(false);
  });

  it("is not eligible with invalid documents", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ hasValidDocuments: false }), criteria)).toBe(false);
  });

  it("is not eligible unless status is exactly AVAILABLE", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ availabilityStatus: DriverAvailabilityStatus.ONLINE }), criteria)).toBe(false);
    expect(isMatchingCandidateEligible(makeCandidate({ availabilityStatus: DriverAvailabilityStatus.BUSY }), criteria)).toBe(false);
  });

  it("is not eligible below the minimum driver score", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ score: 10 }), criteria)).toBe(false);
  });

  it("is not eligible below the minimum acceptance rate", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ acceptanceRate: 0.1 }), criteria)).toBe(false);
  });

  it("is not eligible above the maximum cancellation rate", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ cancellationRate: 0.9 }), criteria)).toBe(false);
  });

  it("is not eligible at or above the maximum active jobs", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ activeJobsCount: 1 }), criteria)).toBe(false);
  });

  it("is not eligible outside the search radius", () => {
    expect(isMatchingCandidateEligible(makeCandidate({ location: farAway }), criteria)).toBe(false);
  });
});

describe("calculateMatchingScore", () => {
  it("scores a strong nearby candidate highly", () => {
    const result = calculateMatchingScore(makeCandidate(), criteria, weights);
    expect(result.total).toBeGreaterThan(0.5);
    expect(result.total).toBeLessThanOrEqual(1);
  });

  it("penalizes distance — a farther-but-still-in-radius candidate scores lower", () => {
    const closeCandidate = makeCandidate({ location: { lat: 40.715, lng: -74.008 } });
    const fartherCandidate = makeCandidate({ location: { lat: 40.75, lng: -74.03 } });
    const closeScore = calculateMatchingScore(closeCandidate, criteria, weights).total;
    const fartherScore = calculateMatchingScore(fartherCandidate, criteria, weights).total;
    expect(closeScore).toBeGreaterThan(fartherScore);
  });

  it("rewards a higher rating", () => {
    const highRated = calculateMatchingScore(makeCandidate({ rating: 5 }), criteria, weights).total;
    const lowRated = calculateMatchingScore(makeCandidate({ rating: 2 }), criteria, weights).total;
    expect(highRated).toBeGreaterThan(lowRated);
  });

  it("gives full marks for an exact vehicle category match and zero for a mismatch", () => {
    const withCategory: MatchingCriteria = { ...criteria, requestedVehicleCategoryId: "economy" };
    const matched = calculateMatchingScore(makeCandidate({ vehicleCategoryId: "economy" }), withCategory, weights);
    const mismatched = calculateMatchingScore(makeCandidate({ vehicleCategoryId: "luxury" }), withCategory, weights);
    expect(matched.breakdown.vehicleCategoryMatch).toBe(1);
    expect(mismatched.breakdown.vehicleCategoryMatch).toBe(0);
  });

  it("gives partial credit when vehicle category is unknown on either side", () => {
    const result = calculateMatchingScore(makeCandidate({ vehicleCategoryId: undefined }), criteria, weights);
    expect(result.breakdown.vehicleCategoryMatch).toBe(0.5);
  });

  it("scores stale presence lower on recent activity", () => {
    const fresh = calculateMatchingScore(makeCandidate({ lastHeartbeatAt: new Date() }), criteria, weights);
    const stale = calculateMatchingScore(makeCandidate({ lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000) }), criteria, weights);
    expect(fresh.breakdown.recentActivity).toBeGreaterThan(stale.breakdown.recentActivity);
    expect(stale.breakdown.recentActivity).toBe(0);
  });

  it("treats a driver with no heartbeat at all as maximally stale", () => {
    const result = calculateMatchingScore(makeCandidate({ lastHeartbeatAt: undefined }), criteria, weights);
    expect(result.breakdown.recentActivity).toBe(0);
  });
});

describe("getServiceZoneScore", () => {
  it("scores the innermost tier (2km) highest", () => {
    expect(getServiceZoneScore(1000)).toBeGreaterThan(getServiceZoneScore(8000));
  });

  it("scores beyond every tier as zero", () => {
    expect(getServiceZoneScore(50_000)).toBe(0);
  });
});

describe("rankMatchingCandidates", () => {
  it("excludes ineligible candidates and ranks the rest by total score", () => {
    const ranked = rankMatchingCandidates(
      [makeCandidate({ driverId: "a", rating: 5 }), makeCandidate({ driverId: "b", isSuspended: true }), makeCandidate({ driverId: "c", rating: 3 })],
      criteria,
      weights,
    );
    expect(ranked.map((c) => c.driverId)).toEqual(["a", "c"]);
  });
});
