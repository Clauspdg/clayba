"use client";

import { DriverAvailabilityStatus } from "@the-ride/types";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useTranslation, type BadgeProps } from "@the-ride/ui";

const STATUS_TONE: Record<DriverAvailabilityStatus, NonNullable<BadgeProps["tone"]>> = {
  [DriverAvailabilityStatus.OFFLINE]: "neutral",
  [DriverAvailabilityStatus.ONLINE]: "neutral",
  [DriverAvailabilityStatus.AVAILABLE]: "success",
  [DriverAvailabilityStatus.BUSY]: "warning",
  [DriverAvailabilityStatus.ON_TRIP]: "brand",
  [DriverAvailabilityStatus.ON_BREAK]: "neutral",
  [DriverAvailabilityStatus.SUSPENDED]: "danger",
  [DriverAvailabilityStatus.INACTIVE]: "neutral",
};

/** Illustrative — no live `DriverPresenceRepository` session wired into the dashboard yet. */
const QUEUE = [
  { driverId: "DRV-201", name: "Jordan R.", status: DriverAvailabilityStatus.AVAILABLE, score: 92, rating: 4.9, distanceKm: 1.2 },
  { driverId: "DRV-188", name: "Alex M.", status: DriverAvailabilityStatus.BUSY, score: 87, rating: 4.7, distanceKm: 2.4 },
  { driverId: "DRV-142", name: "Sam K.", status: DriverAvailabilityStatus.ON_TRIP, score: 95, rating: 5.0, distanceKm: 3.8 },
  { driverId: "DRV-119", name: "Riley P.", status: DriverAvailabilityStatus.AVAILABLE, score: 74, rating: 4.5, distanceKm: 4.9 },
] as const;

export function DriverQueueTab() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.driverQueue.driver")}</TableHead>
              <TableHead>{t("admin.driverQueue.score")}</TableHead>
              <TableHead>{t("admin.driverQueue.rating")}</TableHead>
              <TableHead>{t("admin.driverQueue.distance")}</TableHead>
              <TableHead>{t("admin.rideRequests.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {QUEUE.map((driver) => (
              <TableRow key={driver.driverId}>
                <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">{driver.name}</TableCell>
                <TableCell>{driver.score}</TableCell>
                <TableCell>{`★ ${driver.rating.toFixed(1)}`}</TableCell>
                <TableCell>{driver.distanceKm} km</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[driver.status]}>{t(`driverHome.status.${driver.status}`)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
