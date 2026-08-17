"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { TripRequestStatus, tripRequestSchema, type TripRequest } from "@the-ride/types";
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
import { collection, limit as fsLimit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

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

/**
 * DRIVER-E2E-06 — live `tripRequests` query, replacing the earlier
 * `LIVE_REQUESTS` fixture. `firestore.rules`'s `tripRequests` read rule
 * already grants admin/dispatcher roles (Sprint 6 fix), so no rules change
 * was needed here. Radius/elapsed-time columns from the old mock are
 * dropped rather than faked — a request's real radius tier lives on the
 * separate `dispatchQueue/{requestId}` doc, out of scope for this pass.
 */
export function LiveRideRequestsTab() {
  const { t, locale } = useTranslation();
  const [requests, setRequests] = useState<TripRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "tripRequests"),
      orderBy("createdAt", "desc"),
      fsLimit(100),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const parsed: TripRequest[] = [];
        for (const d of snapshot.docs) {
          try {
            parsed.push(tripRequestSchema.parse({ id: d.id, ...d.data() }));
          } catch (err) {
            console.error("[LiveRideRequestsTab] failed to parse tripRequest", d.id, err);
          }
        }
        setRequests(parsed);
      },
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const counters = useMemo(() => {
    const list = requests ?? [];
    const inQueue = list.filter((r) => r.status === TripRequestStatus.SEARCHING_DRIVER).length;
    const assigned = list.filter((r) => r.status === TripRequestStatus.DRIVER_ASSIGNED).length;
    return [
      {
        label: t("admin.dispatchCenter.liveCounters.inQueue"),
        value: requests === null ? "—" : inQueue,
      },
      {
        label: t("admin.dispatchCenter.liveCounters.offersInFlight"),
        value: requests === null ? "—" : assigned,
      },
      {
        label: t("admin.dispatchCenter.liveCounters.assignedLastHour"),
        value: requests === null ? "—" : "—",
      },
    ];
  }, [requests, t]);

  return (
    <div className="flex flex-col gap-4">
      <div className="tablet:grid-cols-3 grid gap-4">
        {counters.map((counter) => (
          <Card key={counter.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                {counter.value}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {counter.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      ) : requests === null ? (
        <LoadingState title={t("common.loading")} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("admin.rideRequests.noRequests")}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.rideRequests.id")}</TableHead>
                  <TableHead>{t("booking.pickupLabel")}</TableHead>
                  <TableHead>{t("admin.documentReview.submittedDate")}</TableHead>
                  <TableHead>{t("admin.rideRequests.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">
                      {request.id}
                    </TableCell>
                    <TableCell>
                      {request.pickup.address ??
                        `${request.pickup.lat.toFixed(4)}, ${request.pickup.lng.toFixed(4)}`}
                    </TableCell>
                    <TableCell>
                      {request.requestedAt
                        ? request.requestedAt.toLocaleString(locale, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[request.status]}>
                        {t(`admin.rideRequestStatus.${request.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
