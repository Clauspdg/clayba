import { ExperienceState, type NavigationProfile } from "@the-ride/types";

import { isDriverApplicantState, isDriverState, isStaffState } from "./resolveExperienceState";

/**
 * Centralized navigation-profile data (UX-1 sprint, Part 8; updated by
 * UX-3 — Dedicated Driver Space). The *data* only (translation keys + real
 * existing routes), not JSX. Consuming components (`SiteHeader`, the
 * driver/passenger shells) render this and call `t(item.labelKey)`
 * themselves; nothing here imports React or an i18n library, keeping it as
 * trivially testable as the rest of this module.
 *
 * Driver-applicant states still resolve to a single entry pointing at
 * `/become-a-driver` — that one lifecycle-aware page is still the only
 * place those states have anything to show. A real driver (active,
 * suspended, or inactive) now points at `/driver` instead — the dedicated
 * Driver Space, not the applicant page. Staff get an empty profile: "use
 * Admin navigation only" (Part 12) — `apps/web` has no admin nav to lend
 * them.
 */
export function resolveNavigationProfile(state: ExperienceState): NavigationProfile {
  if (state === ExperienceState.GUEST) {
    return [
      { labelKey: "nav.about", href: "/about" },
      { labelKey: "nav.safety", href: "/safety" },
      { labelKey: "nav.services", href: "/services" },
      { labelKey: "nav.becomeDriver", href: "/become-a-driver" },
      { labelKey: "nav.faq", href: "/faq" },
      { labelKey: "nav.contact", href: "/contact" },
    ];
  }

  if (state === ExperienceState.PASSENGER) {
    return [
      { labelKey: "passengerNav.bookRide", href: "/book" },
      { labelKey: "passengerNav.rideHistory", href: "/rides" },
      { labelKey: "passengerNav.savedPlaces", href: "/saved-places" },
      { labelKey: "passengerNav.notifications", href: "/notifications" },
      { labelKey: "passengerNav.support", href: "/support" },
    ];
  }

  if (isDriverState(state)) {
    return [
      { labelKey: "nav.driverSpace", href: "/driver" },
      { labelKey: "passengerNav.support", href: "/support" },
    ];
  }

  if (isDriverApplicantState(state)) {
    return [
      { labelKey: "nav.myApplication", href: "/become-a-driver" },
      { labelKey: "passengerNav.support", href: "/support" },
    ];
  }

  if (isStaffState(state)) {
    return [];
  }

  return [];
}
