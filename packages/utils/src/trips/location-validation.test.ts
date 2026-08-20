import { describe, expect, it } from "vitest";

import { evaluateLocationUpdate } from "./location-validation";

const BASE_TIME = new Date("2026-01-01T00:00:00Z");
const POINT_A = { lat: 45.5017, lng: -73.5673 };
// ~111m north of POINT_A.
const POINT_B = { lat: 45.5027, lng: -73.5673 };
// ~1,110m north of POINT_A.
const POINT_FAR = { lat: 45.5117, lng: -73.5673 };

describe("evaluateLocationUpdate", () => {
  it("accepts the very first reading with zero distance", () => {
    const result = evaluateLocationUpdate(null, { location: POINT_A, updatedAt: BASE_TIME });
    expect(result.accepted).toBe(true);
    expect(result.distanceMeters).toBe(0);
  });

  it("rejects a reading with poor accuracy", () => {
    const result = evaluateLocationUpdate(null, {
      location: POINT_A,
      updatedAt: BASE_TIME,
      accuracy: 500,
    });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("invalid_accuracy");
  });

  it("accepts real, plausible movement between two readings", () => {
    const previous = { location: POINT_A, updatedAt: BASE_TIME };
    const next = { location: POINT_B, updatedAt: new Date(BASE_TIME.getTime() + 30_000) };
    const result = evaluateLocationUpdate(previous, next);
    expect(result.accepted).toBe(true);
    expect(result.distanceMeters).toBeGreaterThan(0);
  });

  it("treats tiny movement as noise, contributing zero distance", () => {
    const previous = { location: POINT_A, updatedAt: BASE_TIME };
    const jitter = { lat: POINT_A.lat + 0.00001, lng: POINT_A.lng };
    const next = { location: jitter, updatedAt: new Date(BASE_TIME.getTime() + 5_000) };
    const result = evaluateLocationUpdate(previous, next);
    expect(result.accepted).toBe(true);
    expect(result.distanceMeters).toBe(0);
    expect(result.reason).toBe("below_noise_floor");
  });

  it("rejects an implausibly fast jump between two readings", () => {
    const previous = { location: POINT_A, updatedAt: BASE_TIME };
    // ~1.1km in 1 second is ~1100 m/s — impossible for a car.
    const next = { location: POINT_FAR, updatedAt: new Date(BASE_TIME.getTime() + 1_000) };
    const result = evaluateLocationUpdate(previous, next);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("implausible_speed");
  });

  it("rejects a reading with no time elapsed or going backwards", () => {
    const previous = { location: POINT_A, updatedAt: BASE_TIME };
    const next = { location: POINT_B, updatedAt: BASE_TIME };
    const result = evaluateLocationUpdate(previous, next);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("no_time_elapsed");
  });
});
