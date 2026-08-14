import { ExperienceState } from "@the-ride/types";

/**
 * Centralized landing-route resolution (UX-1 sprint, Part 9; updated by
 * UX-3 — Dedicated Driver Space). Every real, already-existing route in
 * `apps/web`. No dead routes: driver-applicant states land on
 * `/become-a-driver` (the one lifecycle-aware page that branches on real
 * application status); a `drivers/{uid}` record (active, suspended, or
 * inactive/terminated) now lands on `/driver` instead — that dedicated
 * space renders its own restricted view for suspended/inactive rather than
 * `/become-a-driver` pretending to be an operational dashboard (see
 * `RequireDriverAccess` in `apps/web`). Staff states resolve to `/` —
 * `apps/web` has no admin surface to send them to; the real Admin app is a
 * separate deployment this function has no route into.
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
      return "/become-a-driver";
    case ExperienceState.DRIVER_ACTIVE:
    case ExperienceState.DRIVER_SUSPENDED:
    case ExperienceState.DRIVER_INACTIVE:
      return "/driver";
    case ExperienceState.ADMIN:
    case ExperienceState.SUPER_ADMIN:
    case ExperienceState.DISPATCHER:
    case ExperienceState.SUPPORT:
    case ExperienceState.CONTENT_MANAGER:
    case ExperienceState.MODERATOR:
      return "/";
  }
}
