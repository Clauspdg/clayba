import { LOCATION_FRESH_THRESHOLD_MS, LOCATION_STALE_THRESHOLD_MS } from "@the-ride/types";

export type LocationFreshness = "fresh" | "stale" | "expired";

/**
 * CLAYBA P1, Part A — a driver's live position is only meaningful for as
 * long as it's recent. `fresh` (<30s) renders the marker/ETA normally,
 * `stale` (30s-120s) keeps showing the last known position with an
 * "updating..." hint, `expired` (>120s) stops presenting it as a live
 * position at all. Thresholds are centralized in `@the-ride/types` so the
 * passenger UI, driver UI, and public share page all agree.
 */
export function getLocationFreshness(
  updatedAt: Date | undefined,
  now: number = Date.now(),
): LocationFreshness {
  if (!updatedAt) return "expired";
  const ageMs = now - updatedAt.getTime();
  if (ageMs < LOCATION_FRESH_THRESHOLD_MS) return "fresh";
  if (ageMs < LOCATION_STALE_THRESHOLD_MS) return "stale";
  return "expired";
}
