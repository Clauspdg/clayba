import { describe, expect, it } from "vitest";

import { OfferStatus, TripRequestStatus, TripStatus } from "./trips.enums";
import { rideOfferSchema, tripRequestSchema, tripSchema } from "./trips.schemas";

/** What a raw client-SDK `snapshot.data()` actually hands back for a date field — not `instanceof Date`. */
function timestamp(date: Date) {
  return { toDate: () => date, seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
}

const pickup = { lat: 45.5017, lng: -73.5673 };
const dropoff = { lat: 45.5088, lng: -73.5878 };

describe("tripRequestSchema", () => {
  it("parses requestedAt/createdAt/updatedAt as raw Firestore Timestamp-like objects, reproducing the DRIVER-E2E-06 Dispatch Center crash", () => {
    // Before the fix (bare z.date() instead of firestoreDateSchema), this
    // threw a ZodError ("requestedAt/createdAt/updatedAt: Expected date,
    // received object") the instant any real tripRequests doc read via the
    // client SDK was validated — which is exactly what LiveRideRequestsTab
    // does on every onSnapshot emission.
    const request = tripRequestSchema.parse({
      id: "req-1",
      passengerId: "passenger-1",
      status: TripRequestStatus.SEARCHING_DRIVER,
      pickup,
      dropoff,
      requestedAt: timestamp(new Date("2026-01-01T00:00:00.000Z")),
      createdAt: timestamp(new Date("2026-01-01T00:00:00.000Z")),
      updatedAt: timestamp(new Date("2026-01-01T00:00:01.000Z")),
    });

    expect(request.requestedAt).toBeInstanceOf(Date);
    expect(request.createdAt).toBeInstanceOf(Date);
    expect(request.updatedAt).toBeInstanceOf(Date);
  });

  it("still rejects a requestedAt that is neither a Date nor Timestamp-like", () => {
    expect(() =>
      tripRequestSchema.parse({
        id: "req-1",
        passengerId: "passenger-1",
        status: TripRequestStatus.SEARCHING_DRIVER,
        pickup,
        dropoff,
        requestedAt: { not: "a date" },
        createdAt: new Date(),
      }),
    ).toThrow();
  });
});

describe("rideOfferSchema", () => {
  it("parses createdAt/expiresAt/updatedAt as raw Firestore Timestamp-like objects", () => {
    const offer = rideOfferSchema.parse({
      id: "offer-1",
      tripRequestId: "req-1",
      driverId: "driver-1",
      status: OfferStatus.SENT,
      searchRadiusKm: 2,
      score: 0.74,
      distanceMeters: 0,
      etaSeconds: 60,
      estimatedEarnings: 8,
      createdAt: timestamp(new Date("2026-01-01T00:00:00.000Z")),
      expiresAt: timestamp(new Date("2026-01-01T00:00:15.000Z")),
      updatedAt: timestamp(new Date("2026-01-01T00:00:00.000Z")),
    });

    expect(offer.createdAt).toBeInstanceOf(Date);
    expect(offer.expiresAt).toBeInstanceOf(Date);
    expect(offer.updatedAt).toBeInstanceOf(Date);
  });
});

describe("tripSchema", () => {
  it("accepts an optional tripRequestId linking back to the originating request (DRIVER-E2E-07)", () => {
    const trip = tripSchema.parse({
      id: "trip-1",
      tripRequestId: "req-1",
      passengerId: "passenger-1",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
      status: TripStatus.MATCHED,
      pickup,
      dropoff,
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(trip.tripRequestId).toBe("req-1");
  });

  it("still validates without tripRequestId (backward compatible)", () => {
    const trip = tripSchema.parse({
      id: "trip-1",
      passengerId: "passenger-1",
      status: TripStatus.MATCHED,
      pickup,
      dropoff,
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(trip.tripRequestId).toBeUndefined();
  });

  it("accepts arrivedAt and driverLocation/driverLocationUpdatedAt (DRIVER-E2E-08)", () => {
    const trip = tripSchema.parse({
      id: "trip-1",
      passengerId: "passenger-1",
      status: TripStatus.ARRIVED,
      pickup,
      dropoff,
      requestedAt: new Date(),
      arrivedAt: timestamp(new Date("2026-01-01T00:05:00.000Z")),
      driverLocation: { lat: 45.51, lng: -73.6 },
      driverLocationUpdatedAt: timestamp(new Date("2026-01-01T00:04:30.000Z")),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(trip.arrivedAt).toBeInstanceOf(Date);
    expect(trip.driverLocation).toEqual({ lat: 45.51, lng: -73.6 });
    expect(trip.driverLocationUpdatedAt).toBeInstanceOf(Date);
  });

  it("still validates without arrivedAt/driverLocation (backward compatible)", () => {
    const trip = tripSchema.parse({
      id: "trip-1",
      passengerId: "passenger-1",
      status: TripStatus.MATCHED,
      pickup,
      dropoff,
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(trip.arrivedAt).toBeUndefined();
    expect(trip.driverLocation).toBeUndefined();
  });
});
