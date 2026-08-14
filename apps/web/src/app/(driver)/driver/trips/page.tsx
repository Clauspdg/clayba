"use client";

import { webFirestore } from "@/lib/firebase-client";
import { useUserExperience } from "@/hooks/useUserExperience";
import { subscribeDriverTripHistory } from "@the-ride/firebase/client";
import {
  Badge,
  EmptyState,
  Heading,
  Illustration,
  LoadingState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { TripStatus, type Trip } from "@the-ride/types";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<TripStatus, "success" | "danger" | "neutral"> = {
  [TripStatus.COMPLETED]: "success",
  [TripStatus.CANCELLED]: "danger",
  [TripStatus.REQUESTED]: "neutral",
  [TripStatus.MATCHED]: "neutral",
  [TripStatus.EN_ROUTE_TO_PICKUP]: "neutral",
  [TripStatus.ARRIVED]: "neutral",
  [TripStatus.IN_PROGRESS]: "neutral",
};

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

/** UX-3 sprint (Dedicated Driver Space), Part 8 — real completed/cancelled trips for this driver. */
export default function DriverTripsPage() {
  const { t, locale } = useTranslation();
  const { driver } = useUserExperience();
  const [trips, setTrips] = useState<Trip[] | null>(null);

  useEffect(() => {
    if (!driver) return;
    return subscribeDriverTripHistory(webFirestore, driver.id, setTrips, () => setTrips([]));
  }, [driver]);

  if (!driver || trips === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={1}>{t("driverSpace.nav.trips")}</Heading>

      {trips.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("driverSpace.trips.emptyTitle")}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("driverSpace.trips.dateColumn")}</TableHead>
                <TableHead>{t("driverSpace.trips.pickupColumn")}</TableHead>
                <TableHead>{t("driverSpace.trips.destinationColumn")}</TableHead>
                <TableHead>{t("driverSpace.trips.durationColumn")}</TableHead>
                <TableHead>{t("driverSpace.trips.payoutColumn")}</TableHead>
                <TableHead>{t("driverSpace.trips.statusColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => {
                const durationSeconds =
                  trip.startedAt && trip.completedAt
                    ? (trip.completedAt.getTime() - trip.startedAt.getTime()) / 1000
                    : undefined;
                return (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <Text size="sm" tone="muted">
                        {(
                          trip.completedAt ??
                          trip.cancelledAt ??
                          trip.createdAt
                        ).toLocaleDateString(locale, {
                          dateStyle: "medium",
                        })}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">{trip.pickup.address ?? "—"}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">{trip.dropoff.address ?? "—"}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm" tone="muted">
                        {durationSeconds !== undefined ? formatDuration(durationSeconds) : "—"}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">
                        {trip.fareAmount !== undefined ? `$${trip.fareAmount.toFixed(2)}` : "—"}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[trip.status]}>
                        {t(`driverSpace.tripStatus.${trip.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
