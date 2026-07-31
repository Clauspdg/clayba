import { DriverApplicationStatus } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import {
  assertDriverApplicationTransition,
  canTransitionDriverApplication,
  getNextDriverApplicationStatuses,
  InvalidDriverApplicationTransitionError,
  isTerminalDriverApplicationStatus,
} from "./workflow";

describe("canTransitionDriverApplication", () => {
  it("allows Draft -> Submitted", () => {
    expect(canTransitionDriverApplication(DriverApplicationStatus.DRAFT, DriverApplicationStatus.SUBMITTED)).toBe(true);
  });

  it("allows Interview -> Approved or Rejected", () => {
    expect(canTransitionDriverApplication(DriverApplicationStatus.INTERVIEW, DriverApplicationStatus.APPROVED)).toBe(true);
    expect(canTransitionDriverApplication(DriverApplicationStatus.INTERVIEW, DriverApplicationStatus.REJECTED)).toBe(true);
  });

  it("disallows skipping stages (Draft -> Approved)", () => {
    expect(canTransitionDriverApplication(DriverApplicationStatus.DRAFT, DriverApplicationStatus.APPROVED)).toBe(false);
  });

  it("disallows leaving a terminal status (Archived)", () => {
    expect(getNextDriverApplicationStatuses(DriverApplicationStatus.ARCHIVED)).toEqual([]);
  });

  it("allows Suspended -> Activated (reinstatement) or Archived", () => {
    expect(canTransitionDriverApplication(DriverApplicationStatus.SUSPENDED, DriverApplicationStatus.ACTIVATED)).toBe(true);
    expect(canTransitionDriverApplication(DriverApplicationStatus.SUSPENDED, DriverApplicationStatus.ARCHIVED)).toBe(true);
  });
});

describe("assertDriverApplicationTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertDriverApplicationTransition(DriverApplicationStatus.APPROVED, DriverApplicationStatus.ACTIVATED)).not.toThrow();
  });

  it("throws InvalidDriverApplicationTransitionError for an invalid transition", () => {
    expect(() => assertDriverApplicationTransition(DriverApplicationStatus.DRAFT, DriverApplicationStatus.ACTIVATED)).toThrow(
      InvalidDriverApplicationTransitionError,
    );
  });
});

describe("isTerminalDriverApplicationStatus", () => {
  it("Archived is terminal", () => {
    expect(isTerminalDriverApplicationStatus(DriverApplicationStatus.ARCHIVED)).toBe(true);
  });

  it("Draft is not terminal", () => {
    expect(isTerminalDriverApplicationStatus(DriverApplicationStatus.DRAFT)).toBe(false);
  });
});
