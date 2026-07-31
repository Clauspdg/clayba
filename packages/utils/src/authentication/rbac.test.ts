import { Role } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { getPermissionsForRole, hasAllPermissions, hasAnyPermission, hasPermission, hasRole, isAtLeastRole } from "./rbac";

describe("hasPermission", () => {
  it("grants a permission that is in the role's matrix", () => {
    expect(hasPermission(Role.ADMIN, "driver.approve")).toBe(true);
  });

  it("denies a permission that is not in the role's matrix", () => {
    expect(hasPermission(Role.PASSENGER, "driver.approve")).toBe(false);
  });

  it("grants a permission via an explicit extra-grant override", () => {
    expect(hasPermission(Role.PASSENGER, "driver.approve", ["driver.approve"])).toBe(true);
  });

  it("SUPER_ADMIN holds every permission in the centralized list", () => {
    for (const permission of getPermissionsForRole(Role.SUPER_ADMIN)) {
      expect(hasPermission(Role.SUPER_ADMIN, permission)).toBe(true);
    }
  });
});

describe("hasAnyPermission / hasAllPermissions", () => {
  it("hasAnyPermission is true if at least one permission matches", () => {
    expect(hasAnyPermission(Role.DRIVER, ["driver.approve", "trip.read"])).toBe(true);
  });

  it("hasAllPermissions is false if any permission is missing", () => {
    expect(hasAllPermissions(Role.DRIVER, ["trip.read", "driver.approve"])).toBe(false);
  });

  it("hasAllPermissions is true when every permission matches", () => {
    expect(hasAllPermissions(Role.DRIVER, ["trip.read", "wallet.read"])).toBe(true);
  });
});

describe("hasRole", () => {
  it("matches when the role is in the allow-list", () => {
    expect(hasRole(Role.SUPPORT, [Role.SUPPORT, Role.ADMIN])).toBe(true);
  });

  it("does not match when the role is absent from the allow-list", () => {
    expect(hasRole(Role.PASSENGER, [Role.SUPPORT, Role.ADMIN])).toBe(false);
  });
});

describe("isAtLeastRole", () => {
  it("SUPER_ADMIN outranks ADMIN", () => {
    expect(isAtLeastRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
  });

  it("PASSENGER does not outrank ADMIN", () => {
    expect(isAtLeastRole(Role.PASSENGER, Role.ADMIN)).toBe(false);
  });

  it("a role always meets its own minimum", () => {
    expect(isAtLeastRole(Role.DISPATCHER, Role.DISPATCHER)).toBe(true);
  });
});
