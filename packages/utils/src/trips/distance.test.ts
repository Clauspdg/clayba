import { describe, expect, it } from "vitest";

import { estimateEtaSeconds, haversineDistanceMeters } from "./distance";

describe("haversineDistanceMeters", () => {
  it("is zero for the same point", () => {
    const point = { lat: 40.7128, lng: -74.006 };
    expect(haversineDistanceMeters(point, point)).toBe(0);
  });

  it("approximates the known distance between two well-known cities", () => {
    // New York City to Los Angeles is ~3,935 km great-circle.
    const nyc = { lat: 40.7128, lng: -74.006 };
    const la = { lat: 34.0522, lng: -118.2437 };
    const distanceKm = haversineDistanceMeters(nyc, la) / 1000;
    expect(distanceKm).toBeGreaterThan(3900);
    expect(distanceKm).toBeLessThan(3970);
  });
});

describe("estimateEtaSeconds", () => {
  it("computes travel time at the given average speed", () => {
    // 30 km at 30 km/h average speed should take 1 hour = 3600s.
    expect(estimateEtaSeconds(30_000, 30)).toBeCloseTo(3600, 0);
  });

  it("defaults to a 30 km/h average speed", () => {
    expect(estimateEtaSeconds(15_000)).toBeCloseTo(1800, 0);
  });
});
