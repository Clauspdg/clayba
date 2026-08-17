"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { DriverAvailabilityStatus, driverSchema, type Driver } from "@the-ride/types";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Illustration,
  LoadingState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useTranslation,
  type BadgeProps,
} from "@the-ride/ui";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

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

const QUEUE_STATUSES = [
  DriverAvailabilityStatus.ONLINE,
  DriverAvailabilityStatus.AVAILABLE,
  DriverAvailabilityStatus.BUSY,
  DriverAvailabilityStatus.ON_TRIP,
];

/**
 * DRIVER-E2E-06 — live `drivers` query (any driver currently on shift:
 * online/available/busy/on-trip), replacing the earlier `QUEUE` fixture.
 * `name`/`distanceKm` from the old mock are dropped rather than faked —
 * `Driver` has no display name field (only `userId`), and distance is only
 * meaningful relative to a specific request's pickup, which this
 * driver-wide queue view doesn't have.
 */
export function DriverQueueTab() {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState<Driver[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "drivers"),
      where("availabilityStatus", "in", QUEUE_STATUSES),
      orderBy("score", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const parsed: Driver[] = [];
        for (const d of snapshot.docs) {
          try {
            parsed.push(driverSchema.parse({ id: d.id, ...d.data() }));
          } catch (err) {
            console.error("[DriverQueueTab] failed to parse driver", d.id, err);
          }
        }
        setDrivers(parsed);
      },
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }
  if (drivers === null) {
    return <LoadingState title={t("common.loading")} />;
  }
  if (drivers.length === 0) {
    return (
      <EmptyState
        icon={<Illustration name="empty" size={80} />}
        title={t("admin.driverQueue.noDrivers")}
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.driverQueue.driver")}</TableHead>
              <TableHead>{t("admin.driverQueue.score")}</TableHead>
              <TableHead>{t("admin.driverQueue.rating")}</TableHead>
              <TableHead>{t("admin.rideRequests.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">
                  {driver.userId}
                </TableCell>
                <TableCell>{driver.score}</TableCell>
                <TableCell>{`★ ${driver.rating.toFixed(1)}`}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[driver.availabilityStatus]}>
                    {t(`driverHome.status.${driver.availabilityStatus}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
