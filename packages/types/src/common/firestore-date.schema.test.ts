import { describe, expect, it } from "vitest";

import { firestoreDateSchema } from "./firestore-date.schema";

/** Minimal stand-in for both `firebase/firestore` and `firebase-admin/firestore`'s `Timestamp` — both expose exactly this shape. */
class FakeTimestamp {
  constructor(private readonly date: Date) {}
  toDate(): Date {
    return this.date;
  }
}

describe("firestoreDateSchema", () => {
  it("passes through a real Date unchanged", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(firestoreDateSchema.parse(date)).toEqual(date);
  });

  it("converts a Firestore Timestamp-like value via toDate()", () => {
    const date = new Date("2026-02-02T00:00:00.000Z");
    expect(firestoreDateSchema.parse(new FakeTimestamp(date))).toEqual(date);
  });

  it("reproduces and fixes the deployed bug: a plain Timestamp-shaped object no longer throws 'Expected date, received object'", () => {
    // What driver-application.ts actually receives from a raw Firestore
    // client-SDK snapshot for createdAt/updatedAt before this fix.
    const timestampLike = {
      toDate: () => new Date("2026-03-03T00:00:00.000Z"),
      seconds: 1772668800,
      nanoseconds: 0,
    };
    expect(() => firestoreDateSchema.parse(timestampLike)).not.toThrow();
    expect(firestoreDateSchema.parse(timestampLike)).toEqual(new Date("2026-03-03T00:00:00.000Z"));
  });

  it("rejects an arbitrary invalid object", () => {
    expect(() => firestoreDateSchema.parse({ foo: "bar" })).toThrow();
  });

  it("rejects null, strings, and numbers", () => {
    expect(() => firestoreDateSchema.parse(null)).toThrow();
    expect(() => firestoreDateSchema.parse("2026-01-01")).toThrow();
    expect(() => firestoreDateSchema.parse(1735689600000)).toThrow();
  });

  it("rejects a value whose toDate() throws instead of propagating a raw exception", () => {
    const broken = {
      toDate() {
        throw new Error("boom");
      },
    };
    expect(() => firestoreDateSchema.parse(broken)).toThrow();
  });
});
