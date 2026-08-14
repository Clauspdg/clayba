import {
  DriverAccountStatus,
  DriverAvailabilityStatus,
  VehicleStatus,
  type Driver,
  type Vehicle,
} from "@the-ride/types";
import { describe, expect, it } from "vitest";

import { getOnlineEligibility } from "./online-eligibility";

const baseDriver: Driver = {
  id: "driver-1",
  userId: "driver-1",
  applicationId: "app-1",
  status: DriverAccountStatus.ACTIVE,
  vehicleId: "vehicle-1",
  documents: [],
  rating: 5,
  completedTrips: 0,
  warningsCount: 0,
  score: 100,
  isOnline: false,
  isAvailable: false,
  availabilityStatus: DriverAvailabilityStatus.OFFLINE,
  acceptanceRate: 1,
  cancellationRate: 0,
  activeJobsCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const approvedVehicle: Vehicle = {
  id: "vehicle-1",
  driverId: "driver-1",
  make: "Toyota",
  model: "Camry",
  year: 2021,
  plateNumber: "AA1234",
  color: "Gray",
  status: VehicleStatus.APPROVED,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getOnlineEligibility", () => {
  it("eligible: active status, approved vehicle, no expired documents", () => {
    const result = getOnlineEligibility(baseDriver, approvedVehicle);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("blocked: suspended driver", () => {
    const result = getOnlineEligibility(
      { ...baseDriver, status: DriverAccountStatus.SUSPENDED },
      approvedVehicle,
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("suspended");
  });

  it("blocked: terminated (inactive) driver", () => {
    const result = getOnlineEligibility(
      { ...baseDriver, status: DriverAccountStatus.TERMINATED },
      approvedVehicle,
    );
    expect(result.reasons).toContain("inactive");
  });

  it("blocked: no linked vehicle", () => {
    const result = getOnlineEligibility({ ...baseDriver, vehicleId: undefined }, null);
    expect(result.reasons).toContain("no_vehicle");
  });

  it("blocked: vehicle not approved", () => {
    const result = getOnlineEligibility(baseDriver, {
      ...approvedVehicle,
      status: VehicleStatus.PENDING,
    });
    expect(result.reasons).toContain("vehicle_not_approved");
  });

  it("blocked: expired document", () => {
    const result = getOnlineEligibility(
      {
        ...baseDriver,
        documents: [
          {
            type: "drivers_license" as never,
            url: "https://example.com/x.jpg",
            expiresAt: new Date("2000-01-01"),
          },
        ],
      },
      approvedVehicle,
    );
    expect(result.reasons).toContain("document_expired");
  });

  it("collects every real blocker at once, not just the first", () => {
    const result = getOnlineEligibility(
      { ...baseDriver, status: DriverAccountStatus.SUSPENDED, vehicleId: undefined },
      null,
    );
    expect(result.reasons).toEqual(expect.arrayContaining(["suspended", "no_vehicle"]));
  });
});
