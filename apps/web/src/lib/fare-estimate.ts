import type {
  FareBreakdown,
  GeoLocation,
  PlatformSettings,
  VehicleCategory,
} from "@the-ride/types";
import { calculateFare, estimateEtaSeconds, haversineDistanceMeters } from "@the-ride/utils";

import { getMapProvider } from "./map-provider";

export interface RouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
}

/** Straight-line route estimate across pickup -> stops -> dropoff — see `haversineDistanceMeters`'s doc comment on why this is a reasonable fallback. */
export function estimateRoute(points: GeoLocation[]): RouteEstimate {
  let distanceMeters = 0;
  for (let i = 0; i < points.length - 1; i++) {
    distanceMeters += haversineDistanceMeters(points[i]!, points[i + 1]!);
  }
  return { distanceMeters, durationSeconds: estimateEtaSeconds(distanceMeters) };
}

/**
 * FUNCTIONAL-STABILIZATION — tries the real, already-configured map
 * provider's `getRoute()` (real road distance/duration) first, same
 * try/catch-then-haversine pattern the passenger-app's Vehicle Selection
 * screen already uses (`apps/passenger-app/src/app/booking/vehicle.tsx`,
 * documented in docs/maps.md). `/book` previously always used the
 * straight-line estimate even though the provider's real `getRoute()` was
 * available and unused — this closes that gap without touching the fare
 * formula itself, which stays exactly as `calculateFare` already defines it.
 */
export async function resolveRoute(points: GeoLocation[]): Promise<RouteEstimate> {
  const origin = points[0];
  const destination = points[points.length - 1];
  if (!origin || !destination || points.length < 2) return estimateRoute(points);
  const waypoints = points.slice(1, -1);
  try {
    const route = await getMapProvider().getRoute(origin, destination, waypoints);
    return { distanceMeters: route.distanceMeters, durationSeconds: route.durationSeconds };
  } catch {
    // No live routing provider configured in this environment — honest
    // straight-line fallback, not a fabricated "real" route.
    return estimateRoute(points);
  }
}

export function estimateFareForCategory(
  route: RouteEstimate,
  category: VehicleCategory,
  settings: PlatformSettings,
): FareBreakdown {
  return calculateFare({
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    category: {
      baseFare: category.baseFare,
      perKmRate: category.perKmRate,
      perMinuteRate: category.perMinuteRate,
      minimumFare: category.minimumFare,
    },
    settings: {
      bookingFee: settings.bookingFee,
      serviceFeeRate: settings.serviceFeeRate,
      commissionRate: settings.commissionRate,
      taxRate: settings.taxRate,
      surgeMultiplier: settings.surgeMultiplierDefault,
      currency: settings.currency,
    },
  });
}
