/**
 * Canonical user experience state (UX-1 sprint).
 *
 * The single source of truth for "what should this person see right now" —
 * derived from real Firebase Auth custom claims + Firestore data
 * (`resolveUserExperience` in `@the-ride/utils`), never duplicated ad hoc
 * per page. See that function's doc comment for exactly how each value is
 * derived, and docs/user-experience-model.md for the full model.
 *
 * This is the *effective experience* — a flat, UI-facing value. It is
 * intentionally kept separate from `Role` (`@the-ride/types`'s
 * authentication module, the actual Firebase Auth custom claim / RBAC
 * value) and from a user's driver-lifecycle progress
 * (`DriverLifecycleState`, also in this module): a Passenger progressing
 * through a driver application is still fundamentally a Passenger by
 * `Role`, and an activated Driver retains passenger capability even
 * though their effective experience is driver-first. `resolveUserExperience`
 * exposes all three (`effectiveExperience`, `roles`/`primaryRole`,
 * `lifecycleState`) rather than collapsing them into one value.
 */
export enum ExperienceState {
  GUEST = "guest",
  PASSENGER = "passenger",

  DRIVER_APPLICANT_DRAFT = "driver_applicant_draft",
  DRIVER_APPLICANT_SUBMITTED = "driver_applicant_submitted",
  DRIVER_APPLICANT_DOCUMENTS_PENDING = "driver_applicant_documents_pending",
  DRIVER_APPLICANT_BACKGROUND_CHECK = "driver_applicant_background_check",
  DRIVER_APPLICANT_VEHICLE_INSPECTION = "driver_applicant_vehicle_inspection",
  DRIVER_APPLICANT_INTERVIEW = "driver_applicant_interview",
  /**
   * Reserved for when an admin requests corrections/additional documents.
   * Not yet reachable: `DriverApplicationStatus` has no "changes requested"
   * status and no admin action sets one (see `DRIVER_APPLICATION_TRANSITIONS`
   * in `@the-ride/types`'s drivers.constants.ts) — that's Admin Document
   * Review workspace follow-up work. Defined now so consuming UI can build
   * against the full state contract without a breaking enum change later.
   */
  DRIVER_APPLICANT_ACTION_REQUIRED = "driver_applicant_action_required",
  DRIVER_APPLICANT_APPROVED = "driver_applicant_approved",
  DRIVER_APPLICANT_REJECTED = "driver_applicant_rejected",

  DRIVER_ACTIVE = "driver_active",
  DRIVER_SUSPENDED = "driver_suspended",
  /** Maps from `DriverAccountStatus.TERMINATED` — the closest fit among the requested states; a terminated driver is not a candidate for reactivation the way a suspended one is, but shares the "cannot go online" UX. */
  DRIVER_INACTIVE = "driver_inactive",

  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  DISPATCHER = "dispatcher",
  SUPPORT = "support",
  CONTENT_MANAGER = "content_manager",
  /**
   * Not in this sprint's example state list, but a real, reachable `Role`
   * in the existing RBAC model (`apps/admin`'s `RoleGuard` already admits
   * it into the dashboard shell — see `ADMIN_DASHBOARD_ROLES`). Adding it
   * here is exactly the "audit the existing architecture, map cleanly"
   * correction Part 4 asks for: without it, a moderator's claim fell
   * through this resolver's switch entirely and silently resolved to
   * PASSENGER, contradicting what the Admin app already allows.
   */
  MODERATOR = "moderator",
}
