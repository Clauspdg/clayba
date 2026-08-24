import { getOrCreatePassengerProfile } from "@the-ride/firebase/client";
import { useAuth } from "@the-ride/hooks";
import type { PassengerProfile } from "@the-ride/types";
import { useEffect, useState } from "react";

import { passengerFirestore } from "@/lib/firebase-client";

/**
 * The passenger app's equivalent of CLAYBA Driver's `useDriverSession` —
 * the real `passengers/{uid}` record (never a local flag), created on
 * first use via `getOrCreatePassengerProfile` (same function the web app's
 * Saved Places page uses to guarantee the parent doc exists before writing
 * subcollections under it).
 */
export function usePassengerSession() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<PassengerProfile | null | undefined>(undefined);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    getOrCreatePassengerProfile(passengerFirestore, session.uid)
      .then((record) => {
        if (!cancelled) setProfile(record);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  return { session, profile };
}
