export type DriverLevel = "new" | "bronze" | "silver" | "gold" | "platinum";

const LEVEL_THRESHOLDS: Array<{ level: DriverLevel; minCompletedTrips: number }> = [
  { level: "platinum", minCompletedTrips: 2000 },
  { level: "gold", minCompletedTrips: 500 },
  { level: "silver", minCompletedTrips: 100 },
  { level: "bronze", minCompletedTrips: 10 },
  { level: "new", minCompletedTrips: 0 },
];

/** Tenure/experience tier derived from completed trips — a matching-score input (Sprint 4, Part 4), not a stored field. */
export function getDriverLevel(completedTrips: number): DriverLevel {
  const match = LEVEL_THRESHOLDS.find((tier) => completedTrips >= tier.minCompletedTrips);
  return match?.level ?? "new";
}

/** Normalizes a level to 0-1 for the scoring engine (`platinum` = 1). */
export function getDriverLevelScore(level: DriverLevel): number {
  const order: DriverLevel[] = ["new", "bronze", "silver", "gold", "platinum"];
  const index = order.indexOf(level);
  return index / (order.length - 1);
}
