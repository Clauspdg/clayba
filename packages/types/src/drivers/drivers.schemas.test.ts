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

  it("parses createdAt/updatedAt/submittedAt as raw Firestore Timestamp-like objects, reproducing the deployed become-a-driver crash", () => {
    // What findOwnApplication()/getApplication() actually receive from a raw
    // client-SDK snapshot.data() — before the fix this threw a ZodError
    // ("createdAt: Expected date, received object") for every existing
    // application, since Timestamp is not `instanceof Date`.
    const timestamp = (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    });

    const application = driverApplicationSchema.parse({
      id: "app-1",
      userId: "user-1",
      status: DriverApplicationStatus.SUBMITTED,
      submittedAt: timestamp(new Date("2026-01-01T00:00:00.000Z")),
      createdAt: timestamp(new Date("2026-01-01T00:00:00.000Z")),
      updatedAt: timestamp(new Date("2026-01-02T00:00:00.000Z")),
    });

    expect(application.createdAt).toBeInstanceOf(Date);
    expect(application.updatedAt).toBeInstanceOf(Date);
    expect(application.submittedAt).toBeInstanceOf(Date);
  });

  it("still rejects createdAt/updatedAt that are neither a Date nor Timestamp-like", () => {
    expect(() =>
      driverApplicationSchema.parse({
        id: "app-1",
        userId: "user-1",
        status: DriverApplicationStatus.DRAFT,
        createdAt: { not: "a date" },
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
