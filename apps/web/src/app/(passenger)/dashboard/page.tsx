"use client";

import { webFirestore } from "@/lib/firebase-client";
import {
  subscribeFavoritePlaces,
  subscribeMyNotifications,
  subscribeMyTripRequests,
  subscribeMyTrips,
  subscribeMyWallet,
} from "@the-ride/firebase/client";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  type FavoritePlace,
  type Notification,
  type Trip,
  type TripRequest,
  type Wallet,
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [requests, setRequests] = useState<TripRequest[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);

  useEffect(() => {
    if (!session) return;
    const unsubRequests = subscribeMyTripRequests(webFirestore, session.uid, setRequests, () =>
      setRequests([]),
    );
    const unsubTrips = subscribeMyTrips(webFirestore, session.uid, setTrips, () => setTrips([]));
    const unsubWallet = subscribeMyWallet(webFirestore, session.uid, setWallet, () =>
      setWallet(null),
    );
    const unsubNotifications = subscribeMyNotifications(
      webFirestore,
      session.uid,
      setNotifications,
      () => setNotifications([]),
    );
    const unsubPlaces = subscribeFavoritePlaces(webFirestore, session.uid, setPlaces, () =>
      setPlaces([]),
    );
    return () => {
      unsubRequests();
      unsubTrips();
      unsubWallet();
      unsubNotifications();
      unsubPlaces();
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

  const recentRides = useMemo(() => rideItems.slice(0, 5), [rideItems]);
  const unreadCount = useMemo(
    () => (notifications ?? []).filter((n) => !n.isRead).length,
    [notifications],
  );

  if (!session || requests === null || trips === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile summary */}
      <div className="to-brand-900 tablet:flex-row tablet:items-center flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-br from-neutral-900 p-6 text-white">
        <div className="flex items-center gap-4">
          <Avatar
            src={session.photoURL ?? undefined}
            alt={session.displayName ?? session.email ?? ""}
            fallback={(session.displayName ?? session.email ?? "?").charAt(0).toUpperCase()}
            size="lg"
          />
          <div>
            <Heading level={3} className="text-white">
              {t("dashboard.welcomeBack")}, {session.displayName ?? session.email}
            </Heading>
            <Text size="sm" className="text-neutral-300">
              {session.email}
            </Text>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link href="/profile">{t("passengerNav.profile")}</Link>
        </Button>
      </div>

      <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-4">
        <Card className="duration-normal hover:shadow-elevation3 transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="car" size={18} className="text-brand" />
              {t("dashboard.currentRide")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {currentRide ? (
              <>
                <p className="text-sm font-medium">
                  {currentRide.pickup.address ?? t("rideHistory.pickup")} →{" "}
                  {currentRide.dropoff.address ?? t("rideHistory.destination")}
                </p>
                <Badge tone="brand">
                  {currentRide.source === "request"
                    ? t(`admin.rideRequestStatus.${currentRide.status}`)
                    : t(`admin.tripStatus.${currentRide.status}`)}
                </Badge>
                <Button size="sm" variant="outline" asChild className="self-start">
                  <Link href="/rides">{t("dashboard.viewDetails")}</Link>
                </Button>
              </>
            ) : (
              <>
                <Text tone="muted" size="sm">
                  {t("dashboard.noCurrentRide")}
                </Text>
                <Button size="sm" asChild className="self-start">
                  <Link href="/book">{t("passengerNav.bookRide")}</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="duration-normal hover:shadow-elevation3 transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="wallet" size={18} className="text-brand" />
              {t("wallet.balance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {wallet ? `${wallet.currency} ${wallet.balance.toFixed(2)}` : "$0.00"}
            </span>
            <Button size="sm" variant="outline" asChild className="self-start">
              <Link href="/wallet">{t("dashboard.viewDetails")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="duration-normal hover:shadow-elevation3 transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="bell" size={18} className="text-brand" />
              {t("passengerNav.notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {unreadCount}
            </span>
            <Text tone="muted" size="sm">
              {t("dashboard.unreadNotifications")}
            </Text>
            <Button size="sm" variant="outline" asChild className="self-start">
              <Link href="/notifications">{t("dashboard.viewDetails")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="tablet:grid-cols-2 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="mapPin" size={18} className="text-brand" />
              {t("passengerNav.savedPlaces")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {places === null || places.length === 0 ? (
              <Text tone="muted" size="sm">
                {t("dashboard.noFavoritePlaces")}
              </Text>
            ) : (
              <ul className="flex flex-col gap-2">
                {places.slice(0, 4).map((place) => (
                  <li key={place.id} className="flex items-center gap-2 text-sm">
                    <Icon name="mapPin" size={14} className="shrink-0 text-neutral-400" />
                    <span className="font-medium">{place.label}</span>
                    <span className="truncate text-neutral-500 dark:text-neutral-400">
                      {place.address}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" variant="outline" asChild className="self-start">
              <Link href="/saved-places">{t("dashboard.viewDetails")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="messageSquare" size={18} className="text-brand" />
              {t("dashboard.messages")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-2">
            <Badge tone="neutral">{t("dashboard.comingSoon")}</Badge>
            <Text tone="muted" size="sm">
              {t("dashboard.messagesBody")}
            </Text>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentTrips")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRides.length === 0 ? (
            <Text tone="muted" size="sm">
              {t("dashboard.noRecentTrips")}
            </Text>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentRides.map((item) => (
                <li
                  key={`${item.source}-${item.id}`}
                  className="flex items-center justify-between border-b border-neutral-100 py-2 dark:border-neutral-800"
                >
                  <span className="text-sm">
                    {item.pickup.address ?? t("rideHistory.pickup")} →{" "}
                    {item.dropoff.address ?? t("rideHistory.destination")}
                  </span>
                  <Badge tone="neutral">
                    {item.source === "request"
                      ? t(`admin.rideRequestStatus.${item.status}`)
                      : t(`admin.tripStatus.${item.status}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button size="sm" variant="outline" asChild className="mt-4">
            <Link href="/rides">{t("dashboard.viewDetails")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
