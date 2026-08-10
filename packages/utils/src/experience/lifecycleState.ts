import {
  DriverAccountStatus,
  type Driver,
  type DriverApplication,
  type DriverLifecycleState,
} from "@the-ride/types";

/**
 * Derives the driver-journey lifecycle, independent of `Role` (UX-1
 * sprint, Part 1: "ROLE and LIFECYCLE STATE must be treated as separate
 * concepts"). Mirrors `resolveExperienceState`'s driver-record-first
 * priority for the same reason documented there.
 */
export function resolveDriverLifecycleState(input: {
  driverApplication: DriverApplication | null;
  driver: Driver | null;
}): DriverLifecycleState {
  const { driverApplication, driver } = input;

  if (driver) {
    switch (driver.status) {
      case DriverAccountStatus.ACTIVE:
        return { stage: "active" };
      case DriverAccountStatus.SUSPENDED:
        return { stage: "suspended" };
      case DriverAccountStatus.TERMINATED:
        return { stage: "inactive" };
    }
  }

  if (driverApplication) {
    return { stage: "applicant", status: driverApplication.status };
  }

  return { stage: "none" };
}
