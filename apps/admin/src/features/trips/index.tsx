"use client";

import { TripRequestStatus } from "@the-ride/types";
import { Badge, Card, CardContent, CardHeader, CardTitle, Heading, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useTranslation, type BadgeProps } from "@the-ride/ui";

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

/** Illustrative rows — Ride Requests has no live Firestore session wired in yet (see VehicleCategoriesPage's scope note). */
const SAMPLE_REQUESTS = [
  { id: "REQ-1042", pickup: "123 Main St", destination: "455 Market St", category: "Comfort", status: TripRequestStatus.SEARCHING_DRIVER, fare: 18.4 },
  { id: "REQ-1041", pickup: "8 Elm Ave", destination: "Union Station", category: "Economy", status: TripRequestStatus.DRIVER_ACCEPTED, fare: 11.2 },
  { id: "REQ-1040", pickup: "77 Harbor Rd", destination: "Airport Terminal 2", category: "XL", status: TripRequestStatus.CONFIRMED, fare: 34.75 },
  { id: "REQ-1039", pickup: "12 Pine St", destination: "22 Oak St", category: "Economy", status: TripRequestStatus.CANCELLED, fare: 8.9 },
  { id: "REQ-1038", pickup: "900 5th Ave", destination: "Central Park W", category: "Luxury", status: TripRequestStatus.EXPIRED, fare: 42.0 },
] as const;

export function TripsPage() {
  const { t } = useTranslation();

  const statCards = [
    { label: t("admin.rideStats.activeRequests"), value: "—" },
    { label: t("admin.rideStats.searchingForDriver"), value: "—" },
    { label: t("admin.rideStats.confirmedToday"), value: "—" },
    { label: t("admin.rideStats.cancelledToday"), value: "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.trips")}</Heading>

      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stat.value}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.rideStats.recentRequests")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.rideRequests.id")}</TableHead>
                <TableHead>{t("booking.pickupLabel")}</TableHead>
                <TableHead>{t("booking.destinationLabel")}</TableHead>
                <TableHead>{t("booking.vehicleLabel")}</TableHead>
                <TableHead>{t("admin.rideRequests.fare")}</TableHead>
                <TableHead>{t("admin.rideRequests.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_REQUESTS.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">{request.id}</TableCell>
                  <TableCell>{request.pickup}</TableCell>
                  <TableCell>{request.destination}</TableCell>
                  <TableCell>{request.category}</TableCell>
                  <TableCell>${request.fare.toFixed(2)}</TableCell>
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
