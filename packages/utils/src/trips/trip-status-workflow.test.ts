import { TripStatus } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import {
  assertTripTransition,
  canTransitionTrip,
  getNextTripStatuses,
  InvalidTripTransitionError,
  isTerminalTripStatus,
} from "./trip-status-workflow";

describe("canTransitionTrip", () => {
  it("allows the full ride happy path", () => {
    expect(canTransitionTrip(TripStatus.MATCHED, TripStatus.EN_ROUTE_TO_PICKUP)).toBe(true);
    expect(canTransitionTrip(TripStatus.EN_ROUTE_TO_PICKUP, TripStatus.ARRIVED)).toBe(true);
    expect(canTransitionTrip(TripStatus.ARRIVED, TripStatus.IN_PROGRESS)).toBe(true);
    expect(canTransitionTrip(TripStatus.IN_PROGRESS, TripStatus.COMPLETED)).toBe(true);
  });

  it("disallows skipping stages", () => {
    expect(canTransitionTrip(TripStatus.MATCHED, TripStatus.ARRIVED)).toBe(false);
    expect(canTransitionTrip(TripStatus.MATCHED, TripStatus.COMPLETED)).toBe(false);
  });

  it("allows cancellation from any non-terminal stage", () => {
    for (const status of [
      TripStatus.MATCHED,
      TripStatus.EN_ROUTE_TO_PICKUP,
      TripStatus.ARRIVED,
      TripStatus.IN_PROGRESS,
    ]) {
      expect(canTransitionTrip(status, TripStatus.CANCELLED)).toBe(true);
    }
  });

  it("terminal statuses have no further transitions", () => {
    expect(getNextTripStatuses(TripStatus.COMPLETED)).toEqual([]);
    expect(getNextTripStatuses(TripStatus.CANCELLED)).toEqual([]);
    expect(isTerminalTripStatus(TripStatus.COMPLETED)).toBe(true);
    expect(isTerminalTripStatus(TripStatus.MATCHED)).toBe(false);
  });
});

describe("assertTripTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertTripTransition(TripStatus.ARRIVED, TripStatus.IN_PROGRESS)).not.toThrow();
  });

  it("throws InvalidTripTransitionError for an invalid transition", () => {
    expect(() => assertTripTransition(TripStatus.MATCHED, TripStatus.COMPLETED)).toThrow(
      InvalidTripTransitionError,
    );
  });
});
