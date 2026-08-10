import { DriverApplicationStatus, Role, type ResolvedExperience } from "@the-ride/types";

import { resolveCapabilities } from "./capabilities";
import { getPreferredLandingRoute } from "./landingRoute";
import { resolveDriverLifecycleState } from "./lifecycleState";
import { resolveNavigationProfile } from "./navigationProfile";
import { resolveExperienceState, type ExperienceInputs } from "./resolveExperienceState";

const STAFF_ROLES: ReadonlySet<Role> = new Set([
  Role.ADMIN,
  Role.SUPER_ADMIN,
  Role.DISPATCHER,
  Role.SUPPORT,
  Role.CONTENT_MANAGER,
  Role.MODERATOR,
]);

function resolveRoles(input: ExperienceInputs): { roles: Role[]; primaryRole: Role | null } {
  const { claims, driver } = input;
  if (!claims) return { roles: [], primaryRole: null };
  if (STAFF_ROLES.has(claims.role)) return { roles: [claims.role], primaryRole: claims.role };

  // Every non-staff, authenticated user is a Passenger by role — driver
  // application/activation is a lifecycle overlay on top of that, not a
  // role that replaces it (Part 1: "An activated Driver may still retain
  // Passenger capability"). `claims.role` itself is effectively always
  // "passenger" in this codebase (see `resolveExperienceState`'s doc
  // comment on why the driver claim is never actually set), so `driver`
  // is the only real signal for adding the Driver role.
  const roles: Role[] = [Role.PASSENGER];
  let primaryRole: Role = Role.PASSENGER;
  if (driver) {
    roles.push(Role.DRIVER);
    primaryRole = Role.DRIVER;
  }
  return { roles, primaryRole };
}

/**
 * Detects genuinely broken data states from the resolver's own inputs
 * (UX-1 sprint, Part 11) — NOT normal lifecycle stages like "suspended"
 * or "under review", which have their own valid UI. Deliberately does
 * NOT fetch additional data (e.g. `users/{uid}` to cross-check against
 * `claims.role`) — this stays a pure function over what's already
 * fetched; see docs/user-experience-model.md's "Inconsistent state
 * policy" for why that specific check is out of scope for this pass.
 */
function detectInconsistency(input: ExperienceInputs): string | null {
  const { driverApplication, driver } = input;

  if (driverApplication?.status === DriverApplicationStatus.ACTIVATED && !driver) {
    return "This application is marked activated, but no driver record exists yet. This is usually temporary — if it persists, contact support.";
  }
  if (driver && !driverApplication) {
    return "A driver record exists without a linked application. Contact support.";
  }
  return null;
}

/**
 * The single entry point for "what should this person see right now"
 * (UX-1 sprint, Part 3) — composes the flat `resolveExperienceState`
 * result with roles/lifecycle/capabilities/routing/navigation/
 * consistency. Pure and framework-agnostic like every function it calls;
 * `apps/web/src/hooks/useExperienceState.ts` is the only place that
 * fetches the real Firebase Auth claims + Firestore data this needs and
 * calls this function with them.
 */
export function resolveUserExperience(input: ExperienceInputs): ResolvedExperience {
  const effectiveExperience = resolveExperienceState(input);
  const { roles, primaryRole } = resolveRoles(input);

  return {
    effectiveExperience,
    roles,
    primaryRole,
    lifecycleState: resolveDriverLifecycleState(input),
    capabilities: resolveCapabilities(effectiveExperience, primaryRole),
    preferredLandingRoute: getPreferredLandingRoute(effectiveExperience),
    navigationProfile: resolveNavigationProfile(effectiveExperience),
    blockingReason: detectInconsistency(input),
  };
}
