import { describe, expect, it } from "vitest";

import { Role, UserStatus } from "./authentication.enums";
import { authClaimsSchema, createAuditLogInputSchema, userSchema } from "./authentication.schemas";

describe("userSchema", () => {
  const valid = {
    id: "user-1",
    email: "driver@example.com",
    role: Role.DRIVER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("accepts a valid user", () => {
    expect(userSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an invalid email", () => {
    expect(() => userSchema.parse({ ...valid, email: "not-an-email" })).toThrow();
  });

  it("rejects an unknown role", () => {
    expect(() => userSchema.parse({ ...valid, role: "superuser" })).toThrow();
  });
});

describe("authClaimsSchema", () => {
  it("accepts claims without an explicit permissions override", () => {
    const claims = authClaimsSchema.parse({ uid: "user-1", role: Role.PASSENGER });
    expect(claims.permissions).toBeUndefined();
  });

  it("rejects a permission string outside the centralized PERMISSIONS list", () => {
    expect(() => authClaimsSchema.parse({ uid: "user-1", role: Role.PASSENGER, permissions: ["not.a.real.permission"] })).toThrow();
  });
});

describe("createAuditLogInputSchema", () => {
  it("requires action, actorId, and actorRole", () => {
    expect(() => createAuditLogInputSchema.parse({})).toThrow();
  });

  it("accepts a minimal valid entry", () => {
    const input = createAuditLogInputSchema.parse({
      action: "settings.updated",
      actorId: "admin-1",
      actorRole: Role.ADMIN,
    });
    expect(input.action).toBe("settings.updated");
  });
});
