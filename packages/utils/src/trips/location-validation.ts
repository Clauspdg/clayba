import type { GeoLocation } from "@the-ride/types";

import { haversineDistanceMeters } from "./distance";

/** Below this, treat movement as GPS jitter, not real travel. */
const NOISE_THRESHOLD_METERS = 8;
/** A reading this imprecise can't be trusted to contribute distance. */
const MAX_ACCEPTABLE_ACCURACY_METERS = 100;
/** Faster than this between two readings implies a GPS jump, not real driving. */
const MAX_PLAUSIBLE_SPEED_METERS_PER_SECOND = 55; // ~198 km/h

export interface LocationUpdateEvaluation {
  /** Whether this reading is trustworthy enough to move the marker/freshness at all. */
  accepted: boolean;
  /** Distance (meters) to add to the trip's accumulated `actualDistanceMeters` — 0 whenever `accepted` is false, or when the movement is within noise. */
  distanceMeters: number;
  reason?: "invalid_accuracy" | "no_time_elapsed" | "implausible_speed" | "below_noise_floor";
}

/**
 * CLAYBA P1, Part A/D — the guarded step between "a raw GPS reading came
 * in" and "we trust it enough to move the live marker / count it toward
 * the metered distance." Run server-side, in the trusted
 * `onTripDriverLocationWritten` trigger, over the previous accepted
 * reading vs. the new one — never trusts a client-submitted distance
 * total directly (see docs on `Trip.actualDistanceMeters`).
 */
export function evaluateLocationUpdate(
  previous: { location: GeoLocation; updatedAt: Date } | null,
  next: { location: GeoLocation; updatedAt: Date; accuracy?: number },
): LocationUpdateEvaluation {
  if (next.accuracy !== undefined && next.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
    return { accepted: false, distanceMeters: 0, reason: "invalid_accuracy" };
  }

  if (!previous) {
    return { accepted: true, distanceMeters: 0 };
  }

  const elapsedSeconds = (next.updatedAt.getTime() - previous.updatedAt.getTime()) / 1000;
  if (elapsedSeconds <= 0) {
    return { accepted: false, distanceMeters: 0, reason: "no_time_elapsed" };
  }

  const distanceMeters = haversineDistanceMeters(previous.location, next.location);
  const impliedSpeed = distanceMeters / elapsedSeconds;
  if (impliedSpeed > MAX_PLAUSIBLE_SPEED_METERS_PER_SECOND) {
    return { accepted: false, distanceMeters: 0, reason: "implausible_speed" };
  }

  if (distanceMeters < NOISE_THRESHOLD_METERS) {
    // Accepted as a fresh reading (moves the marker/freshness), but too
    // small to be real travel — contributes nothing to the fare meter.
    return { accepted: true, distanceMeters: 0, reason: "below_noise_floor" };
  }

  return { accepted: true, distanceMeters };
}
