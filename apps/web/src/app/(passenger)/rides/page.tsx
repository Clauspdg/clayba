"use client";

import { webFirestore } from "@/lib/firebase-client";
import {
  cancelTripRequest,
  subscribeMyTripRequests,
  subscribeMyTrips,
} from "@the-ride/firebase/client";
import {
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
import { TripRequestStatus, TripStatus, type Trip, type TripRequest } from "@the-ride/types";
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

function isActiveRequest(status: TripRequestStatus): boolean {
  return ![
    TripRequestStatus.CANCELLED,
    TripRequestStatus.EXPIRED,
    TripRequestStatus.DRIVER_REJECTED,
  ].includes(status);
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
  const [viewing, setViewing] = useState<RideItem | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
      ...(requests ?? []).map((r) => ({ source: "request" as const, ...r })),
      ...(trips ?? []).map((t2) => ({ source: "trip" as const, ...t2 })),
    ];
    return {
      active: items.filter((item) =>
        item.source === "request" ? isActiveRequest(item.status) : isActiveTrip(item.status),
      ),
      completed: items.filter(
        (item) => item.source === "trip" && item.status === TripStatus.COMPLETED,
      ),
      cancelled: items.filter(
        (item) =>
          (item.source === "request"
            ? !isActiveRequest(item.status)
            : !isActiveTrip(item.status)) &&
          !(item.source === "trip" && item.status === TripStatus.COMPLETED),
      ),
    };
  }, [requests, trips]);

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
            <button type="button" onClick={() => setViewing(item)} className="flex-1 text-left">
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
            {item.source === "request" && isActiveRequest(item.status) && (
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

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("rideHistory.rideDetails")}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="grid gap-3">
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
              <div className="flex justify-between py-2">
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
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
