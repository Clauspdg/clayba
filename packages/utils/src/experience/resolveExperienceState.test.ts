import {
  DriverAccountStatus,
  DriverApplicationStatus,
  ExperienceState,
  Role,
  type Driver,
  type DriverApplication,
} from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { resolveExperienceState } from "./resolveExperienceState";

const baseApplication = { id: "app1", userId: "u1" } as unknown as DriverApplication;
const baseDriver = { id: "u1", userId: "u1", applicationId: "app1" } as unknown as Driver;

function claims(role: Role) {
  return { uid: "u1", role };
}

describe("resolveExperienceState", () => {
  it("returns GUEST when there are no claims", () => {
    expect(resolveExperienceState({ claims: null, driverApplication: null, driver: null })).toBe(
      ExperienceState.GUEST,
    );
  });

  it("returns AUTHENTICATED_PASSENGER for a signed-in user with no application or driver record", () => {
    expect(
      resolveExperienceState({
        claims: claims(Role.PASSENGER),
        driverApplication: null,
        driver: null,
      }),
    ).toBe(ExperienceState.AUTHENTICATED_PASSENGER);
  });

  const applicationStatusCases: [DriverApplicationStatus, ExperienceState][] = [
    [DriverApplicationStatus.DRAFT, ExperienceState.DRIVER_APPLICANT_DRAFT],
    [DriverApplicationStatus.SUBMITTED, ExperienceState.DRIVER_APPLICANT_SUBMITTED],
    [DriverApplicationStatus.DOCUMENTS_PENDING, ExperienceState.DRIVER_APPLICANT_UNDER_REVIEW],
    [DriverApplicationStatus.BACKGROUND_CHECK, ExperienceState.DRIVER_APPLICANT_UNDER_REVIEW],
    [DriverApplicationStatus.VEHICLE_INSPECTION, ExperienceState.DRIVER_APPLICANT_UNDER_REVIEW],
    [DriverApplicationStatus.INTERVIEW, ExperienceState.DRIVER_APPLICANT_UNDER_REVIEW],
    [DriverApplicationStatus.APPROVED, ExperienceState.DRIVER_APPLICANT_APPROVED],
    [DriverApplicationStatus.REJECTED, ExperienceState.DRIVER_APPLICANT_REJECTED],
  ];

  for (const [status, expected] of applicationStatusCases) {
    it(`maps application status "${status}" to ${expected}`, () => {
      expect(
        resolveExperienceState({
          claims: claims(Role.PASSENGER),
          driverApplication: { ...baseApplication, status },
          driver: null,
        }),
      ).toBe(expected);
    });
  }

  const driverStatusCases: [DriverAccountStatus, ExperienceState][] = [
    [DriverAccountStatus.ACTIVE, ExperienceState.DRIVER_ACTIVATED],
    [DriverAccountStatus.SUSPENDED, ExperienceState.DRIVER_SUSPENDED],
    [DriverAccountStatus.TERMINATED, ExperienceState.DRIVER_INACTIVE],
  ];

  for (const [status, expected] of driverStatusCases) {
    it(`maps driver status "${status}" to ${expected}`, () => {
      expect(
        resolveExperienceState({
          claims: claims(Role.DRIVER),
          driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
          driver: { ...baseDriver, status },
        }),
      ).toBe(expected);
    });
  }

  it("prioritizes the driver record over a stale 'activated' application status", () => {
    const result = resolveExperienceState({
      claims: claims(Role.DRIVER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.ACTIVE },
    });
    expect(result).toBe(ExperienceState.DRIVER_ACTIVATED);
  });

  const roleCases: [Role, ExperienceState][] = [
    [Role.SUPER_ADMIN, ExperienceState.SUPER_ADMIN],
    [Role.ADMIN, ExperienceState.ADMIN],
    [Role.DISPATCHER, ExperienceState.DISPATCHER],
    [Role.SUPPORT, ExperienceState.SUPPORT],
    [Role.CONTENT_MANAGER, ExperienceState.CONTENT_MANAGER],
  ];

  for (const [role, expected] of roleCases) {
    it(`maps staff role "${role}" to ${expected} regardless of application/driver data`, () => {
      expect(
        resolveExperienceState({
          claims: claims(role),
          driverApplication: { ...baseApplication, status: DriverApplicationStatus.DRAFT },
          driver: { ...baseDriver, status: DriverAccountStatus.ACTIVE },
        }),
      ).toBe(expected);
    });
  }
});
