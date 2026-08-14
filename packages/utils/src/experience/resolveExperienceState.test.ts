import {
  DriverAccountStatus,
  DriverApplicationStatus,
  ExperienceState,
  Role,
  type Driver,
  type DriverApplication,
} from "@the-ride/types";
import { describe, expect, it } from "vitest";

import {
  hasDriverJourney,
  isDriverApplicantState,
  isDriverState,
  isStaffState,
  resolveExperienceState,
} from "./resolveExperienceState";

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

  it("returns PASSENGER for a signed-in user with no application or driver record", () => {
    expect(
      resolveExperienceState({
        claims: claims(Role.PASSENGER),
        driverApplication: null,
        driver: null,
      }),
    ).toBe(ExperienceState.PASSENGER);
  });

  const applicationStatusCases: [DriverApplicationStatus, ExperienceState][] = [
    [DriverApplicationStatus.DRAFT, ExperienceState.DRIVER_APPLICANT_DRAFT],
    [DriverApplicationStatus.SUBMITTED, ExperienceState.DRIVER_APPLICANT_SUBMITTED],
    [DriverApplicationStatus.DOCUMENTS_PENDING, ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING],
    [DriverApplicationStatus.BACKGROUND_CHECK, ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK],
    [
      DriverApplicationStatus.VEHICLE_INSPECTION,
      ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION,
    ],
    [DriverApplicationStatus.INTERVIEW, ExperienceState.DRIVER_APPLICANT_INTERVIEW],
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
    [DriverAccountStatus.ACTIVE, ExperienceState.DRIVER_ACTIVE],
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

  it("prioritizes the driver record over a stale 'activated' application status (case 15: driver record present, driver claim missing)", () => {
    const result = resolveExperienceState({
      claims: claims(Role.PASSENGER), // the real system never sets a "driver" claim — see resolveExperienceState's doc comment
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.ACTIVE },
    });
    expect(result).toBe(ExperienceState.DRIVER_ACTIVE);
  });

  it("does not grant driver access from a 'driver' claim alone when no driver record exists (case 14: driver claim without a driver record)", () => {
    const result = resolveExperienceState({
      claims: claims(Role.DRIVER),
      driverApplication: null,
      driver: null,
    });
    expect(result).toBe(ExperienceState.PASSENGER);
  });

  it("resolves a reactivated driver (suspended -> active) correctly (case 18)", () => {
    const result = resolveExperienceState({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.ACTIVE },
    });
    expect(result).toBe(ExperienceState.DRIVER_ACTIVE);
  });

  it("does not duplicate a second application into a different state — resolves from the single found application (case 16, duplicate-prevention lives in findOwnApplication's limit(1); this just confirms the resolver only ever sees one)", () => {
    const result = resolveExperienceState({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.DRAFT },
      driver: null,
    });
    expect(result).toBe(ExperienceState.DRIVER_APPLICANT_DRAFT);
  });

  const roleCases: [Role, ExperienceState][] = [
    [Role.SUPER_ADMIN, ExperienceState.SUPER_ADMIN],
    [Role.ADMIN, ExperienceState.ADMIN],
    [Role.DISPATCHER, ExperienceState.DISPATCHER],
    [Role.SUPPORT, ExperienceState.SUPPORT],
    [Role.CONTENT_MANAGER, ExperienceState.CONTENT_MANAGER],
    [Role.MODERATOR, ExperienceState.MODERATOR],
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

// UX-3 sprint (Dedicated Driver Space), Part 2 — these three predicates are
// the exact decision logic `RequireDriverAccess` uses to decide who gets
// into `/driver` (isDriverState) vs. gets sent to `/become-a-driver`
// (isDriverApplicantState), so they're the single most access-critical
// functions in the whole sprint. Untested before this sprint.
describe("isDriverState", () => {
  it("true for active, suspended, and inactive drivers", () => {
    expect(isDriverState(ExperienceState.DRIVER_ACTIVE)).toBe(true);
    expect(isDriverState(ExperienceState.DRIVER_SUSPENDED)).toBe(true);
    expect(isDriverState(ExperienceState.DRIVER_INACTIVE)).toBe(true);
  });

  it("false for a plain passenger, an applicant, staff, and null", () => {
    expect(isDriverState(ExperienceState.PASSENGER)).toBe(false);
    expect(isDriverState(ExperienceState.DRIVER_APPLICANT_DRAFT)).toBe(false);
    expect(isDriverState(ExperienceState.ADMIN)).toBe(false);
    expect(isDriverState(null)).toBe(false);
  });
});

describe("isDriverApplicantState", () => {
  it("true for every applicant stage, including approved/rejected", () => {
    expect(isDriverApplicantState(ExperienceState.DRIVER_APPLICANT_DRAFT)).toBe(true);
    expect(isDriverApplicantState(ExperienceState.DRIVER_APPLICANT_APPROVED)).toBe(true);
    expect(isDriverApplicantState(ExperienceState.DRIVER_APPLICANT_REJECTED)).toBe(true);
  });

  it("false for a real driver record (active) — an activated driver is no longer an applicant", () => {
    expect(isDriverApplicantState(ExperienceState.DRIVER_ACTIVE)).toBe(false);
  });
});

describe("hasDriverJourney / isStaffState", () => {
  it("hasDriverJourney is true for both applicant and driver states, false otherwise", () => {
    expect(hasDriverJourney(ExperienceState.DRIVER_APPLICANT_SUBMITTED)).toBe(true);
    expect(hasDriverJourney(ExperienceState.DRIVER_ACTIVE)).toBe(true);
    expect(hasDriverJourney(ExperienceState.PASSENGER)).toBe(false);
  });

  it("isStaffState never overlaps with isDriverState — staff must never accidentally get Driver Space access", () => {
    for (const state of Object.values(ExperienceState)) {
      expect(isStaffState(state) && isDriverState(state)).toBe(false);
    }
  });
});
