import { describe, expect, it } from "vitest";

import { ANDROID_VERSION_CODES, RELEASE_SPRINT, RELEASE_VERSION, RELEASE_VERSION_STRING, resolveBuildInfo } from "./version";

describe("version", () => {
  it("formats RELEASE_VERSION_STRING as major.minor.patch", () => {
    expect(RELEASE_VERSION_STRING).toBe(`${RELEASE_VERSION.major}.${RELEASE_VERSION.minor}.${RELEASE_VERSION.patch}`);
  });

  it("has a positive integer versionCode for every app", () => {
    expect(Number.isInteger(ANDROID_VERSION_CODES.driver)).toBe(true);
    expect(ANDROID_VERSION_CODES.driver).toBeGreaterThan(0);
    expect(Number.isInteger(ANDROID_VERSION_CODES.passenger)).toBe(true);
    expect(ANDROID_VERSION_CODES.passenger).toBeGreaterThan(0);
  });

  it("resolveBuildInfo falls back to labeled placeholders when no env values are supplied", () => {
    const info = resolveBuildInfo({});
    expect(info.version).toBe(RELEASE_VERSION_STRING);
    expect(info.sprint).toBe(RELEASE_SPRINT);
    expect(info.environment).toBe("development");
    expect(info.firebaseProjectId).toBe("unknown");
    expect(info.commit).toBe("dev");
    expect(info.buildDate).toBe("unknown");
  });

  it("resolveBuildInfo passes through supplied values", () => {
    const info = resolveBuildInfo({ environment: "staging", firebaseProjectId: "the-ride-staging", commit: "abc1234", buildDate: "2026-07-31T00:00:00Z" });
    expect(info.environment).toBe("staging");
    expect(info.firebaseProjectId).toBe("the-ride-staging");
    expect(info.commit).toBe("abc1234");
    expect(info.buildDate).toBe("2026-07-31T00:00:00Z");
  });
});
