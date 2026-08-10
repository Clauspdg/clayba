"use client";

import type {
  Driver,
  DriverApplication,
  DriverLifecycleState,
  ExperienceState,
  NavigationProfile,
  Role,
  UserCapabilities,
} from "@the-ride/types";
import { resolveUserExperience } from "@the-ride/utils";

import { useExperienceInputs } from "./useExperienceInputs";

export interface UserExperienceResult {
  /** `null` while `loading` is true — never trust these fields without checking `loading` first. */
  loading: boolean;
  error: string | null;
  experience: ExperienceState | null;
  roles: Role[];
  primaryRole: Role | null;
  lifecycleState: DriverLifecycleState | null;
  capabilities: UserCapabilities | null;
  preferredLandingRoute: string | null;
  navigationProfile: NavigationProfile;
  /** Non-null when the underlying data is in a recoverable/inconsistent state (Part 11) — surface it, never silently grant or deny access on it. */
  blockingReason: string | null;
  currentApplication: DriverApplication | null;
  driver: Driver | null;
  /** Re-fetches application/driver data — call after an action that changes lifecycle stage (submit, withdraw, resubmit). */
  refresh: () => void;
}

/**
 * The canonical UX-1 web hook (Part 6) — the rich sibling of
 * `useExperienceState`. Shares the same data-fetching (`useExperienceInputs`)
 * and calls `resolveUserExperience`, which itself wraps
 * `resolveExperienceState`, so this is not a second role/status system —
 * it is the same resolver chain, viewed through the fuller
 * `ResolvedExperience` shape.
 *
 * Not yet wired into any page (per UX-1's "DO NOT redesign pages yet");
 * this hook exists so UX-2/3 route guards and navigation can consume a
 * single source of truth for capabilities/routing/nav data once that work
 * begins. A `UserExperienceProvider` (context wrapper around this hook) is
 * deliberately not added yet either, since nothing consumes it — add one
 * only when a real cross-tree consumer needs it, per Part 6's "does not
 * require a full page reload where reactive."
 */
export function useUserExperience(): UserExperienceResult {
  const { status, claims, driverApplication, driver, error, refetch } = useExperienceInputs();

  if (status === "loading") {
    return {
      loading: true,
      error,
      experience: null,
      roles: [],
      primaryRole: null,
      lifecycleState: null,
      capabilities: null,
      preferredLandingRoute: null,
      navigationProfile: [],
      blockingReason: null,
      currentApplication: driverApplication,
      driver,
      refresh: refetch,
    };
  }

  const resolved = resolveUserExperience({ claims, driverApplication, driver });

  return {
    loading: false,
    error,
    experience: resolved.effectiveExperience,
    roles: resolved.roles,
    primaryRole: resolved.primaryRole,
    lifecycleState: resolved.lifecycleState,
    capabilities: resolved.capabilities,
    preferredLandingRoute: resolved.preferredLandingRoute,
    navigationProfile: resolved.navigationProfile,
    blockingReason: resolved.blockingReason,
    currentApplication: driverApplication,
    driver,
    refresh: refetch,
  };
}
