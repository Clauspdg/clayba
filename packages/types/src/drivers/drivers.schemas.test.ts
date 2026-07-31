import { describe, expect, it } from "vitest";

import { DriverAccountStatus, DriverApplicationStatus } from "./drivers.enums";
import { driverApplicationSchema, driverSchema } from "./drivers.schemas";

describe("driverApplicationSchema", () => {
  it("accepts a minimal Draft application", () => {
    const application = driverApplicationSchema.parse({
      id: "app-1",
      userId: "user-1",
      status: DriverApplicationStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(application.status).toBe(DriverApplicationStatus.DRAFT);
  });

  it("rejects an unknown status", () => {
    expect(() =>
      driverApplicationSchema.parse({
        id: "app-1",
        userId: "user-1",
        status: "not_a_status",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });
});

describe("driverSchema", () => {
  it("applies defaults for rating/completedTrips/warningsCount/score/documents", () => {
    const driver = driverSchema.parse({
      id: "driver-1",
      userId: "user-1",
      applicationId: "app-1",
      status: DriverAccountStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(driver.rating).toBe(0);
    expect(driver.completedTrips).toBe(0);
    expect(driver.warningsCount).toBe(0);
    expect(driver.score).toBe(100);
    expect(driver.documents).toEqual([]);
  });

  it("rejects a rating outside 0-5", () => {
    expect(() =>
      driverSchema.parse({
        id: "driver-1",
        userId: "user-1",
        applicationId: "app-1",
        status: DriverAccountStatus.ACTIVE,
        rating: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });
});
