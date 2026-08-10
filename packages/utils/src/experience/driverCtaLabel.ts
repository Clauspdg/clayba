import { ExperienceState } from "@the-ride/types";

/**
 * UX-2 sprint, Part 14 — the "Become a Driver" CTA's label must say
 * something true for whichever lifecycle stage the user is actually in
 * (draft/submitted/approved/active/suspended all route to the same
 * `/become-a-driver` page, so the label is the only thing that changes).
 * Pure and colocated with the rest of the experience resolver so it's
 * covered by the same test suite instead of adding component-level tests
 * to `apps/web`, which has no test harness.
 */
export function getDriverCtaLabelKey(state: ExperienceState): string {
  switch (state) {
    case ExperienceState.DRIVER_APPLICANT_DRAFT:
      return "nav.continueApplication";
    case ExperienceState.DRIVER_APPLICANT_APPROVED:
      return "nav.viewApproval";
    case ExperienceState.DRIVER_ACTIVE:
      return "nav.driverStatus";
    case ExperienceState.DRIVER_SUSPENDED:
    case ExperienceState.DRIVER_INACTIVE:
      return "nav.accountStatus";
    default:
      return "nav.myApplication";
  }
}
