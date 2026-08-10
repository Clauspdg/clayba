import { ExperienceState } from "@the-ride/types";

/**
 * Passenger → Driver entry point sprint, Part 1 — the Passenger Dashboard's
 * "Drive with The Ride" card CTA needs its own (longer, more descriptive)
 * label per lifecycle stage, distinct from the compact header CTA
 * (`getDriverCtaLabelKey`) and the sidebar nav label
 * (`getDriverNavLabelKey`) below — three different UI surfaces, three
 * appropriately-sized copies of the same underlying state, never three
 * different ways of deciding what that state IS.
 */
export function getDriverDashboardCardCtaLabelKey(state: ExperienceState): string {
  switch (state) {
    case ExperienceState.DRIVER_APPLICANT_DRAFT:
      return "becomeDriver.entryPoint.cardCtaContinue";
    case ExperienceState.DRIVER_APPLICANT_APPROVED:
      return "becomeDriver.entryPoint.cardCtaViewApproval";
    case ExperienceState.DRIVER_ACTIVE:
      return "becomeDriver.entryPoint.cardCtaOpenSpace";
    case ExperienceState.DRIVER_SUSPENDED:
    case ExperienceState.DRIVER_INACTIVE:
      return "becomeDriver.entryPoint.cardCtaAccountStatus";
    case ExperienceState.DRIVER_APPLICANT_SUBMITTED:
    case ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING:
    case ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK:
    case ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION:
    case ExperienceState.DRIVER_APPLICANT_INTERVIEW:
    case ExperienceState.DRIVER_APPLICANT_ACTION_REQUIRED:
    case ExperienceState.DRIVER_APPLICANT_REJECTED:
      return "becomeDriver.entryPoint.cardCtaViewStatus";
    default:
      return "becomeDriver.entryPoint.cardCtaApply";
  }
}

/** Same per-state mapping as the card CTA above, for the card's body copy (Part 5 — "useful summary information when available"). */
export function getDriverDashboardCardBodyLabelKey(state: ExperienceState): string {
  switch (state) {
    case ExperienceState.DRIVER_APPLICANT_DRAFT:
      return "becomeDriver.entryPoint.cardBodyDraft";
    case ExperienceState.DRIVER_APPLICANT_APPROVED:
      return "becomeDriver.entryPoint.cardBodyApproved";
    case ExperienceState.DRIVER_ACTIVE:
      return "becomeDriver.entryPoint.cardBodyActive";
    case ExperienceState.DRIVER_SUSPENDED:
    case ExperienceState.DRIVER_INACTIVE:
      return "becomeDriver.entryPoint.cardBodySuspended";
    case ExperienceState.DRIVER_APPLICANT_REJECTED:
      return "becomeDriver.entryPoint.cardBodyRejected";
    case ExperienceState.DRIVER_APPLICANT_SUBMITTED:
    case ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING:
    case ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK:
    case ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION:
    case ExperienceState.DRIVER_APPLICANT_INTERVIEW:
    case ExperienceState.DRIVER_APPLICANT_ACTION_REQUIRED:
      return "becomeDriver.entryPoint.cardBodyUnderReview";
    default:
      return "becomeDriver.entryPoint.cardBodyDefault";
  }
}

/** Passenger sidebar's contextual Driver nav item label (Part 2) — its own, still-shorter copy than the dashboard card. */
export function getDriverNavLabelKey(state: ExperienceState): string {
  switch (state) {
    case ExperienceState.DRIVER_APPLICANT_DRAFT:
      return "becomeDriver.entryPoint.navContinue";
    case ExperienceState.DRIVER_APPLICANT_APPROVED:
      return "becomeDriver.entryPoint.navApproval";
    case ExperienceState.DRIVER_ACTIVE:
      return "becomeDriver.entryPoint.navSpace";
    case ExperienceState.DRIVER_SUSPENDED:
    case ExperienceState.DRIVER_INACTIVE:
      return "becomeDriver.entryPoint.navAccountStatus";
    case ExperienceState.DRIVER_APPLICANT_SUBMITTED:
    case ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING:
    case ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK:
    case ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION:
    case ExperienceState.DRIVER_APPLICANT_INTERVIEW:
    case ExperienceState.DRIVER_APPLICANT_ACTION_REQUIRED:
    case ExperienceState.DRIVER_APPLICANT_REJECTED:
      return "becomeDriver.entryPoint.navStatus";
    default:
      return "becomeDriver.entryPoint.navApply";
  }
}
