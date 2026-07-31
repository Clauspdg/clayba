import { SEARCH_RADIUS_EXPANSION_KM } from "@the-ride/types";

/**
 * Search radius expansion (Sprint 4, Part 7). `DispatchQueue.expansionAttempt`
 * (0-indexed) selects which tier of `SEARCH_RADIUS_EXPANSION_KM` (2/5/10/15 km)
 * to search next — expansion stops (returns `undefined`) once every tier
 * has been tried, at which point the caller marks the queue `exhausted`.
 * See docs/search-expansion.md.
 */

export function getRadiusForAttempt(attempt: number): number | undefined {
  return SEARCH_RADIUS_EXPANSION_KM[attempt];
}

export function hasMoreExpansionTiers(attempt: number): boolean {
  return attempt + 1 < SEARCH_RADIUS_EXPANSION_KM.length;
}

export function isFinalExpansionTier(attempt: number): boolean {
  return attempt === SEARCH_RADIUS_EXPANSION_KM.length - 1;
}

/** Total tiers configured — mostly useful for progress UI ("searching 2 of 4"). */
export function getExpansionTierCount(): number {
  return SEARCH_RADIUS_EXPANSION_KM.length;
}
