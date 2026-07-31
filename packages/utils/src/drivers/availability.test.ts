import { DriverAvailabilityStatus } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import {
  assertAvailabilityTransition,
  canTransitionAvailability,
  getNextAvailabilityStatuses,
  InvalidAvailabilityTransitionError,
  isAvailableForOffers,
} from "./availability";

describe("canTransitionAvailability", () => {
  it("allows the full shift happy path", () => {
    expect(canTransitionAvailability(DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.ONLINE)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.ONLINE, DriverAvailabilityStatus.AVAILABLE)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.BUSY)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.BUSY, DriverAvailabilityStatus.ON_TRIP)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.ON_TRIP, DriverAvailabilityStatus.AVAILABLE)).toBe(true);
  });

  it("allows taking a break and returning", () => {
    expect(canTransitionAvailability(DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.ON_BREAK)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.ON_BREAK, DriverAvailabilityStatus.AVAILABLE)).toBe(true);
  });

  it("allows suspension from any active status", () => {
    expect(canTransitionAvailability(DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.SUSPENDED)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.BUSY, DriverAvailabilityStatus.SUSPENDED)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.ON_TRIP, DriverAvailabilityStatus.SUSPENDED)).toBe(true);
  });

  it("reactivation from suspended always routes back through offline", () => {
    expect(canTransitionAvailability(DriverAvailabilityStatus.SUSPENDED, DriverAvailabilityStatus.OFFLINE)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.SUSPENDED, DriverAvailabilityStatus.AVAILABLE)).toBe(false);
  });

  it("disallows skipping stages", () => {
    expect(canTransitionAvailability(DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.AVAILABLE)).toBe(false);
    expect(canTransitionAvailability(DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.ON_TRIP)).toBe(false);
  });

  it("a driver can be marked inactive only from offline", () => {
    expect(canTransitionAvailability(DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.INACTIVE)).toBe(true);
    expect(canTransitionAvailability(DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.INACTIVE)).toBe(false);
  });
});

describe("assertAvailabilityTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertAvailabilityTransition(DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.ONLINE)).not.toThrow();
  });

  it("throws InvalidAvailabilityTransitionError for an invalid transition", () => {
    expect(() => assertAvailabilityTransition(DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.AVAILABLE)).toThrow(
      InvalidAvailabilityTransitionError,
    );
  });
});

describe("getNextAvailabilityStatuses", () => {
  it("terminal-ish statuses (cancelled/reassigned equivalents) still have an exit", () => {
    expect(getNextAvailabilityStatuses(DriverAvailabilityStatus.SUSPENDED)).toEqual([DriverAvailabilityStatus.OFFLINE]);
    expect(getNextAvailabilityStatuses(DriverAvailabilityStatus.INACTIVE)).toEqual([DriverAvailabilityStatus.OFFLINE]);
  });
});

describe("isAvailableForOffers", () => {
  it("only AVAILABLE can receive offers", () => {
    expect(isAvailableForOffers(DriverAvailabilityStatus.AVAILABLE)).toBe(true);
    expect(isAvailableForOffers(DriverAvailabilityStatus.ONLINE)).toBe(false);
    expect(isAvailableForOffers(DriverAvailabilityStatus.BUSY)).toBe(false);
    expect(isAvailableForOffers(DriverAvailabilityStatus.ON_TRIP)).toBe(false);
  });
});
