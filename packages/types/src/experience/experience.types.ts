import type { DriverApplicationStatus } from "../drivers";
import type { Role } from "../authentication";
import type { ExperienceState } from "./experience.enums";

/**
 * A user's progress through the driver application/activation journey,
 * independent of `Role` (UX-1 sprint, Part 1: "ROLE and LIFECYCLE STATE
 * must be treated as separate concepts"). `stage: "none"` covers both a
 * plain passenger and a staff member — lifecycle only tracks the driver
 * journey, it says nothing about admin/support/etc. roles.
 */
export type DriverLifecycleState =
  | { stage: "none" }
  | { stage: "applicant"; status: DriverApplicationStatus }
  | { stage: "active" }
  | { stage: "suspended" }
  | { stage: "inactive" };

/**
 * Derived, centralized UI capabilities (Part 5) — every page checks these
 * instead of re-deriving role/status booleans itself. Each field's doc
 * comment states exactly what it's derived from so a reviewer can audit
 * correctness without reading the resolver implementation.
 */
export interface UserCapabilities {
  /** Any authenticated, non-guest user — an activated driver retains this. */
  canUsePassengerExperience: boolean;
  canBookRide: boolean;
  /** Same as `canBookRide` today — no distinct "schedule for later" booking flow exists yet; kept as its own field so the capability contract doesn't need a breaking change once one does. */
  canScheduleRide: boolean;
  /** True only for a plain Passenger with no application/driver record yet. */
  canStartDriverApplication: boolean;
  /** True only while `lifecycleState.stage === "applicant"` and its status is `draft`. */
  canResumeDriverApplication: boolean;
  /** True for any non-draft applicant stage (submitted through rejected) — there's a real application to check status on. */
  canViewDriverApplicationStatus: boolean;
  canAccessDriverHome: boolean;
  /** True only for an active (not suspended/inactive) driver. */
  canGoOnline: boolean;
  /** Mirrors `apps/admin`'s `RoleGuard.ADMIN_DASHBOARD_ROLES` — who may enter the Admin shell at all. */
  canViewAdmin: boolean;
  /** Derived from `ROLE_PERMISSIONS`' `driver.approve`/`driver.reject`/`driver.activate` grants. */
  canReviewDrivers: boolean;
  /** Role-based, not `ROLE_PERMISSIONS`-based — Site Content CMS access has no dedicated permission yet and is actually enforced by `firestore.rules`' `isAdmin()`, which does NOT recognize `content_manager` (see that role's doc comment in `authentication.enums.ts`). This reflects UI intent; it does not imply the write will succeed for a `content_manager`. */
  canManageContent: boolean;
  /** Derived from `ROLE_PERMISSIONS`' `trip.assign` grant. */
  canDispatch: boolean;
}

/**
 * One navigation entry — a translation key (never a literal string;
 * consumers call `t()`) plus a real, already-existing route. Named
 * `ExperienceNavItem` (not `NavigationItem`) to avoid colliding with the
 * unrelated CMS-configured `NavigationItem` type from `../site-content`
 * (the guest-facing public nav links an admin edits) — this is a
 * different concept: a state-derived nav entry, not admin-editable content.
 */
export interface ExperienceNavItem {
  labelKey: string;
  href: string;
}

export type NavigationProfile = ExperienceNavItem[];

/**
 * Full resolver output (Part 3). `resolveUserExperience` in
 * `@the-ride/utils` is the only place this is constructed.
 */
export interface ResolvedExperience {
  effectiveExperience: ExperienceState;
  /** Always includes the user's base claim role; includes `Role.DRIVER` in addition once they have an active driver record (an activated driver keeps passenger capability/role). Empty for GUEST. */
  roles: Role[];
  /** The single most relevant role for top-level routing/UI purposes — see `resolveUserExperience`'s doc comment for exactly how this differs from `roles[0]`. `null` for GUEST. */
  primaryRole: Role | null;
  lifecycleState: DriverLifecycleState;
  capabilities: UserCapabilities;
  preferredLandingRoute: string;
  navigationProfile: NavigationProfile;
  /**
   * Non-null only for a genuinely broken data state this resolver can
   * detect from its own inputs (e.g. an `activated` application with no
   * matching driver record) — NOT for normal, expected lifecycle states
   * like "suspended" or "under review", which are valid states with their
   * own UI, not errors. See docs/user-experience-model.md's "Inconsistent
   * state policy".
   */
  blockingReason: string | null;
}
