import * as Location from "expo-location";

export type LocationPermissionState =
  "granted" | "denied" | "permanently_denied" | "gps_disabled" | "unavailable";

/**
 * Real Android/iOS location permission flow — same honest-failure handling
 * as the web app and CLAYBA Driver's `location-tracking.ts`: every branch
 * is a real outcome the caller can show, never a crash. `canAskAgain` lets
 * the caller distinguish "ask once more" from "permanently denied — send
 * the passenger to system settings."
 */
export async function requestLocationPermission(): Promise<LocationPermissionState> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) return "gps_disabled";

  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  return canAskAgain ? "denied" : "permanently_denied";
}

/**
 * Read-only permission check — never prompts, so Home can decide whether
 * to show its "enable location" banner without ever looping a permission
 * request on its own (the banner's own CTA is what actually calls
 * `requestLocationPermission`, on a real tap).
 */
export async function isLocationGranted(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export interface LocationReading {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

/** One-shot read of the passenger's current position — used to seed the booking pickup point and the Home map. */
export async function getCurrentLocation(): Promise<LocationReading | null> {
  const permission = await requestLocationPermission();
  if (permission !== "granted") return null;
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    heading: position.coords.heading ?? undefined,
    speed: position.coords.speed ?? undefined,
    accuracy: position.coords.accuracy ?? undefined,
  };
}

/**
 * Same throttled foreground-watch pattern as CLAYBA Driver's
 * `location-tracking.ts` — foreground-only (`Location.watchPositionAsync`
 * without a background task); used to show the passenger's own live
 * position on the active-ride map, never to write `trip.driverLocation`
 * (that field is driver-owned). Returns an unsubscribe function, same
 * shape as every Firestore listener in this codebase.
 */
export async function watchLocation(
  onReading: (reading: LocationReading) => void,
  onError: (state: LocationPermissionState) => void,
): Promise<() => void> {
  const permission = await requestLocationPermission();
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
