import type { GeoLocation } from "@the-ride/types";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle (haversine) distance between two points, in meters. Used
 * as a provider-independent fallback/estimate — e.g. for dispatch search
 * radius filtering — so ranking driver candidates never depends on a live
 * map API call per candidate. Real turn-by-turn distance for the
 * passenger-facing estimate comes from `@the-ride/api`'s map provider
 * (`getRoute`), which this is intentionally not a replacement for. See
 * docs/dispatch-engine.md.
 */
export function haversineDistanceMeters(a: GeoLocation, b: GeoLocation): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Straight-line ETA estimate at a flat average speed — a placeholder until a real routing ETA is available. */
export function estimateEtaSeconds(distanceMeters: number, averageSpeedKmh = 30): number {
  const averageSpeedMetersPerSecond = (averageSpeedKmh * 1000) / 3600;
  return distanceMeters / averageSpeedMetersPerSecond;
}
