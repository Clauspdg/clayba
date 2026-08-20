import * as Location from "expo-location";

export type LocationPermissionState =
  "granted" | "denied" | "permanently_denied" | "gps_disabled" | "unavailable";

/**
 * CLAYBA P2 — real Android GPS permission flow (section 11 of the brief).
 * Mirrors the web driver app's honest-failure handling
 * (`apps/web/src/app/(driver)/driver/current-ride/page.tsx`): every branch
 * is a real outcome the caller can show, never a crash. `canAskAgain` lets
 * the caller distinguish "ask once more" from "permanently denied — send
 * the driver to system settings."
 */
export async function requestDriverLocationPermission(): Promise<LocationPermissionState> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) return "gps_disabled";

  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  return canAskAgain ? "denied" : "permanently_denied";
}

export interface DriverLocationReading {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

/**
 * CLAYBA P2 — same throttled foreground-watch pattern as the web driver
 * app's `current-ride/page.tsx` (`LOCATION_WRITE_THROTTLE_MS`), reused
 * here rather than a second tracking architecture (section 12). V1 is
 * foreground-only (`Location.watchPositionAsync` without a background
 * task) — see docs/mobile-location.md for why background location isn't
 * in this sprint's scope (Google Play's background-location review
 * requirements are substantial and V1 needs real driver validation
 * first). Returns an unsubscribe function, same shape as every Firestore
 * listener in this codebase.
 */
export async function watchDriverLocation(
  onReading: (reading: DriverLocationReading) => void,
  onError: (state: LocationPermissionState) => void,
): Promise<() => void> {
  const permission = await requestDriverLocationPermission();
  if (permission !== "granted") {
    onError(permission);
    return () => {};
  }

  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 0 },
    (position) => {
      onReading({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        accuracy: position.coords.accuracy ?? undefined,
      });
    },
  );
  return () => subscription.remove();
}
