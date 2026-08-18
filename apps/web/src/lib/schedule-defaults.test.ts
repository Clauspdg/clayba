import { describe, expect, it } from "vitest";

import { getDefaultScheduleSlot, getTodayDateString } from "./schedule-defaults";

describe("getDefaultScheduleSlot", () => {
  it("rounds 08:22 + 5min up to the next clean 5-minute slot (08:30)", () => {
    const result = getDefaultScheduleSlot(new Date(2026, 0, 15, 8, 22, 0));
    expect(result).toEqual({ date: "2026-01-15", time: "08:30" });
  });

  it("rounds 08:27 + 5min up to the next clean 5-minute slot (08:35)", () => {
    const result = getDefaultScheduleSlot(new Date(2026, 0, 15, 8, 27, 0));
    expect(result).toEqual({ date: "2026-01-15", time: "08:35" });
  });

  it("keeps an already-clean slot unchanged when +5min lands exactly on one", () => {
    const result = getDefaultScheduleSlot(new Date(2026, 0, 15, 8, 25, 0));
    expect(result).toEqual({ date: "2026-01-15", time: "08:30" });
  });

  it("rolls over to the next day across midnight", () => {
    const result = getDefaultScheduleSlot(new Date(2026, 0, 15, 23, 57, 0));
    expect(result).toEqual({ date: "2026-01-16", time: "00:05" });
  });
});

describe("getTodayDateString", () => {
  it("formats the local calendar date as YYYY-MM-DD", () => {
    expect(getTodayDateString(new Date(2026, 7, 17, 23, 59, 0))).toBe("2026-08-17");
  });
});
