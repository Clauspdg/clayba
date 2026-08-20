import { describe, expect, it } from "vitest";

import { getLocationFreshness } from "./location-freshness";

describe("getLocationFreshness", () => {
  const now = 1_000_000;

  it("is expired when there's no reading at all", () => {
    expect(getLocationFreshness(undefined, now)).toBe("expired");
  });

  it("is fresh under 30 seconds old", () => {
    expect(getLocationFreshness(new Date(now - 10_000), now)).toBe("fresh");
  });

  it("is stale between 30 and 120 seconds old", () => {
    expect(getLocationFreshness(new Date(now - 60_000), now)).toBe("stale");
  });

  it("is expired past 120 seconds old", () => {
    expect(getLocationFreshness(new Date(now - 130_000), now)).toBe("expired");
  });
});
