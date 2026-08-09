"use client";

import { webFirestore } from "@/lib/firebase-client";
import { findOwnApplication, getOwnDriverRecord } from "@the-ride/firebase/client";
import { useAuth } from "@the-ride/hooks";
import { ExperienceState, type Driver, type DriverApplication } from "@the-ride/types";
import { resolveExperienceState } from "@the-ride/utils";
import { useCallback, useEffect, useState } from "react";

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
 * The one place `apps/web` calls `resolveExperienceState()` from (User
 * State Experience sprint, Part 1) — fetches the two pieces of Firestore
 * data the resolver needs (the signed-in user's own `driverApplications`
 * and `drivers` records) and combines them with `useAuth()`'s claims.
 * Every personalized surface (SiteHeader, homepage, become-a-driver) uses
 * this hook instead of independently querying Firestore and re-deriving
 * its own status logic.
 */
export function useExperienceState(): ExperienceStateResult {
  const { status, session } = useAuth();
  const [driverApplication, setDriverApplication] = useState<DriverApplication | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const refetch = useCallback(() => setRefetchToken((n) => n + 1), []);

  useEffect(() => {
    if (status !== "authenticated" || !session) {
      setDriverApplication(null);
      setDriver(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setDataLoading(true);
    setError(null);

    Promise.all([
      findOwnApplication(webFirestore, session.uid),
      getOwnDriverRecord(webFirestore, session.uid),
    ])
      .then(([application, driverRecord]) => {
        if (cancelled) return;
        setDriverApplication(application);
        setDriver(driverRecord);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[useExperienceState] failed to load application/driver data", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session, refetchToken]);

  if (status === "loading") {
    return {
      state: null,
      loading: true,
      error: null,
      driverApplication: null,
      driver: null,
      refetch,
    };
  }

  if (status === "unauthenticated" || !session) {
    return {
      state: ExperienceState.GUEST,
      loading: false,
      error: null,
      driverApplication: null,
      driver: null,
      refetch,
    };
  }

  if (dataLoading) {
    return { state: null, loading: true, error, driverApplication, driver, refetch };
  }

  const state = resolveExperienceState({
    claims: session.claims,
    driverApplication,
    driver,
  });

  return { state, loading: false, error, driverApplication, driver, refetch };
}
