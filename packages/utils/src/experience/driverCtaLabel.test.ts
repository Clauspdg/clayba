import { ExperienceState } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { getDriverCtaLabelKey } from "./driverCtaLabel";

describe("getDriverCtaLabelKey", () => {
  it("says 'continue' for a draft applicant", () => {
    expect(getDriverCtaLabelKey(ExperienceState.DRIVER_APPLICANT_DRAFT)).toBe(
      "nav.continueApplication",
    );
  });

  it("says 'view application' for every review-pipeline stage", () => {
    for (const state of [
      ExperienceState.DRIVER_APPLICANT_SUBMITTED,
      ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING,
      ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK,
      ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION,
      ExperienceState.DRIVER_APPLICANT_INTERVIEW,
    ]) {
      expect(getDriverCtaLabelKey(state)).toBe("nav.myApplication");
    }
  });

  it("says 'view approval' once approved but not yet activated", () => {
    expect(getDriverCtaLabelKey(ExperienceState.DRIVER_APPLICANT_APPROVED)).toBe(
      "nav.viewApproval",
    );
  });

  it("says 'view application' for a rejected applicant", () => {
    expect(getDriverCtaLabelKey(ExperienceState.DRIVER_APPLICANT_REJECTED)).toBe(
      "nav.myApplication",
    );
  });

  it("says 'driver status' once active", () => {
    expect(getDriverCtaLabelKey(ExperienceState.DRIVER_ACTIVE)).toBe("nav.driverStatus");
  });

  it("says 'account status' for suspended or inactive drivers", () => {
    expect(getDriverCtaLabelKey(ExperienceState.DRIVER_SUSPENDED)).toBe("nav.accountStatus");
    expect(getDriverCtaLabelKey(ExperienceState.DRIVER_INACTIVE)).toBe("nav.accountStatus");
  });
});
