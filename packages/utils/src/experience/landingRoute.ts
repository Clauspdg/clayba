import { ExperienceState } from "@the-ride/types";

/**
 * Centralized landing-route resolution (UX-1 sprint, Part 9) — every real,
 * already-existing route in `apps/web`. No dead routes: driver-applicant
 * and driver states land on `/become-a-driver` (the one lifecycle-aware
 * page that branches on their real status), not a nonexistent
 * `/become-a-driver/status` or `/driver` page. Staff states resolve to
 * `/` — `apps/web` has no admin surface to send them to; the real Admin
 * app is a separate deployment this function has no route into.
 */
export function getPreferredLandingRoute(state: ExperienceState): string {
  switch (state) {
    case ExperienceState.GUEST:
      return "/";
    case ExperienceState.PASSENGER:
      return "/dashboard";
    case ExperienceState.DRIVER_APPLICANT_DRAFT:
    case ExperienceState.DRIVER_APPLICANT_SUBMITTED:
    case ExperienceState.DRIVER_APPLICANT_DOCUMENTS_PENDING:
    case ExperienceState.DRIVER_APPLICANT_BACKGROUND_CHECK:
    case ExperienceState.DRIVER_APPLICANT_VEHICLE_INSPECTION:
    case ExperienceState.DRIVER_APPLICANT_INTERVIEW:
    case ExperienceState.DRIVER_APPLICANT_ACTION_REQUIRED:
    case ExperienceState.DRIVER_APPLICANT_APPROVED:
    case ExperienceState.DRIVER_APPLICANT_REJECTED:
    case ExperienceState.DRIVER_ACTIVE:
    case ExperienceState.DRIVER_SUSPENDED:
    case ExperienceState.DRIVER_INACTIVE:
      return "/become-a-driver";
    case ExperienceState.ADMIN:
    case ExperienceState.SUPER_ADMIN:
    case ExperienceState.DISPATCHER:
    case ExperienceState.SUPPORT:
    case ExperienceState.CONTENT_MANAGER:
    case ExperienceState.MODERATOR:
      return "/";
  }
}
