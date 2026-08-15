"use client";

import { webFirestore } from "@/lib/firebase-client";
import {
  subscribeMyNotifications,
  subscribeMyTripRequests,
  subscribeMyTrips,
} from "@the-ride/firebase/client";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Icon,
  LoadingState,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import {
  TripRequestStatus,
  TripStatus,
  type Notification,
  type Trip,
  type TripRequest,
} from "@the-ride/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RideItem = ({ source: "request" } & TripRequest) | ({ source: "trip" } & Trip);

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

/**
 * UX Simplification sprint, Part 2 — was 7 equally-weighted cards (current
 * ride, wallet, notifications, saved places, a "coming soon" messages
 * stub, and a recent-trips list) competing for attention on first load.
 * Reduced to the one thing this screen needs to answer — "book a ride, or
 * see the one already in progress" — plus a single thin alert strip when
 * there's something to flag. Wallet/saved places/notifications/recent
 * trips aren't gone: they're one click away via `PassengerSidebar`'s own
 * ACCOUNT group (Part 3), which is where a page whose job is "manage X"
 * belongs, rather than duplicated as a preview card here too.
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [requests, setRequests] = useState<TripRequest[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  useEffect(() => {
    if (!session) return;
    const unsubRequests = subscribeMyTripRequests(webFirestore, session.uid, setRequests, () =>
      setRequests([]),
    );
    const unsubTrips = subscribeMyTrips(webFirestore, session.uid, setTrips, () => setTrips([]));
    const unsubNotifications = subscribeMyNotifications(
      webFirestore,
      session.uid,
      setNotifications,
      () => setNotifications([]),
    );
    return () => {
      unsubRequests();
      unsubTrips();
      unsubNotifications();
    };
  }, [session]);

  const rideItems = useMemo<RideItem[]>(
    () => [
      ...(requests ?? []).map((r) => ({ source: "request" as const, ...r })),
      ...(trips ?? []).map((tr) => ({ source: "trip" as const, ...tr })),
    ],
    [requests, trips],
  );

  const currentRide = useMemo(
    () =>
      rideItems.find((item) =>
        item.source === "request" ? isActiveRequest(item.status) : isActiveTrip(item.status),
      ),
    [rideItems],
  );

  const unreadCount = useMemo(
    () => (notifications ?? []).filter((n) => !n.isRead).length,
    [notifications],
  );

  if (!session || requests === null || trips === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar
          src={session.photoURL ?? undefined}
          alt={session.displayName ?? session.email ?? ""}
          fallback={(session.displayName ?? session.email ?? "?").charAt(0).toUpperCase()}
        />
        <Heading level={2}>
          {t("dashboard.welcomeBack")}, {session.displayName ?? session.email}
        </Heading>
      </div>

      {unreadCount > 0 && (
        <Link
          href="/notifications"
          className="hover:border-brand flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm transition-colors dark:border-neutral-800"
        >
          <Icon name="bell" size={16} className="text-brand shrink-0" />
          <Text size="sm">{t("dashboard.unreadNotificationsAlert", { count: unreadCount })}</Text>
        </Link>
      )}

      {currentRide ? (
        <Card className="border-brand shadow-elevation2 border-2">
          <CardContent className="flex flex-col gap-4 p-8">
            <div className="flex items-center justify-between">
              <Text size="sm" tone="muted" weight="medium">
                {t("dashboard.currentRide")}
              </Text>
              <Badge tone="brand">
                {currentRide.source === "request"
                  ? t(`admin.rideRequestStatus.${currentRide.status}`)
                  : t(`admin.tripStatus.${currentRide.status}`)}
              </Badge>
            </div>
            <Text size="lg" weight="medium">
              {currentRide.pickup.address ?? t("rideHistory.pickup")} →{" "}
              {currentRide.dropoff.address ?? t("rideHistory.destination")}
            </Text>
            <Button asChild className="self-start">
              <Link href="/rides">{t("dashboard.viewDetails")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-elevation1">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <Icon name="car" size={32} className="text-brand" />
            <Heading level={3}>{t("dashboard.noCurrentRide")}</Heading>
            <Button size="lg" asChild>
              <Link href="/book">{t("passengerNav.bookRide")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
