import { ExperienceState, Role, type UserCapabilities } from "@the-ride/types";

import { hasAnyPermission } from "../authentication/rbac";
import { isDriverApplicantState } from "./resolveExperienceState";

/** Mirrors `apps/admin/src/components/RoleGuard.tsx`'s `ADMIN_DASHBOARD_ROLES` — keep both in sync if that list changes. */
const ADMIN_DASHBOARD_STATES: ReadonlySet<ExperienceState> = new Set([
  ExperienceState.ADMIN,
  ExperienceState.SUPER_ADMIN,
  ExperienceState.DISPATCHER,
  ExperienceState.SUPPORT,
  ExperienceState.MODERATOR,
  ExperienceState.CONTENT_MANAGER,
]);

const CONTENT_MANAGEMENT_ROLES: ReadonlySet<Role> = new Set([
  Role.CONTENT_MANAGER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
]);

/**
 * Derives centralized UI capabilities (UX-1 sprint, Part 5) from the
 * already-resolved effective experience plus the actor's primary role —
 * never re-derived ad hoc per page. Role-permission-backed capabilities
 * go through `@the-ride/utils`'s existing `hasAnyPermission` (the real
 * RBAC matrix, `ROLE_PERMISSIONS`) rather than a second, parallel
 * permission list.
 */
export function resolveCapabilities(
  state: ExperienceState,
  primaryRole: Role | null,
): UserCapabilities {
  const isPassengerLike =
    state === ExperienceState.PASSENGER ||
    isDriverApplicantState(state) ||
    state === ExperienceState.DRIVER_ACTIVE ||
    state === ExperienceState.DRIVER_SUSPENDED ||
    state === ExperienceState.DRIVER_INACTIVE;

  return {
    canUsePassengerExperience: isPassengerLike,
    canBookRide: isPassengerLike,
    canScheduleRide: isPassengerLike,
    canStartDriverApplication: state === ExperienceState.PASSENGER,
    canResumeDriverApplication: state === ExperienceState.DRIVER_APPLICANT_DRAFT,
    canViewDriverApplicationStatus:
      isDriverApplicantState(state) && state !== ExperienceState.DRIVER_APPLICANT_DRAFT,
    canAccessDriverHome: state === ExperienceState.DRIVER_ACTIVE,
    canGoOnline: state === ExperienceState.DRIVER_ACTIVE,
    canViewAdmin: ADMIN_DASHBOARD_STATES.has(state),
    canReviewDrivers:
      primaryRole !== null &&
      hasAnyPermission(primaryRole, ["driver.approve", "driver.reject", "driver.activate"]),
    // Role-based rather than permission-based — see UserCapabilities'
    // doc comment: Site Content CMS has no dedicated permission yet.
    canManageContent: primaryRole !== null && CONTENT_MANAGEMENT_ROLES.has(primaryRole),
    canDispatch: primaryRole !== null && hasAnyPermission(primaryRole, ["trip.assign"]),
  };
}
