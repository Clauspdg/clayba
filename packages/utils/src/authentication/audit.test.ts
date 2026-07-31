import { Role } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { buildAuditLogEntry } from "./audit";

describe("buildAuditLogEntry", () => {
  it("passes through a fully-formed entry unchanged (minus id/createdAt, which are assigned on write)", () => {
    const entry = buildAuditLogEntry({
      action: "driver.approved",
      actorId: "admin-1",
      actorRole: Role.ADMIN,
      targetId: "driver-1",
      targetType: "driver",
    });

    expect(entry).toEqual({
      action: "driver.approved",
      actorId: "admin-1",
      actorRole: Role.ADMIN,
      targetId: "driver-1",
      targetType: "driver",
    });
  });

  it("accepts optional reason and metadata", () => {
    const entry = buildAuditLogEntry({
      action: "wallet.adjusted",
      actorId: "admin-1",
      actorRole: Role.ADMIN,
      targetId: "wallet-1",
      targetType: "wallet",
      reason: "goodwill credit",
      metadata: { amount: 500 },
    });

    expect(entry.reason).toBe("goodwill credit");
    expect(entry.metadata).toEqual({ amount: 500 });
  });

  it("rejects an unknown audit action", () => {
    expect(() =>
      buildAuditLogEntry({
        // @ts-expect-error deliberately invalid action to test validation
        action: "not.a.real.action",
        actorId: "admin-1",
        actorRole: Role.ADMIN,
      }),
    ).toThrow();
  });

  it("rejects a missing actorId", () => {
    expect(() =>
      buildAuditLogEntry({
        action: "driver.approved",
        // @ts-expect-error deliberately missing actorId to test validation
        actorId: undefined,
        actorRole: Role.ADMIN,
      }),
    ).toThrow();
  });
});
