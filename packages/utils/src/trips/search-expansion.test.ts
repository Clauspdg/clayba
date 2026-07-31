import { SEARCH_RADIUS_EXPANSION_KM } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { getExpansionTierCount, getRadiusForAttempt, hasMoreExpansionTiers, isFinalExpansionTier } from "./search-expansion";

describe("getRadiusForAttempt", () => {
  it("returns the configured tiers in order", () => {
    expect(getRadiusForAttempt(0)).toBe(SEARCH_RADIUS_EXPANSION_KM[0]);
    expect(getRadiusForAttempt(1)).toBe(SEARCH_RADIUS_EXPANSION_KM[1]);
    expect(getRadiusForAttempt(2)).toBe(SEARCH_RADIUS_EXPANSION_KM[2]);
    expect(getRadiusForAttempt(3)).toBe(SEARCH_RADIUS_EXPANSION_KM[3]);
  });

  it("returns undefined once every tier is exhausted", () => {
    expect(getRadiusForAttempt(SEARCH_RADIUS_EXPANSION_KM.length)).toBeUndefined();
  });
});

describe("hasMoreExpansionTiers", () => {
  it("is true while tiers remain", () => {
    expect(hasMoreExpansionTiers(0)).toBe(true);
  });

  it("is false on the last tier", () => {
    expect(hasMoreExpansionTiers(SEARCH_RADIUS_EXPANSION_KM.length - 1)).toBe(false);
  });
});

describe("isFinalExpansionTier", () => {
  it("identifies the last configured tier", () => {
    expect(isFinalExpansionTier(SEARCH_RADIUS_EXPANSION_KM.length - 1)).toBe(true);
    expect(isFinalExpansionTier(0)).toBe(false);
  });
});

describe("getExpansionTierCount", () => {
  it("matches the configured tier list length", () => {
    expect(getExpansionTierCount()).toBe(SEARCH_RADIUS_EXPANSION_KM.length);
  });
});
