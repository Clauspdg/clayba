import { OfferStatus } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { assertOfferTransition, canTransitionOffer, getNextOfferStatuses, InvalidOfferTransitionError, isTerminalOfferStatus } from "./offer-workflow";

describe("canTransitionOffer", () => {
  it("allows the full happy path", () => {
    expect(canTransitionOffer(OfferStatus.CREATED, OfferStatus.SENT)).toBe(true);
    expect(canTransitionOffer(OfferStatus.SENT, OfferStatus.VIEWED)).toBe(true);
    expect(canTransitionOffer(OfferStatus.VIEWED, OfferStatus.ACCEPTED)).toBe(true);
    expect(canTransitionOffer(OfferStatus.ACCEPTED, OfferStatus.COMPLETED)).toBe(true);
  });

  it("allows declining or expiring directly from sent (viewing is not mandatory)", () => {
    expect(canTransitionOffer(OfferStatus.SENT, OfferStatus.DECLINED)).toBe(true);
    expect(canTransitionOffer(OfferStatus.SENT, OfferStatus.EXPIRED)).toBe(true);
  });

  it("allows reassignment after a decline or expiry", () => {
    expect(canTransitionOffer(OfferStatus.DECLINED, OfferStatus.REASSIGNED)).toBe(true);
    expect(canTransitionOffer(OfferStatus.EXPIRED, OfferStatus.REASSIGNED)).toBe(true);
  });

  it("allows cancelling before a response, but not after acceptance except to a terminal state", () => {
    expect(canTransitionOffer(OfferStatus.CREATED, OfferStatus.CANCELLED)).toBe(true);
    expect(canTransitionOffer(OfferStatus.SENT, OfferStatus.CANCELLED)).toBe(true);
    expect(canTransitionOffer(OfferStatus.ACCEPTED, OfferStatus.CANCELLED)).toBe(true);
  });

  it("disallows skipping straight to accepted from created", () => {
    expect(canTransitionOffer(OfferStatus.CREATED, OfferStatus.ACCEPTED)).toBe(false);
  });

  it("disallows leaving terminal statuses", () => {
    expect(getNextOfferStatuses(OfferStatus.CANCELLED)).toEqual([]);
    expect(getNextOfferStatuses(OfferStatus.REASSIGNED)).toEqual([]);
    expect(getNextOfferStatuses(OfferStatus.COMPLETED)).toEqual([]);
  });
});

describe("assertOfferTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertOfferTransition(OfferStatus.CREATED, OfferStatus.SENT)).not.toThrow();
  });

  it("throws InvalidOfferTransitionError for an invalid transition", () => {
    expect(() => assertOfferTransition(OfferStatus.COMPLETED, OfferStatus.SENT)).toThrow(InvalidOfferTransitionError);
  });
});

describe("isTerminalOfferStatus", () => {
  it("Cancelled, Reassigned, and Completed are terminal", () => {
    expect(isTerminalOfferStatus(OfferStatus.CANCELLED)).toBe(true);
    expect(isTerminalOfferStatus(OfferStatus.REASSIGNED)).toBe(true);
    expect(isTerminalOfferStatus(OfferStatus.COMPLETED)).toBe(true);
  });

  it("Created is not terminal", () => {
    expect(isTerminalOfferStatus(OfferStatus.CREATED)).toBe(false);
  });
});
