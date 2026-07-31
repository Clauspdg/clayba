import { TripRequestStatus } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import {
  assertTripRequestTransition,
  canTransitionTripRequest,
  getNextTripRequestStatuses,
  InvalidTripRequestTransitionError,
  isTerminalTripRequestStatus,
} from "./workflow";

describe("canTransitionTripRequest", () => {
  it("allows the full happy path in order", () => {
    expect(canTransitionTripRequest(TripRequestStatus.DRAFT, TripRequestStatus.ESTIMATING)).toBe(true);
    expect(canTransitionTripRequest(TripRequestStatus.ESTIMATING, TripRequestStatus.CONFIRMED)).toBe(true);
    expect(canTransitionTripRequest(TripRequestStatus.CONFIRMED, TripRequestStatus.SEARCHING_DRIVER)).toBe(true);
    expect(canTransitionTripRequest(TripRequestStatus.SEARCHING_DRIVER, TripRequestStatus.DRIVER_ASSIGNED)).toBe(true);
    expect(canTransitionTripRequest(TripRequestStatus.DRIVER_ASSIGNED, TripRequestStatus.DRIVER_ACCEPTED)).toBe(true);
  });

  it("allows cancelling before a driver is assigned", () => {
    expect(canTransitionTripRequest(TripRequestStatus.DRAFT, TripRequestStatus.CANCELLED)).toBe(true);
    expect(canTransitionTripRequest(TripRequestStatus.ESTIMATING, TripRequestStatus.CANCELLED)).toBe(true);
    expect(canTransitionTripRequest(TripRequestStatus.CONFIRMED, TripRequestStatus.CANCELLED)).toBe(true);
    expect(canTransitionTripRequest(TripRequestStatus.SEARCHING_DRIVER, TripRequestStatus.CANCELLED)).toBe(true);
  });

  it("allows re-offering after a driver rejects", () => {
    expect(canTransitionTripRequest(TripRequestStatus.DRIVER_REJECTED, TripRequestStatus.SEARCHING_DRIVER)).toBe(true);
  });

  it("disallows skipping stages", () => {
    expect(canTransitionTripRequest(TripRequestStatus.DRAFT, TripRequestStatus.CONFIRMED)).toBe(false);
    expect(canTransitionTripRequest(TripRequestStatus.DRAFT, TripRequestStatus.DRIVER_ASSIGNED)).toBe(false);
  });

  it("disallows leaving a terminal status", () => {
    expect(getNextTripRequestStatuses(TripRequestStatus.CANCELLED)).toEqual([]);
    expect(getNextTripRequestStatuses(TripRequestStatus.EXPIRED)).toEqual([]);
  });
});

describe("assertTripRequestTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertTripRequestTransition(TripRequestStatus.DRAFT, TripRequestStatus.ESTIMATING)).not.toThrow();
  });

  it("throws InvalidTripRequestTransitionError for an invalid transition", () => {
    expect(() => assertTripRequestTransition(TripRequestStatus.CANCELLED, TripRequestStatus.CONFIRMED)).toThrow(
      InvalidTripRequestTransitionError,
    );
  });
});

describe("isTerminalTripRequestStatus", () => {
  it("Cancelled and Expired are terminal", () => {
    expect(isTerminalTripRequestStatus(TripRequestStatus.CANCELLED)).toBe(true);
    expect(isTerminalTripRequestStatus(TripRequestStatus.EXPIRED)).toBe(true);
  });

  it("Draft is not terminal", () => {
    expect(isTerminalTripRequestStatus(TripRequestStatus.DRAFT)).toBe(false);
  });
});
