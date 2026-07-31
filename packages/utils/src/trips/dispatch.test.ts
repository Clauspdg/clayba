import { describe, expect, it } from "vitest";

import { isDriverEligible, rankEligibleDrivers, selectDriverOffers, type DispatchCandidate, type DispatchCriteria } from "./dispatch";

const pickup = { lat: 40.7128, lng: -74.006 }; // NYC
const nearby = { lat: 40.7138, lng: -74.007 }; // ~150m away
const farAway = { lat: 34.0522, lng: -118.2437 }; // LA — thousands of km away

function makeCandidate(overrides: Partial<DispatchCandidate> = {}): DispatchCandidate {
  return {
    driverId: "driver-1",
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    isSuspended: false,
    hasValidDocuments: true,
    isVehicleApproved: true,
    location: nearby,
    score: 90,
    ...overrides,
  };
}

const criteria: DispatchCriteria = { pickup, searchRadiusMeters: 5000 };

describe("isDriverEligible", () => {
  it("is eligible when every condition passes", () => {
    expect(isDriverEligible(makeCandidate(), criteria)).toBe(true);
  });

  it("is not eligible when offline", () => {
    expect(isDriverEligible(makeCandidate({ isOnline: false }), criteria)).toBe(false);
  });

  it("is not eligible when unavailable", () => {
    expect(isDriverEligible(makeCandidate({ isAvailable: false }), criteria)).toBe(false);
  });

  it("is not eligible when not verified", () => {
    expect(isDriverEligible(makeCandidate({ isVerified: false }), criteria)).toBe(false);
  });

  it("is not eligible when suspended", () => {
    expect(isDriverEligible(makeCandidate({ isSuspended: true }), criteria)).toBe(false);
  });

  it("is not eligible with invalid documents", () => {
    expect(isDriverEligible(makeCandidate({ hasValidDocuments: false }), criteria)).toBe(false);
  });

  it("is not eligible with an unapproved vehicle", () => {
    expect(isDriverEligible(makeCandidate({ isVehicleApproved: false }), criteria)).toBe(false);
  });

  it("is not eligible outside the search radius", () => {
    expect(isDriverEligible(makeCandidate({ location: farAway }), criteria)).toBe(false);
  });
});

describe("rankEligibleDrivers", () => {
  it("excludes ineligible candidates entirely", () => {
    const ranked = rankEligibleDrivers([makeCandidate({ driverId: "a" }), makeCandidate({ driverId: "b", isOnline: false })], criteria);
    expect(ranked.map((c) => c.driverId)).toEqual(["a"]);
  });

  it("ranks highest score first", () => {
    const ranked = rankEligibleDrivers(
      [makeCandidate({ driverId: "low", score: 50 }), makeCandidate({ driverId: "high", score: 95 })],
      criteria,
    );
    expect(ranked.map((c) => c.driverId)).toEqual(["high", "low"]);
  });

  it("breaks a score tie by closest ETA (distance)", () => {
    const ranked = rankEligibleDrivers(
      [
        makeCandidate({ driverId: "far", score: 80, location: { lat: 40.73, lng: -74.02 } }),
        makeCandidate({ driverId: "near", score: 80, location: nearby }),
      ],
      criteria,
    );
    expect(ranked.map((c) => c.driverId)).toEqual(["near", "far"]);
  });
});

describe("selectDriverOffers", () => {
  it("caps the offer list at maxOffers", () => {
    const candidates = ["a", "b", "c", "d"].map((id) => makeCandidate({ driverId: id, score: Math.random() * 100 }));
    const offers = selectDriverOffers(candidates, criteria, 2);
    expect(offers).toHaveLength(2);
  });

  it("returns an empty list when nobody is eligible", () => {
    const offers = selectDriverOffers([makeCandidate({ isOnline: false })], criteria, 3);
    expect(offers).toHaveLength(0);
  });
});
