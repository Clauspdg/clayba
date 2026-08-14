import {
  DriverAccountStatus,
  DriverApplicationStatus,
  ExperienceState,
  Role,
  type Driver,
  type DriverApplication,
} from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { resolveUserExperience } from "./resolveUserExperience";

const baseApplication = { id: "app1", userId: "u1" } as unknown as DriverApplication;
const baseDriver = { id: "u1", userId: "u1", applicationId: "app1" } as unknown as Driver;

function claims(role: Role) {
  return { uid: "u1", role };
}

/**
 * UX-1 sprint, Part 13 — the 18-case test matrix, exercised against the
 * full `resolveUserExperience` output (effective experience, roles,
 * capabilities, landing route, navigation profile, blocked actions) per
 * case, not just the flat state.
 */
describe("resolveUserExperience — full test matrix", () => {
  it("1. Guest", () => {
    const result = resolveUserExperience({ claims: null, driverApplication: null, driver: null });
    expect(result.effectiveExperience).toBe(ExperienceState.GUEST);
    expect(result.roles).toEqual([]);
    expect(result.primaryRole).toBeNull();
    expect(result.lifecycleState).toEqual({ stage: "none" });
    expect(result.capabilities.canBookRide).toBe(false);
    expect(result.capabilities.canStartDriverApplication).toBe(false);
    expect(result.preferredLandingRoute).toBe("/");
    expect(result.navigationProfile.some((item) => item.href === "/about")).toBe(true);
    expect(result.blockingReason).toBeNull();
  });

  it("2. Passenger", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: null,
      driver: null,
    });
    expect(result.effectiveExperience).toBe(ExperienceState.PASSENGER);
    expect(result.roles).toEqual([Role.PASSENGER]);
    expect(result.primaryRole).toBe(Role.PASSENGER);
    expect(result.capabilities.canBookRide).toBe(true);
    expect(result.capabilities.canStartDriverApplication).toBe(true);
    expect(result.capabilities.canAccessDriverHome).toBe(false);
    expect(result.preferredLandingRoute).toBe("/dashboard");
  });

  it("3. Passenger with draft driver application", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.DRAFT },
      driver: null,
    });
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_APPLICANT_DRAFT);
    expect(result.lifecycleState).toEqual({
      stage: "applicant",
      status: DriverApplicationStatus.DRAFT,
    });
    expect(result.capabilities.canStartDriverApplication).toBe(false);
    expect(result.capabilities.canResumeDriverApplication).toBe(true);
    expect(result.capabilities.canViewDriverApplicationStatus).toBe(false);
    expect(result.preferredLandingRoute).toBe("/become-a-driver");
  });

  it("4. Submitted driver applicant", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.SUBMITTED },
      driver: null,
    });
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_APPLICANT_SUBMITTED);
    expect(result.capabilities.canResumeDriverApplication).toBe(false);
    expect(result.capabilities.canViewDriverApplicationStatus).toBe(true);
  });

  it("5. Applicant under review (documents_pending / background_check / vehicle_inspection / interview)", () => {
    for (const status of [
      DriverApplicationStatus.DOCUMENTS_PENDING,
      DriverApplicationStatus.BACKGROUND_CHECK,
      DriverApplicationStatus.VEHICLE_INSPECTION,
      DriverApplicationStatus.INTERVIEW,
    ]) {
      const result = resolveUserExperience({
        claims: claims(Role.PASSENGER),
        driverApplication: { ...baseApplication, status },
        driver: null,
      });
      expect(result.capabilities.canViewDriverApplicationStatus).toBe(true);
      expect(result.capabilities.canAccessDriverHome).toBe(false);
    }
  });

  it("6. Approved applicant", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.APPROVED },
      driver: null,
    });
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_APPLICANT_APPROVED);
    expect(result.capabilities.canAccessDriverHome).toBe(false);
    expect(result.blockingReason).toBeNull();
  });

  it("7. Active driver", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.ACTIVE },
    });
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_ACTIVE);
    expect(result.roles).toEqual([Role.PASSENGER, Role.DRIVER]);
    expect(result.primaryRole).toBe(Role.DRIVER);
    expect(result.lifecycleState).toEqual({ stage: "active" });
    expect(result.capabilities.canAccessDriverHome).toBe(true);
    expect(result.capabilities.canGoOnline).toBe(true);
    expect(result.capabilities.canBookRide).toBe(true); // retains passenger capability
    expect(result.capabilities.canStartDriverApplication).toBe(false); // must not submit a second application
    expect(result.preferredLandingRoute).toBe("/driver");
    expect(result.navigationProfile.some((item) => item.href === "/driver")).toBe(true);
    expect(result.navigationProfile.some((item) => item.href === "/become-a-driver")).toBe(false);
  });

  it("8. Suspended driver", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.SUSPENDED },
    });
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_SUSPENDED);
    expect(result.lifecycleState).toEqual({ stage: "suspended" });
    expect(result.capabilities.canGoOnline).toBe(false);
    expect(result.capabilities.canAccessDriverHome).toBe(false);
    // Suspended still gets the dedicated Driver Space — a restricted view
    // inside it, not a bounce back to /become-a-driver (UX-3, Part 26).
    expect(result.preferredLandingRoute).toBe("/driver");
  });

  const staffCases: [string, Role, ExperienceState][] = [
    ["9. Admin", Role.ADMIN, ExperienceState.ADMIN],
    ["10. Super Admin", Role.SUPER_ADMIN, ExperienceState.SUPER_ADMIN],
    ["11. Content Manager", Role.CONTENT_MANAGER, ExperienceState.CONTENT_MANAGER],
    ["12. Dispatcher", Role.DISPATCHER, ExperienceState.DISPATCHER],
    ["13. Support", Role.SUPPORT, ExperienceState.SUPPORT],
  ];

  for (const [label, role, expected] of staffCases) {
    it(label, () => {
      const result = resolveUserExperience({
        claims: claims(role),
        driverApplication: null,
        driver: null,
      });
      expect(result.effectiveExperience).toBe(expected);
      expect(result.roles).toEqual([role]);
      expect(result.primaryRole).toBe(role);
      expect(result.capabilities.canViewAdmin).toBe(true);
      expect(result.navigationProfile).toEqual([]); // "use Admin navigation only" — apps/web lends no nav
      expect(result.preferredLandingRoute).toBe("/");
    });
  }

  it("14. Driver claim present but driver record missing", () => {
    const result = resolveUserExperience({
      claims: claims(Role.DRIVER),
      driverApplication: null,
      driver: null,
    });
    // The claim alone must not grant driver capability — only a real
    // drivers/{uid} record does (see resolveExperienceState's doc comment).
    expect(result.effectiveExperience).toBe(ExperienceState.PASSENGER);
    expect(result.capabilities.canAccessDriverHome).toBe(false);
    expect(result.capabilities.canGoOnline).toBe(false);
    expect(result.blockingReason).toBeNull();
  });

  it("15. Driver claim missing but active driver record exists", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.ACTIVE },
    });
    // This is the ACTUAL common case in the real system (activation never
    // sets a claim) — must resolve as a fully valid, unblocked driver.
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_ACTIVE);
    expect(result.roles).toContain(Role.DRIVER);
    expect(result.capabilities.canAccessDriverHome).toBe(true);
    expect(result.blockingReason).toBeNull();
  });

  it("16. Duplicate-application edge case — resolver only ever sees the single application its caller found", () => {
    // Real duplicate-prevention lives in findOwnApplication's limit(1)
    // query (packages/firebase/src/client/driver-application.ts) — the
    // resolver itself has no notion of "which application," it just
    // trusts its single `driverApplication` input, so there is nothing
    // for it to get wrong here as long as exactly one is ever passed in.
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.SUBMITTED },
      driver: null,
    });
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_APPLICANT_SUBMITTED);
  });

  it("17. Rejected application", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.REJECTED },
      driver: null,
    });
    expect(result.effectiveExperience).toBe(ExperienceState.DRIVER_APPLICANT_REJECTED);
    expect(result.capabilities.canStartDriverApplication).toBe(false);
    expect(result.capabilities.canResumeDriverApplication).toBe(false);
    expect(result.capabilities.canViewDriverApplicationStatus).toBe(true);
  });

  it("18. Reactivated driver (suspended -> active)", () => {
    const suspended = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.SUSPENDED },
    });
    expect(suspended.effectiveExperience).toBe(ExperienceState.DRIVER_SUSPENDED);
    expect(suspended.capabilities.canGoOnline).toBe(false);

    const reactivated = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: { ...baseDriver, status: DriverAccountStatus.ACTIVE },
    });
    expect(reactivated.effectiveExperience).toBe(ExperienceState.DRIVER_ACTIVE);
    expect(reactivated.capabilities.canGoOnline).toBe(true);
  });

  it("detects the inconsistent state: application activated but no driver record", () => {
    const result = resolveUserExperience({
      claims: claims(Role.PASSENGER),
      driverApplication: { ...baseApplication, status: DriverApplicationStatus.ACTIVATED },
      driver: null,
    });
    expect(result.blockingReason).not.toBeNull();
  });

  it("Moderator resolves to its own staff state with admin access", () => {
    const result = resolveUserExperience({
      claims: claims(Role.MODERATOR),
      driverApplication: null,
      driver: null,
    });
    expect(result.effectiveExperience).toBe(ExperienceState.MODERATOR);
    expect(result.capabilities.canViewAdmin).toBe(true);
  });
});
