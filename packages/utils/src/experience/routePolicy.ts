import { ExperienceState } from "@the-ride/types";

import { getPreferredLandingRoute } from "./landingRoute";
import { isDriverApplicantState, isStaffState } from "./resolveExperienceState";

/**
 * Route categories this policy understands (UX-1 sprint, Part 7). Not
 * every route in the app needs to appear here yet — only the ones this
 * sprint's example transitions cover; add a category when a page actually
 * needs to consult this policy, per "Do not implement all visual
 * redirects yet if that belongs to UX-2/3, but define the policy now."
 */
export type RouteKind =
  | "public"
  | "passenger-dashboard"
  | "become-a-driver"
  | "driver-home"
  | "go-online"
  | "admin-shell";

export interface RouteAccessResult {
  allowed: boolean;
  /** Set whenever `allowed` is false, or when access is technically allowed but the UX should steer the user elsewhere (e.g. an activated driver landing on the application marketing page). */
  redirectTo?: string;
  reason?: string;
}

/**
 * Central route-access policy (Part 7) — evaluates whether a given
 * experience state should reach a route category, and where to send it
 * instead when not. Callers (route guards, layouts) apply the actual
 * redirect; this function only decides the policy.
 */
export function evaluateRouteAccess(
  state: ExperienceState,
  routeKind: RouteKind,
): RouteAccessResult {
  switch (routeKind) {
    case "public":
      return { allowed: true };

    case "passenger-dashboard":
      if (state === ExperienceState.GUEST) {
        return { allowed: false, redirectTo: "/login", reason: "Sign in required." };
      }
      return { allowed: true };

    case "become-a-driver":
      if (state === ExperienceState.DRIVER_ACTIVE) {
        // An activated driver must not see application marketing again,
        // let alone accidentally start a second application (Part 3/9).
        return {
          allowed: true,
          redirectTo: getPreferredLandingRoute(state),
          reason:
            "Already an activated driver — showing the driver dashboard instead of application marketing.",
        };
      }
      return { allowed: true };

    case "driver-home":
      if (state === ExperienceState.DRIVER_ACTIVE) {
        return { allowed: true };
      }
      return {
        allowed: false,
        redirectTo: getPreferredLandingRoute(state),
        reason: isDriverApplicantState(state)
          ? "Not yet activated — showing application status instead."
          : "No driver record — showing the Become a Driver page instead.",
      };

    case "go-online":
      if (state === ExperienceState.DRIVER_ACTIVE) {
        return { allowed: true };
      }
      if (state === ExperienceState.DRIVER_SUSPENDED || state === ExperienceState.DRIVER_INACTIVE) {
        return { allowed: false, reason: "Driver account is not in good standing." };
      }
      return { allowed: false, reason: "Not an activated driver." };

    case "admin-shell":
      if (isStaffState(state)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        redirectTo: state === ExperienceState.GUEST ? "/login" : "/",
        reason: "Admin work stays in the Admin app; this role has no admin capability.",
      };
  }
}
