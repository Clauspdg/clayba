"use client";

import { Badge, useTranslation, type BadgeProps } from "@the-ride/ui";
import { DriverAccountStatus, DriverAvailabilityStatus, type Driver } from "@the-ride/types";

type Tone = BadgeProps["tone"];

const ACCOUNT_STATUS_TONE: Partial<Record<DriverAccountStatus, Tone>> = {
  [DriverAccountStatus.SUSPENDED]: "warning",
  [DriverAccountStatus.TERMINATED]: "danger",
};

const ACCOUNT_STATUS_LABEL_KEY: Partial<Record<DriverAccountStatus, string>> = {
  [DriverAccountStatus.SUSPENDED]: "driverSpace.status.suspended",
  [DriverAccountStatus.TERMINATED]: "driverSpace.status.inactive",
};

const AVAILABILITY_TONE: Record<DriverAvailabilityStatus, Tone> = {
  [DriverAvailabilityStatus.OFFLINE]: "neutral",
  [DriverAvailabilityStatus.ONLINE]: "brand",
  [DriverAvailabilityStatus.AVAILABLE]: "success",
  [DriverAvailabilityStatus.BUSY]: "warning",
  [DriverAvailabilityStatus.ON_TRIP]: "brand",
  [DriverAvailabilityStatus.ON_BREAK]: "neutral",
  [DriverAvailabilityStatus.SUSPENDED]: "danger",
  [DriverAvailabilityStatus.INACTIVE]: "neutral",
};

const AVAILABILITY_LABEL_KEY: Record<DriverAvailabilityStatus, string> = {
  [DriverAvailabilityStatus.OFFLINE]: "driverSpace.status.offline",
  [DriverAvailabilityStatus.ONLINE]: "driverSpace.status.online",
  [DriverAvailabilityStatus.AVAILABLE]: "driverSpace.status.available",
  [DriverAvailabilityStatus.BUSY]: "driverSpace.status.busy",
  [DriverAvailabilityStatus.ON_TRIP]: "driverSpace.status.onTrip",
  [DriverAvailabilityStatus.ON_BREAK]: "driverSpace.status.onBreak",
  [DriverAvailabilityStatus.SUSPENDED]: "driverSpace.status.suspended",
  [DriverAvailabilityStatus.INACTIVE]: "driverSpace.status.inactive",
};

/**
 * UX-3 sprint (Dedicated Driver Space), Part 18 — the ONE place that maps a
 * driver's real status to a label/tone, reused by the shell header, Driver
 * Home, and anywhere else a compact status pill is needed. Account-level
 * status (suspended/terminated) always takes priority over shift-level
 * `availabilityStatus` — a suspended driver showing "Offline" instead of
 * "Suspended" would understate what's actually blocking them.
 */
export function DriverStatusBadge({ driver }: { driver: Driver }) {
  const { t } = useTranslation();

  if (driver.status !== DriverAccountStatus.ACTIVE) {
    const tone = ACCOUNT_STATUS_TONE[driver.status] ?? "neutral";
    const labelKey = ACCOUNT_STATUS_LABEL_KEY[driver.status];
    return <Badge tone={tone}>{labelKey ? t(labelKey) : driver.status}</Badge>;
  }

  return (
    <Badge tone={AVAILABILITY_TONE[driver.availabilityStatus]}>
      {t(AVAILABILITY_LABEL_KEY[driver.availabilityStatus])}
    </Badge>
  );
}
