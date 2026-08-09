/**
 * Canonical user experience state (User State Experience sprint, Part 1).
 *
 * The single source of truth for "what should this person see right now" —
 * derived from real Firebase Auth custom claims + Firestore data
 * (`resolveExperienceState` in `@the-ride/utils`), never duplicated ad hoc
 * per page. See that function's doc comment for exactly how each value is
 * derived, and docs/experience-state.md for the full state diagram.
 */
export enum ExperienceState {
  GUEST = "guest",
  AUTHENTICATED_PASSENGER = "authenticated_passenger",

  DRIVER_APPLICANT_DRAFT = "driver_applicant_draft",
  DRIVER_APPLICANT_SUBMITTED = "driver_applicant_submitted",
  DRIVER_APPLICANT_UNDER_REVIEW = "driver_applicant_under_review",
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

  DRIVER_ACTIVATED = "driver_activated",
  DRIVER_SUSPENDED = "driver_suspended",
  /** Maps from `DriverAccountStatus.TERMINATED` — the closest fit among the requested states; a terminated driver is not a candidate for reactivation the way a suspended one is, but shares the "cannot go online" UX. */
  DRIVER_INACTIVE = "driver_inactive",

  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  DISPATCHER = "dispatcher",
  SUPPORT = "support",
  CONTENT_MANAGER = "content_manager",
}
