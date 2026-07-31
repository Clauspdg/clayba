import { DriverApplicationStatus, DriverAvailabilityStatus } from "./drivers.enums";

export const DRIVER_APPLICATIONS_COLLECTION = "driverApplications";
export const DRIVERS_COLLECTION = "drivers";
export const DRIVER_WARNINGS_COLLECTION = "driverWarnings";
export const DRIVER_SUSPENSIONS_COLLECTION = "driverSuspensions";
export const DRIVER_PRESENCE_COLLECTION = "driverPresence";

/**
 * Valid forward transitions for a driver application. Consumed by
 * `packages/utils/src/drivers/workflow.ts`, which is the only place
 * allowed to decide whether a transition is legal.
 */
export const DRIVER_APPLICATION_TRANSITIONS: Record<DriverApplicationStatus, DriverApplicationStatus[]> = {
  [DriverApplicationStatus.DRAFT]: [DriverApplicationStatus.SUBMITTED],
  [DriverApplicationStatus.SUBMITTED]: [DriverApplicationStatus.DOCUMENTS_PENDING, DriverApplicationStatus.REJECTED],
  [DriverApplicationStatus.DOCUMENTS_PENDING]: [DriverApplicationStatus.BACKGROUND_CHECK, DriverApplicationStatus.REJECTED],
  [DriverApplicationStatus.BACKGROUND_CHECK]: [DriverApplicationStatus.VEHICLE_INSPECTION, DriverApplicationStatus.REJECTED],
  [DriverApplicationStatus.VEHICLE_INSPECTION]: [DriverApplicationStatus.INTERVIEW, DriverApplicationStatus.REJECTED],
  [DriverApplicationStatus.INTERVIEW]: [DriverApplicationStatus.APPROVED, DriverApplicationStatus.REJECTED],
  [DriverApplicationStatus.APPROVED]: [DriverApplicationStatus.ACTIVATED],
  [DriverApplicationStatus.REJECTED]: [DriverApplicationStatus.ARCHIVED],
  [DriverApplicationStatus.ACTIVATED]: [DriverApplicationStatus.SUSPENDED, DriverApplicationStatus.ARCHIVED],
  [DriverApplicationStatus.SUSPENDED]: [DriverApplicationStatus.ACTIVATED, DriverApplicationStatus.ARCHIVED],
  [DriverApplicationStatus.ARCHIVED]: [],
};

/** Default score every activated driver starts at (see `drivers/score.ts`). */
export const DEFAULT_DRIVER_SCORE = 100;

/** How many days before expiry a driver document is flagged as "expiring soon". */
export const DOCUMENT_EXPIRATION_WARNING_DAYS = 14;

/**
 * Valid forward transitions for a driver's real-time availability status
 * (Sprint 4, Part 1). Consumed by `packages/utils/src/drivers/availability.ts`,
 * which is the only place allowed to decide whether a transition is legal
 * — same pattern as `DRIVER_APPLICATION_TRANSITIONS`.
 */
export const DRIVER_AVAILABILITY_TRANSITIONS: Record<DriverAvailabilityStatus, DriverAvailabilityStatus[]> = {
  [DriverAvailabilityStatus.OFFLINE]: [DriverAvailabilityStatus.ONLINE, DriverAvailabilityStatus.INACTIVE],
  [DriverAvailabilityStatus.ONLINE]: [DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.OFFLINE],
  [DriverAvailabilityStatus.AVAILABLE]: [DriverAvailabilityStatus.BUSY, DriverAvailabilityStatus.ON_BREAK, DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.SUSPENDED],
  [DriverAvailabilityStatus.BUSY]: [DriverAvailabilityStatus.ON_TRIP, DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.SUSPENDED],
  [DriverAvailabilityStatus.ON_TRIP]: [DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.SUSPENDED],
  [DriverAvailabilityStatus.ON_BREAK]: [DriverAvailabilityStatus.AVAILABLE, DriverAvailabilityStatus.OFFLINE, DriverAvailabilityStatus.SUSPENDED],
  [DriverAvailabilityStatus.SUSPENDED]: [DriverAvailabilityStatus.OFFLINE],
  [DriverAvailabilityStatus.INACTIVE]: [DriverAvailabilityStatus.OFFLINE],
};

/** Default driver-facing offer response window (Sprint 4, Part 6). */
export const DEFAULT_OFFER_TIMEOUT_SECONDS = 15;

/** Search radius expansion sequence, in km, tried in order until the overall dispatch timeout (Sprint 4, Part 7). */
export const SEARCH_RADIUS_EXPANSION_KM = [2, 5, 10, 15] as const;
