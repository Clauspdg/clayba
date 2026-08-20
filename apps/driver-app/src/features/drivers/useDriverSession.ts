import { driverFirestore } from "@/lib/firebase-client";
import {
  getOwnDriverRecord,
  getVehicle,
  subscribeOwnDriverRecord,
} from "@the-ride/firebase/client";
import { useAuth } from "@the-ride/hooks";
import { type Driver, type Vehicle } from "@the-ride/types";
import { useEffect, useState } from "react";

/**
 * CLAYBA P2 — the driver app's equivalent of the web app's
 * `useUserExperience()`, scoped to what the mobile screens actually need:
 * the real `drivers/{uid}` record (section 9 of the brief — "backend
 * reste source de vérité", never a local `isDriver = true` flag) and its
 * linked vehicle. `session.claims.role === Role.DRIVER` (already checked
 * by `login.tsx`/`index.tsx`) gets a user into the driver screens at all;
 * this hook is what those screens then render real status/vehicle/rating
 * from. Realtime via `subscribeOwnDriverRecord`, same function the web
 * Driver Space uses, so a status change from an admin action reflects
 * here too without a manual refresh.
 */
export function useDriverSession() {
  const { session } = useAuth();
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined);
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);

  useEffect(() => {
    if (!session) {
      setDriver(null);
      return;
    }
    let cancelled = false;
    const uid = session.uid;
    function refresh() {
      getOwnDriverRecord(driverFirestore, uid)
        .then((record) => !cancelled && setDriver(record))
        .catch(() => !cancelled && setDriver(null));
    }
    refresh();
    const unsubscribe = subscribeOwnDriverRecord(driverFirestore, uid, refresh);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [session]);

  useEffect(() => {
    if (!driver?.vehicleId) {
      setVehicle(driver === null ? null : undefined);
      return;
    }
    let cancelled = false;
    getVehicle(driverFirestore, driver.vehicleId)
      .then((v) => !cancelled && setVehicle(v))
      .catch(() => !cancelled && setVehicle(null));
    return () => {
      cancelled = true;
    };
  }, [driver]);

  return { session, driver, vehicle };
}
