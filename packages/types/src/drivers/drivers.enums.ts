/**
 * Driver recruitment pipeline. A `DriverApplication` moves through these
 * statuses linearly (with Rejected/Archived as terminal exits at several
 * points). See `packages/utils/src/drivers/workflow.ts` for the transition
 * rules and `docs/driver-management.md` for the full diagram.
 */
export enum DriverApplicationStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  DOCUMENTS_PENDING = "documents_pending",
  BACKGROUND_CHECK = "background_check",
  VEHICLE_INSPECTION = "vehicle_inspection",
  INTERVIEW = "interview",
  APPROVED = "approved",
  REJECTED = "rejected",
  ACTIVATED = "activated",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

/**
 * Operational status of an activated driver account (post-`Activated`
 * application). Distinct from `DriverApplicationStatus`, which only tracks
 * the recruitment pipeline.
 */
export enum DriverAccountStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  TERMINATED = "terminated",
}

export enum DriverDocumentType {
  DRIVERS_LICENSE = "drivers_license",
  VEHICLE_INSURANCE = "vehicle_insurance",
  VEHICLE_REGISTRATION = "vehicle_registration",
  BACKGROUND_CHECK = "background_check",
  PROFILE_PHOTO = "profile_photo",
}

/**
 * Admin Driver Application Review Workspace sprint — per-document review
 * outcome, distinct from the application's own `DriverApplicationStatus`
 * (which tracks the overall pipeline stage, not any one document). Kept as
 * its own small enum rather than folding into `DriverApplicationStatus`
 * per "do NOT create a second application-status system" — this reviews a
 * document, not the application.
 */
export enum DocumentReviewStatus {
  PENDING = "pending",
  VALID = "valid",
  REJECTED = "rejected",
  REPLACEMENT_REQUIRED = "replacement_required",
  EXPIRED = "expired",
}

/**
 * Real-time shift/presence status (Sprint 4, Part 1) — distinct from
 * `DriverAccountStatus`, which is the admin-driven standing of the
 * account itself. A driver toggles their own `DriverAvailabilityStatus`
 * shift-to-shift; only an admin action (`DriversRepository.suspend()`)
 * changes `DriverAccountStatus`. The two are kept in sync one direction
 * only: suspending the account forces availability to `SUSPENDED` too
 * (see `packages/utils/src/drivers/availability.ts`), but going offline
 * for the night never touches the account status.
 *
 * See `packages/utils/src/drivers/availability.ts` for the transition
 * rules and docs/driver-presence.md for the full diagram.
 */
export enum DriverAvailabilityStatus {
  OFFLINE = "offline",
  ONLINE = "online",
  AVAILABLE = "available",
  BUSY = "busy",
  ON_TRIP = "on_trip",
  ON_BREAK = "on_break",
  SUSPENDED = "suspended",
  INACTIVE = "inactive",
}
