"use client";

import { webFirestore } from "@/lib/firebase-client";
import { FareMeter } from "@/components/passenger/FareMeter";
import { LiveRideTracking } from "@/components/passenger/LiveRideTracking";
import { ShareRideControl } from "@/components/passenger/ShareRideControl";
import {
  cancelTripRequest,
  getVehicle,
  subscribeMyTripRequests,
  subscribeMyTrips,
} from "@the-ride/firebase/client";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Heading,
  Illustration,
  LoadingState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import {
  TripRequestStatus,
  TripStatus,
  type Trip,
  type TripRequest,
  type Vehicle,
} from "@the-ride/types";
import { useEffect, useMemo, useState } from "react";

type RideItem = ({ source: "request" } & TripRequest) | ({ source: "trip" } & Trip);

const REQUEST_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  estimating: "neutral",
  pending: "neutral",
  confirmed: "brand",
  searching_driver: "warning",
  matched: "brand",
  driver_assigned: "brand",
  driver_accepted: "success",
  driver_rejected: "danger",
  cancelled: "danger",
  expired: "danger",
};

const TRIP_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  requested: "neutral",
  matched: "brand",
  en_route_to_pickup: "brand",
  arrived: "brand",
  in_progress: "brand",
  completed: "success",
  cancelled: "danger",
};

// `subscribeMyTripRequests` casts Firestore data straight to `TripRequest`
// without running it through `tripRequestSchema` (unlike `subscribeMyTrips`,
// which does), so `expiresAt` may still be a raw Firestore `Timestamp` at
// runtime despite its declared `Date` type — duck-type it rather than
// trusting that.
function toDateSafe(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}

// FUNCTIONAL-STABILIZATION — no scheduled process in this environment ever
// marks an abandoned search `expired` once its real `expiresAt` passes (see
// docs/dispatch-engine.md's disclosed gap), so a request a driver never
// picked up stayed "Active" on this page forever. Treating a
// past-`expiresAt` request as inactive is a display-only honesty fix: it
// doesn't touch dispatch or write anything, it just stops presenting a
// dead search as if it's still being worked.
function isActiveRequest(status: TripRequestStatus, expiresAt?: unknown): boolean {
  if (
    [
      TripRequestStatus.CANCELLED,
      TripRequestStatus.EXPIRED,
      TripRequestStatus.DRIVER_REJECTED,
    ].includes(status)
  ) {
    return false;
  }
  const expiry = toDateSafe(expiresAt);
  return !expiry || expiry.getTime() >= Date.now();
}

/**
 * DRIVER-E2E-07 — once a driver accepts, `handleOfferAccepted` creates a
 * real `trips/{id}` doc (status `matched`) for the SAME ride; the
 * `tripRequests` doc that reached `driver_accepted` is superseded by it,
 * not a separate ride. Hiding it here avoids listing the same trip twice
 * (once as a stale request, once as the real trip) — the trip item is what
 * carries the assigned driver's vehicle onward.
 */
function isSupersededByTrip(status: TripRequestStatus): boolean {
  return status === TripRequestStatus.DRIVER_ACCEPTED;
}

function isActiveTrip(status: TripStatus): boolean {
  return ![TripStatus.COMPLETED, TripStatus.CANCELLED].includes(status);
}

export default function RideHistoryPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TripRequest[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  // DRIVER-E2E-10 — a key, not a copy of the item: storing the clicked
  // `RideItem` itself froze the dialog at whatever it looked like the
  // moment it opened, since neither `requests` nor `trips` updating via
  // their realtime subscriptions ever touched that separate state. A
  // driver going en_route/arrived/in_progress/completed while the
  // passenger already had the dialog open never showed up — the list
  // rows behind it *did* update live, only the open dialog didn't.
  // Deriving `viewing` below from the live arrays on every render fixes
  // that for good, for every status this dialog can show.
  const [viewingKey, setViewingKey] = useState<{ source: RideItem["source"]; id: string } | null>(
    null,
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null | undefined>(undefined);

  useEffect(() => {
    if (!session) return;
    const unsubRequests = subscribeMyTripRequests(
      webFirestore,
      session.uid,
      setRequests,
      (message) => toast({ variant: "danger", title: message }),
    );
    const unsubTrips = subscribeMyTrips(webFirestore, session.uid, setTrips, (message) =>
      toast({ variant: "danger", title: message }),
    );
    return () => {
      unsubRequests();
      unsubTrips();
    };
  }, [session, toast]);

  const { active, completed, cancelled } = useMemo(() => {
    const items: RideItem[] = [
      ...(requests ?? [])
        .filter((r) => !isSupersededByTrip(r.status))
        .map((r) => ({ source: "request" as const, ...r })),
      ...(trips ?? []).map((t2) => ({ source: "trip" as const, ...t2 })),
    ];
    return {
      active: items.filter((item) =>
        item.source === "request"
          ? isActiveRequest(item.status, item.expiresAt)
          : isActiveTrip(item.status),
      ),
      completed: items.filter(
        (item) => item.source === "trip" && item.status === TripStatus.COMPLETED,
      ),
      cancelled: items.filter(
        (item) =>
          (item.source === "request"
            ? !isActiveRequest(item.status, item.expiresAt)
            : !isActiveTrip(item.status)) &&
          !(item.source === "trip" && item.status === TripStatus.COMPLETED),
      ),
    };
  }, [requests, trips]);

  const viewing: RideItem | null = useMemo(() => {
    if (!viewingKey) return null;
    if (viewingKey.source === "request") {
      const match = (requests ?? []).find((r) => r.id === viewingKey.id);
      return match ? { source: "request" as const, ...match } : null;
    }
    const match = (trips ?? []).find((t) => t.id === viewingKey.id);
    return match ? { source: "trip" as const, ...match } : null;
  }, [viewingKey, requests, trips]);

  useEffect(() => {
    if (!viewing || viewing.source !== "trip" || !viewing.vehicleId) {
      setViewingVehicle(viewing?.source === "trip" ? null : undefined);
      return;
    }
    let cancelled = false;
    setViewingVehicle(undefined);
    getVehicle(webFirestore, viewing.vehicleId)
      .then((vehicle) => !cancelled && setViewingVehicle(vehicle))
      .catch(() => !cancelled && setViewingVehicle(null));
    return () => {
      cancelled = true;
    };
  }, [viewing]);

  async function handleCancel(requestId: string) {
    setCancellingId(requestId);
    try {
      await cancelTripRequest(webFirestore, requestId);
      toast({ variant: "success", title: t("rideHistory.cancelled") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setCancellingId(null);
    }
  }

  if (requests === null || trips === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  function renderList(items: RideItem[], emptyKey: string) {
    if (items.length === 0) {
      return <EmptyState icon={<Illustration name="empty" size={80} />} title={t(emptyKey)} />;
    }
    return (
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={`${item.source}-${item.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <button
              type="button"
              onClick={() => setViewingKey({ source: item.source, id: item.id })}
              className="flex-1 text-left"
            >
              <p className="font-medium text-neutral-900 dark:text-neutral-50">
                {item.pickup.address ?? t("rideHistory.pickup")} →{" "}
                {item.dropoff.address ?? t("rideHistory.destination")}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {item.source === "request"
                  ? item.fareEstimate
                    ? `$${item.fareEstimate.total.toFixed(2)}`
                    : "—"
                  : item.fareAmount
                    ? `$${item.fareAmount.toFixed(2)}`
                    : "—"}
              </p>
            </button>
            <Badge
              tone={
                (item.source === "request" ? REQUEST_TONE[item.status] : TRIP_TONE[item.status]) ??
                "neutral"
              }
            >
              {item.source === "request"
                ? t(`admin.rideRequestStatus.${item.status}`)
                : t(`admin.tripStatus.${item.status}`)}
            </Badge>
            {item.source === "request" && isActiveRequest(item.status, item.expiresAt) && (
              <Button
                size="sm"
                variant="ghost"
                isLoading={cancellingId === item.id}
                onClick={() => void handleCancel(item.id)}
              >
                {t("rideHistory.cancelRide")}
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("passengerNav.rideHistory")}</Heading>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t("rideHistory.active")}</TabsTrigger>
          <TabsTrigger value="completed">{t("rideHistory.completed")}</TabsTrigger>
          <TabsTrigger value="cancelled">{t("rideHistory.cancelledTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="active">{renderList(active, "rideHistory.noActive")}</TabsContent>
        <TabsContent value="completed">
          {renderList(completed, "rideHistory.noCompleted")}
        </TabsContent>
        <TabsContent value="cancelled">
          {renderList(cancelled, "rideHistory.noCancelled")}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewingKey(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("rideHistory.rideDetails")}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="grid gap-3">
              {viewing.source === "trip" && viewing.status === TripStatus.EN_ROUTE_TO_PICKUP && (
                <Alert tone="brand" title={t("rideHistory.driverOnWayTitle")}>
                  {viewing.driverLocationUpdatedAt
                    ? t("rideHistory.driverLocationFreshness", {
                        time: viewing.driverLocationUpdatedAt.toLocaleTimeString(),
                      })
                    : t("rideHistory.driverLocationUnavailable")}
                </Alert>
              )}
              {viewing.source === "trip" && viewing.status === TripStatus.ARRIVED && (
                <Alert tone="success" title={t("rideHistory.driverArrivedTitle")}>
                  {t("rideHistory.driverArrivedBody")}
                </Alert>
              )}
              {viewing.source === "trip" && <LiveRideTracking trip={viewing} />}
              {viewing.source === "trip" && <FareMeter trip={viewing} />}
              <div className="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t("rideHistory.pickup")}
                </dt>
                <dd className="text-sm font-medium">{viewing.pickup.address ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t("rideHistory.destination")}
                </dt>
                <dd className="text-sm font-medium">{viewing.dropoff.address ?? "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t("rideHistory.status")}
                </dt>
                <dd className="text-sm font-medium">
                  {viewing.source === "request"
                    ? t(`admin.rideRequestStatus.${viewing.status}`)
                    : t(`admin.tripStatus.${viewing.status}`)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t("rideHistory.fare")}
                </dt>
                <dd className="text-sm font-medium">
                  {viewing.source === "request"
                    ? viewing.fareEstimate
                      ? `$${viewing.fareEstimate.total.toFixed(2)}`
                      : "—"
                    : viewing.fareAmount
                      ? `$${viewing.fareAmount.toFixed(2)}`
                      : "—"}
                </dd>
              </div>
              {viewing.source === "trip" && viewing.vehicleId && (
                <div className="flex justify-between py-2">
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t("rideHistory.vehicle")}
                  </dt>
                  <dd className="text-sm font-medium">
                    {viewingVehicle === undefined
                      ? t("common.loading")
                      : viewingVehicle
                        ? `${viewingVehicle.color} ${viewingVehicle.make} ${viewingVehicle.model} · ${viewingVehicle.plateNumber}`
                        : t("rideHistory.vehicleUnavailable")}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {viewing && viewing.source === "trip" && (
            <div className="mt-1">
              <ShareRideControl trip={viewing} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
