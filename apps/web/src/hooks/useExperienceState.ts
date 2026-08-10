"use client";

import type { Driver, DriverApplication, ExperienceState } from "@the-ride/types";
import { resolveExperienceState } from "@the-ride/utils";

import { useExperienceInputs } from "./useExperienceInputs";

export interface ExperienceStateResult {
  /** `null` while `loading` is true — never trust `state` alone without checking `loading` first. */
  state: ExperienceState | null;
  loading: boolean;
  error: string | null;
  driverApplication: DriverApplication | null;
  driver: Driver | null;
  /** Re-fetches application/driver data — call after an action that changes lifecycle stage (submit, withdraw, resubmit). */
  refetch: () => void;
}

/**
 * The flat, pre-UX-1 experience hook — kept as-is (same public shape) so
 * existing consumers (SiteHeader, homepage, become-a-driver) keep working
 * unmodified. Internally it now shares its data-fetching with
 * `useUserExperience` via `useExperienceInputs` (UX-1 sprint, Part 6), so
 * there is still exactly one resolver chain, just two shaped views onto
 * it. New consumers that need roles/capabilities/routing/nav data should
 * use `useUserExperience` instead — this hook is not being extended
 * further.
 */
export function useExperienceState(): ExperienceStateResult {
  const { status, claims, driverApplication, driver, error, refetch } = useExperienceInputs();

  if (status === "loading") {
    return { state: null, loading: true, error, driverApplication, driver, refetch };
  }

  const state = resolveExperienceState({ claims, driverApplication, driver });

  return { state, loading: false, error, driverApplication, driver, refetch };
}
