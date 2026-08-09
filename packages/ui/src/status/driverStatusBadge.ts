import { DriverAccountStatus, DriverApplicationStatus } from "@the-ride/types";

import type { BadgeProps } from "../components/badge/Badge";

export type BadgeTone = NonNullable<BadgeProps["tone"]>;

/**
 * Centralized status badge mapping (User State Experience sprint, Part 23)
 * — the ONE place tone/label semantics for a `DriverApplicationStatus` are
 * decided, so `apps/admin`'s `ApplicationsTab` and `apps/web`'s driver
 * lifecycle screens never silently drift into different colors for the
 * same status. Labels are translation keys (`becomeDriver.status*`,
 * already used by both apps) rather than literal strings, so callers pass
 * them through `t()`.
 */
export const DRIVER_APPLICATION_STATUS_TONE: Record<DriverApplicationStatus, BadgeTone> = {
  [DriverApplicationStatus.DRAFT]: "neutral",
  [DriverApplicationStatus.SUBMITTED]: "neutral",
  [DriverApplicationStatus.DOCUMENTS_PENDING]: "brand",
  [DriverApplicationStatus.BACKGROUND_CHECK]: "brand",
  [DriverApplicationStatus.VEHICLE_INSPECTION]: "brand",
  [DriverApplicationStatus.INTERVIEW]: "brand",
  [DriverApplicationStatus.APPROVED]: "success",
  [DriverApplicationStatus.REJECTED]: "danger",
  [DriverApplicationStatus.ACTIVATED]: "success",
  [DriverApplicationStatus.SUSPENDED]: "warning",
  [DriverApplicationStatus.ARCHIVED]: "neutral",
};

export const DRIVER_APPLICATION_STATUS_LABEL_KEY: Record<DriverApplicationStatus, string> = {
  [DriverApplicationStatus.DRAFT]: "becomeDriver.statusDraft",
  [DriverApplicationStatus.SUBMITTED]: "becomeDriver.statusSubmitted",
  [DriverApplicationStatus.DOCUMENTS_PENDING]: "becomeDriver.statusDocumentsPending",
  [DriverApplicationStatus.BACKGROUND_CHECK]: "becomeDriver.statusBackgroundCheck",
  [DriverApplicationStatus.VEHICLE_INSPECTION]: "becomeDriver.statusVehicleInspection",
  [DriverApplicationStatus.INTERVIEW]: "becomeDriver.statusInterview",
  [DriverApplicationStatus.APPROVED]: "becomeDriver.statusApproved",
  [DriverApplicationStatus.REJECTED]: "becomeDriver.statusRejected",
  [DriverApplicationStatus.ACTIVATED]: "becomeDriver.statusActivated",
  [DriverApplicationStatus.SUSPENDED]: "becomeDriver.statusSuspended",
  [DriverApplicationStatus.ARCHIVED]: "becomeDriver.statusArchived",
};

export const DRIVER_ACCOUNT_STATUS_TONE: Record<DriverAccountStatus, BadgeTone> = {
  [DriverAccountStatus.ACTIVE]: "success",
  [DriverAccountStatus.SUSPENDED]: "warning",
  [DriverAccountStatus.TERMINATED]: "danger",
};
