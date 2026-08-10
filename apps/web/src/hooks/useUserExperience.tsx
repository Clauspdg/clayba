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
import { createContext, useContext, type ReactNode } from "react";

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

function computeResult(input: ReturnType<typeof useExperienceInputs>): UserExperienceResult {
  const { status, claims, driverApplication, driver, error, refetch } = input;

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

const UserExperienceContext = createContext<UserExperienceResult | null>(null);

/**
 * UX-2 sprint audit fix — `useUserExperience()` is now called from four
 * places that all mount together on every page (`SiteHeader` lives in the
 * root layout, plus whichever page itself also calls it: homepage, login,
 * become-a-driver). Before this provider existed, each call independently
 * re-ran `useExperienceInputs()`'s Firestore fetch (the user's own
 * `driverApplications` + `drivers` docs), so every page load did the same
 * two reads twice over for no reason. This is exactly the "a real
 * cross-tree consumer needs it" trigger `useUserExperience`'s original doc
 * comment said to wait for — fetches once here, in the root layout, and
 * every consumer below it reads the same resolved value from context.
 */
export function UserExperienceProvider({ children }: { children: ReactNode }) {
  const inputs = useExperienceInputs();
  const value = computeResult(inputs);
  return <UserExperienceContext.Provider value={value}>{children}</UserExperienceContext.Provider>;
}

/**
 * The canonical UX-1 web hook (Part 6) for "what should this person see
 * right now." Reads from `UserExperienceProvider` (mounted once in
 * `app/layout.tsx`) rather than fetching independently; throws outside
 * that provider, matching every other context hook in this codebase
 * (`useAuth`, `useTheme`, `useTranslation`).
 */
export function useUserExperience(): UserExperienceResult {
  const context = useContext(UserExperienceContext);
  if (!context) {
    throw new Error("useUserExperience must be used within a UserExperienceProvider");
  }
  return context;
}
