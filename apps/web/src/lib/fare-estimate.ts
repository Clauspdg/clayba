import type {
  FareBreakdown,
  GeoLocation,
  PlatformSettings,
  VehicleCategory,
} from "@the-ride/types";
import { calculateFare, estimateEtaSeconds, haversineDistanceMeters } from "@the-ride/utils";

export interface RouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
}

/** Straight-line route estimate across pickup -> stops -> dropoff (Sprint 6 Booking) — see `haversineDistanceMeters`'s doc comment on why this, not a real routing API, is the honest estimate available in this environment. */
export function estimateRoute(points: GeoLocation[]): RouteEstimate {
  let distanceMeters = 0;
  for (let i = 0; i < points.length - 1; i++) {
    distanceMeters += haversineDistanceMeters(points[i]!, points[i + 1]!);
  }
  return { distanceMeters, durationSeconds: estimateEtaSeconds(distanceMeters) };
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
