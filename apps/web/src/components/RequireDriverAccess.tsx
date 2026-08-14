"use client";

import { Button, ErrorState, LoadingState, useTranslation } from "@the-ride/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { useUserExperience } from "@/hooks/useUserExperience";

import { RequireAuth } from "./RequireAuth";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 2 — the SINGLE access-policy
 * check for every `/driver/*` page, so no page re-derives its own
 * role/status booleans. Reads `lifecycleState.stage` from the canonical
 * UX-1 resolver (`useUserExperience()`) rather than inventing a second
 * check: `"active"`/`"suspended"`/`"inactive"` all imply a real
 * `drivers/{uid}` record exists (see `resolveDriverLifecycleState`), so all
 * three get into the Driver Space shell — suspended/inactive render their
 * own restricted view *inside* it (Parts 16-17), they are not turned away
 * at the door. Everyone else (plain passenger, driver applicant, staff,
 * guest) is redirected to their own real `preferredLandingRoute` — the
 * same centralized route `getPreferredLandingRoute` already computes for
 * login/homepage redirects, so a driver applicant lands on
 * `/become-a-driver` and a staff member lands on `/`, never a raw 404 or a
 * generic "access denied."
 */
export function RequireDriverAccess({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DriverLifecycleGate>{children}</DriverLifecycleGate>
    </RequireAuth>
  );
}

function DriverLifecycleGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { loading, error, lifecycleState, preferredLandingRoute, refresh } = useUserExperience();

  const isDriverJourney =
    lifecycleState?.stage === "active" ||
    lifecycleState?.stage === "suspended" ||
    lifecycleState?.stage === "inactive";

  // A real DEV run caught a genuine race: Firebase's `onIdTokenChanged`
  // (which `useAuth()`'s session listener is built on) fires more than
  // once on a fresh sign-in — an initial firing, then a second shortly
  // after as the token settles — and `useExperienceInputs` re-fetches
  // `driverApplication`/`driver` on each firing (it depends on `session`).
  // The FIRST fetch can transiently fail ("Missing or insufficient
  // permissions") or simply race ahead of Firestore recognizing the new
  // auth session, resolving `loading: false` with `driver: null` for a
  // brief window before the second, correct fetch lands a moment later.
  // Redirecting instantly on that first `loading: false` — as the code
  // used to — sent a real active/suspended/inactive driver away from their
  // own Driver Space before the correct data ever arrived. Debouncing the
  // redirect lets a `loading: true` that reappears within the window
  // (the second fetch starting) cancel the premature decision; a
  // genuinely-not-a-driver user still redirects, just ~600ms later.
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }
    if (loading || error || isDriverJourney) return;
    redirectTimer.current = setTimeout(() => {
      router.replace(preferredLandingRoute ?? "/");
    }, 1200);
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [loading, error, isDriverJourney, preferredLandingRoute, router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <ErrorState
          title={t("common.error")}
          description={error}
          action={<Button onClick={refresh}>{t("common.retry")}</Button>}
        />
      </div>
    );
  }

  if (loading || !isDriverJourney) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  return <>{children}</>;
}
