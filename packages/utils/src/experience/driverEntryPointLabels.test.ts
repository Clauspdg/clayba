import { ExperienceState } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { getDriverDashboardCardCtaLabelKey, getDriverNavLabelKey } from "./driverEntryPointLabels";

const REVIEW_STATES = [
  ExperienceState.DRIVER_APPLICANT_SUBMITTED,
  ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING,
  ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK,
  ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION,
  ExperienceState.DRIVER_APPLICANT_INTERVIEW,
];

describe("getDriverDashboardCardCtaLabelKey", () => {
  it("says 'apply' for a passenger with no application", () => {
    expect(getDriverDashboardCardCtaLabelKey(ExperienceState.PASSENGER)).toBe(
      "becomeDriver.entryPoint.cardCtaApply",
    );
  });

  it("says 'continue' for a draft applicant", () => {
    expect(getDriverDashboardCardCtaLabelKey(ExperienceState.DRIVER_APPLICANT_DRAFT)).toBe(
      "becomeDriver.entryPoint.cardCtaContinue",
    );
  });

  it("says 'view status' for every review-pipeline stage and rejected", () => {
    for (const state of [...REVIEW_STATES, ExperienceState.DRIVER_APPLICANT_REJECTED]) {
      expect(getDriverDashboardCardCtaLabelKey(state)).toBe(
        "becomeDriver.entryPoint.cardCtaViewStatus",
      );
    }
  });

  it("says 'view approval' once approved but not yet activated", () => {
    expect(getDriverDashboardCardCtaLabelKey(ExperienceState.DRIVER_APPLICANT_APPROVED)).toBe(
      "becomeDriver.entryPoint.cardCtaViewApproval",
    );
  });

  it("says 'open driver space' once active — never sends an active driver back into the application", () => {
    expect(getDriverDashboardCardCtaLabelKey(ExperienceState.DRIVER_ACTIVE)).toBe(
      "becomeDriver.entryPoint.cardCtaOpenSpace",
    );
  });

  it("says 'account status' for suspended or inactive — never offers Go Online here", () => {
    expect(getDriverDashboardCardCtaLabelKey(ExperienceState.DRIVER_SUSPENDED)).toBe(
      "becomeDriver.entryPoint.cardCtaAccountStatus",
    );
    expect(getDriverDashboardCardCtaLabelKey(ExperienceState.DRIVER_INACTIVE)).toBe(
      "becomeDriver.entryPoint.cardCtaAccountStatus",
    );
  });
});

describe("getDriverNavLabelKey", () => {
  it("says 'become a driver' for a passenger with no application", () => {
    expect(getDriverNavLabelKey(ExperienceState.PASSENGER)).toBe(
      "becomeDriver.entryPoint.navApply",
    );
  });

  it("says 'continue driver application' for a draft applicant", () => {
    expect(getDriverNavLabelKey(ExperienceState.DRIVER_APPLICANT_DRAFT)).toBe(
      "becomeDriver.entryPoint.navContinue",
    );
  });

  it("says 'driver application status' for every review-pipeline stage and rejected", () => {
    for (const state of [...REVIEW_STATES, ExperienceState.DRIVER_APPLICANT_REJECTED]) {
      expect(getDriverNavLabelKey(state)).toBe("becomeDriver.entryPoint.navStatus");
    }
  });

  it("says 'driver approval' once approved", () => {
    expect(getDriverNavLabelKey(ExperienceState.DRIVER_APPLICANT_APPROVED)).toBe(
      "becomeDriver.entryPoint.navApproval",
    );
  });

  it("says 'driver space' once active", () => {
    expect(getDriverNavLabelKey(ExperienceState.DRIVER_ACTIVE)).toBe(
      "becomeDriver.entryPoint.navSpace",
    );
  });

  it("says 'driver account status' for suspended or inactive", () => {
    expect(getDriverNavLabelKey(ExperienceState.DRIVER_SUSPENDED)).toBe(
      "becomeDriver.entryPoint.navAccountStatus",
    );
    expect(getDriverNavLabelKey(ExperienceState.DRIVER_INACTIVE)).toBe(
      "becomeDriver.entryPoint.navAccountStatus",
    );
  });
});
