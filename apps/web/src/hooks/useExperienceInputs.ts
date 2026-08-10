"use client";

import { webFirestore } from "@/lib/firebase-client";
import { findOwnApplication, getOwnDriverRecord } from "@the-ride/firebase/client";
import { useAuth } from "@the-ride/hooks";
import type { AuthClaims, Driver, DriverApplication } from "@the-ride/types";
import { useCallback, useEffect, useState } from "react";

export interface ExperienceInputsResult {
  /** `"loading"` while auth status or the Firestore fetch below is still resolving. */
  status: "loading" | "ready";
  claims: AuthClaims | null;
  driverApplication: DriverApplication | null;
  driver: Driver | null;
  error: string | null;
  /** Re-fetches application/driver data — call after an action that changes lifecycle stage (submit, withdraw, resubmit). */
  refetch: () => void;
}

/**
 * The single place `apps/web` fetches the raw data every experience
 * resolver needs (UX-1 sprint, Part 6) — the signed-in user's Firebase Auth
 * claims plus their own `driverApplications` and `drivers` records. Called
 * exactly once, by `UserExperienceProvider` (UX-2 sprint audit fix) —
 * every consumer reads the already-resolved result from
 * `useUserExperience()`'s context instead of re-running this fetch.
 */
export function useExperienceInputs(): ExperienceInputsResult {
  const { status: authStatus, session } = useAuth();
  const [driverApplication, setDriverApplication] = useState<DriverApplication | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const refetch = useCallback(() => setRefetchToken((n) => n + 1), []);

  useEffect(() => {
    if (authStatus !== "authenticated" || !session) {
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
        console.error("[useExperienceInputs] failed to load application/driver data", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus, session, refetchToken]);

  if (authStatus === "loading") {
    return {
      status: "loading",
      claims: null,
      driverApplication: null,
      driver: null,
      error: null,
      refetch,
    };
  }

  if (authStatus === "unauthenticated" || !session) {
    return {
      status: "ready",
      claims: null,
      driverApplication: null,
      driver: null,
      error: null,
      refetch,
    };
  }

  if (dataLoading) {
    return { status: "loading", claims: session.claims, driverApplication, driver, error, refetch };
  }

  return { status: "ready", claims: session.claims, driverApplication, driver, error, refetch };
}
