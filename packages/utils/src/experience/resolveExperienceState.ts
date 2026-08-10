import {
  DriverAccountStatus,
  DriverApplicationStatus,
  ExperienceState,
  Role,
  type AuthClaims,
  type Driver,
  type DriverApplication,
} from "@the-ride/types";

export interface ExperienceInputs {
  claims: AuthClaims | null;
  driverApplication: DriverApplication | null;
  driver: Driver | null;
}

/**
 * Flat effective-experience resolver (UX-1 sprint, Part 2/4). The ONLY
 * place allowed to decide the single `ExperienceState` value for "what
 * should this person see right now." `resolveUserExperience` (this
 * module's richer entry point) wraps this and adds `roles`/`primaryRole`/
 * `lifecycleState`/`capabilities`/`preferredLandingRoute`/
 * `navigationProfile`/`blockingReason` on top — this function stays flat
 * and independently testable because most existing call sites only need
 * a single value to switch on.
 *
 * Pure and framework-agnostic: callers own fetching the three inputs
 * (Firebase Auth claims via `useAuth()`, the user's own `driverApplications`
 * doc, the user's own `drivers` doc) and pass already-resolved data in.
 *
 * Priority order (first match wins), matching how the underlying data is
 * actually structured rather than inventing a parallel status system:
 *   1. Staff role claims (admin/super_admin/dispatcher/support/
 *      content_manager/moderator) — a staff member's own passenger/driver
 *      history, if any, is irrelevant to which experience they get.
 *   2. A `drivers/{uid}` record — the real source of truth for "is this
 *      person an activated driver," set only by `activateApplication()`.
 *      Takes priority over the application doc because after activation
 *      the application's own status (`activated`) is a secondary signal;
 *      the driver record is authoritative. It also takes priority over
 *      any `driver` role *claim* — in this codebase, `activateApplication`
 *      never sets one (a confirmed, documented gap — see
 *      docs/user-experience-model.md's "Claim/Firestore consistency"), so
 *      gating on the claim would leave every real activated driver
 *      resolving as a plain passenger.
 *   3. A `driverApplications` doc for this user, branched by its real
 *      `DriverApplicationStatus` (see `DRIVER_APPLICATION_TRANSITIONS` in
 *      `@the-ride/types`'s drivers.constants.ts for the actual state
 *      machine this switch mirrors).
 *   4. Default: an authenticated user with neither is a plain passenger.
 */
export function resolveExperienceState(input: ExperienceInputs): ExperienceState {
  const { claims, driverApplication, driver } = input;

  if (!claims) return ExperienceState.GUEST;

  switch (claims.role) {
    case Role.SUPER_ADMIN:
      return ExperienceState.SUPER_ADMIN;
    case Role.ADMIN:
      return ExperienceState.ADMIN;
    case Role.DISPATCHER:
      return ExperienceState.DISPATCHER;
    case Role.SUPPORT:
      return ExperienceState.SUPPORT;
    case Role.CONTENT_MANAGER:
      return ExperienceState.CONTENT_MANAGER;
    case Role.MODERATOR:
      return ExperienceState.MODERATOR;
    default:
      break;
  }

  if (driver) {
    switch (driver.status) {
      case DriverAccountStatus.ACTIVE:
        return ExperienceState.DRIVER_ACTIVE;
      case DriverAccountStatus.SUSPENDED:
        return ExperienceState.DRIVER_SUSPENDED;
      case DriverAccountStatus.TERMINATED:
        return ExperienceState.DRIVER_INACTIVE;
    }
  }

  if (driverApplication) {
    switch (driverApplication.status) {
      case DriverApplicationStatus.DRAFT:
        return ExperienceState.DRIVER_APPLICANT_DRAFT;
      case DriverApplicationStatus.SUBMITTED:
        return ExperienceState.DRIVER_APPLICANT_SUBMITTED;
      case DriverApplicationStatus.DOCUMENTS_PENDING:
        return ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING;
      case DriverApplicationStatus.BACKGROUND_CHECK:
        return ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK;
      case DriverApplicationStatus.VEHICLE_INSPECTION:
        return ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION;
      case DriverApplicationStatus.INTERVIEW:
        return ExperienceState.DRIVER_APPLICANT_INTERVIEW;
      case DriverApplicationStatus.APPROVED:
        return ExperienceState.DRIVER_APPLICANT_APPROVED;
      case DriverApplicationStatus.REJECTED:
        return ExperienceState.DRIVER_APPLICANT_REJECTED;
      // ACTIVATED/SUSPENDED/ARCHIVED on the application itself should
      // always be accompanied by a `driver` record by then (handled
      // above); if data is ever inconsistent (e.g. mid-migration), fall
      // through to the passenger default below rather than guess.
      default:
        break;
    }
  }

  return ExperienceState.PASSENGER;
}

const DRIVER_APPLICANT_STATES: ReadonlySet<ExperienceState> = new Set([
  ExperienceState.DRIVER_APPLICANT_DRAFT,
  ExperienceState.DRIVER_APPLICANT_SUBMITTED,
  ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING,
  ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK,
  ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION,
  ExperienceState.DRIVER_APPLICANT_INTERVIEW,
  ExperienceState.DRIVER_APPLICANT_ACTION_REQUIRED,
  ExperienceState.DRIVER_APPLICANT_APPROVED,
  ExperienceState.DRIVER_APPLICANT_REJECTED,
]);

const DRIVER_STATES: ReadonlySet<ExperienceState> = new Set([
  ExperienceState.DRIVER_ACTIVE,
  ExperienceState.DRIVER_SUSPENDED,
  ExperienceState.DRIVER_INACTIVE,
]);

const STAFF_STATES: ReadonlySet<ExperienceState> = new Set([
  ExperienceState.ADMIN,
  ExperienceState.SUPER_ADMIN,
  ExperienceState.DISPATCHER,
  ExperienceState.SUPPORT,
  ExperienceState.CONTENT_MANAGER,
  ExperienceState.MODERATOR,
]);

/** Any state on the driver-application lifecycle (draft through rejected) — has NOT yet been activated. */
export function isDriverApplicantState(state: ExperienceState | null): boolean {
  return state !== null && DRIVER_APPLICANT_STATES.has(state);
}

/** Active, suspended, or inactive — has (or had) a real `drivers/{uid}` record. */
export function isDriverState(state: ExperienceState | null): boolean {
  return state !== null && DRIVER_STATES.has(state);
}

/** Either driver-applicant or driver-record states — i.e. "has ever started a driver journey." */
export function hasDriverJourney(state: ExperienceState | null): boolean {
  return isDriverApplicantState(state) || isDriverState(state);
}

export function isStaffState(state: ExperienceState | null): boolean {
  return state !== null && STAFF_STATES.has(state);
}
