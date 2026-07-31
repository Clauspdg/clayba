"use client";

import { TripRequestStatus } from "@the-ride/types";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useTranslation, type BadgeProps } from "@the-ride/ui";

const STATUS_TONE: Record<TripRequestStatus, NonNullable<BadgeProps["tone"]>> = {
  [TripRequestStatus.DRAFT]: "neutral",
  [TripRequestStatus.ESTIMATING]: "neutral",
  [TripRequestStatus.PENDING]: "neutral",
  [TripRequestStatus.CONFIRMED]: "brand",
  [TripRequestStatus.SEARCHING_DRIVER]: "warning",
  [TripRequestStatus.MATCHED]: "brand",
  [TripRequestStatus.DRIVER_ASSIGNED]: "brand",
  [TripRequestStatus.DRIVER_ACCEPTED]: "success",
  [TripRequestStatus.DRIVER_REJECTED]: "warning",
  [TripRequestStatus.CANCELLED]: "danger",
  [TripRequestStatus.EXPIRED]: "danger",
};

const LIVE_REQUESTS = [
  { id: "REQ-1042", pickup: "123 Main St", radiusKm: 5, status: TripRequestStatus.SEARCHING_DRIVER, elapsedSeconds: 8 },
  { id: "REQ-1043", pickup: "9 River Rd", radiusKm: 2, status: TripRequestStatus.DRIVER_ASSIGNED, elapsedSeconds: 3 },
  { id: "REQ-1044", pickup: "500 Park Ave", radiusKm: 10, status: TripRequestStatus.SEARCHING_DRIVER, elapsedSeconds: 22 },
] as const;

export function LiveRideRequestsTab() {
  const { t } = useTranslation();

  const counters = [
    { label: t("admin.dispatchCenter.liveCounters.inQueue"), value: "—" },
    { label: t("admin.dispatchCenter.liveCounters.offersInFlight"), value: "—" },
    { label: t("admin.dispatchCenter.liveCounters.assignedLastHour"), value: "—" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 tablet:grid-cols-3">
        {counters.map((counter) => (
          <Card key={counter.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{counter.value}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{counter.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.rideRequests.id")}</TableHead>
                <TableHead>{t("booking.pickupLabel")}</TableHead>
                <TableHead>{t("admin.dispatchCenter.radius")}</TableHead>
                <TableHead>{t("admin.dispatchCenter.elapsed")}</TableHead>
                <TableHead>{t("admin.rideRequests.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LIVE_REQUESTS.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">{request.id}</TableCell>
                  <TableCell>{request.pickup}</TableCell>
                  <TableCell>{request.radiusKm} km</TableCell>
                  <TableCell>{request.elapsedSeconds}s</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[request.status]}>{t(`admin.rideRequestStatus.${request.status}`)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
