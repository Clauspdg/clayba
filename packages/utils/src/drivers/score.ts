import { DEFAULT_DRIVER_SCORE } from "@the-ride/types";

export interface DriverScoreInput {
  /** Average rider rating, 0-5. */
  rating: number;
  completedTrips: number;
  cancelledTrips: number;
  warningsCount: number;
}

const RATING_PENALTY_PER_STAR = 10;
const WARNING_PENALTY = 5;
const MAX_CANCELLATION_PENALTY = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Deterministic, explainable driver quality score (0-100) used to flag
 * drivers for review. Not a black box: every deduction below maps to a
 * documented reason in `docs/driver-management.md`.
 */
export function calculateDriverScore(input: DriverScoreInput): number {
  const { rating, completedTrips, cancelledTrips, warningsCount } = input;

  const ratingPenalty = clamp(5 - rating, 0, 5) * RATING_PENALTY_PER_STAR;
  const warningPenalty = warningsCount * WARNING_PENALTY;

  const totalTrips = completedTrips + cancelledTrips;
  const cancellationRate = totalTrips > 0 ? cancelledTrips / totalTrips : 0;
  const cancellationPenalty = cancellationRate * MAX_CANCELLATION_PENALTY;

  return clamp(Math.round(DEFAULT_DRIVER_SCORE - ratingPenalty - warningPenalty - cancellationPenalty), 0, 100);
}
