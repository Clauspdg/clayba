"use client";

import { loadBookingDraft } from "@/lib/booking-draft";
import { webFirestore } from "@/lib/firebase-client";
import {
  cancelTripRequest,
  getOrCreatePassengerProfile,
  getVehicle,
  subscribeFavoritePlaces,
  subscribeMyNotifications,
  subscribeMyTripRequests,
  subscribeMyTrips,
  subscribeMyWallet,
} from "@the-ride/firebase/client";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Icon,
  LoadingState,
  Text,
  useToast,
  useTranslation,
  type IconName,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import {
  TripRequestStatus,
  TripStatus,
  type FavoritePlace,
  type Notification,
  type Trip,
  type TripRequest,
  type Vehicle,
  type Wallet,
} from "@the-ride/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RideItem = ({ source: "request" } & TripRequest) | ({ source: "trip" } & Trip);

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
// picked up stayed "active" — and therefore "the current ride" — forever.
// Treating a past-`expiresAt` request as inactive is a display-only
// honesty fix: it doesn't touch dispatch or write anything, it just stops
// presenting a dead search as if someone is still looking for a driver.
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

// FUNCTIONAL-STABILIZATION — mirrors `rides/page.tsx`'s own
// `isSupersededByTrip`: `DispatchService.handleOfferAccepted` sets a
// request's status to `driver_accepted` and creates the real `trips` doc
// from it in the same operation, and nothing ever advances the request's
// own status past that afterward — it's a historical artifact once the
// trip exists, not a second "current ride." Without this, this card
// treated that frozen `driver_accepted` request as active forever, even
// long after the real trip it produced had completed.
function isSupersededByTrip(status: TripRequestStatus): boolean {
  return status === TripRequestStatus.DRIVER_ACCEPTED;
}

function isActiveTrip(status: TripStatus): boolean {
  return ![TripStatus.COMPLETED, TripStatus.CANCELLED].includes(status);
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

/**
 * PASSENGER COMMAND CENTER — same philosophy as the Driver Command Center:
 * real data only, current ride always wins, everything else is one click
 * away. Two things brief mockups implied but don't exist in this codebase
 * are deliberately NOT shown: a "Next Scheduled Ride" section (no
 * `scheduledFor`-equivalent field exists anywhere on `tripRequestSchema` —
 * "Schedule for later" on /book is UI-only, confirmed in an earlier
 * sprint) and the assigned driver's name/photo/rating (firestore.rules'
 * `drivers/{driverId}` read rule only grants the driver's own owner or
 * staff — a passenger has no legitimate read path to it; showing it would
 * mean either fabricating data or a real security-rule change out of this
 * task's scope). Vehicle info IS shown — `getVehicle` is already
 * passenger-readable, the same call `/rides` already makes.
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TripRequest[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [cancelling, setCancelling] = useState(false);
  const [draft] = useState(() => loadBookingDraft());

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
    const unsubWallet = subscribeMyWallet(webFirestore, session.uid, setWallet, () =>
      setWallet(null),
    );
    let unsubPlaces: (() => void) | undefined;
    let cancelled = false;
    getOrCreatePassengerProfile(webFirestore, session.uid)
      .then(() => {
        if (cancelled) return;
        unsubPlaces = subscribeFavoritePlaces(webFirestore, session.uid, setPlaces, () =>
          setPlaces([]),
        );
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      });
    return () => {
      cancelled = true;
      unsubRequests();
      unsubTrips();
      unsubNotifications();
      unsubWallet();
      unsubPlaces?.();
    };
  }, [session]);

  const rideItems = useMemo<RideItem[]>(
    () => [
      ...(requests ?? [])
        .filter((r) => !isSupersededByTrip(r.status))
        .map((r) => ({ source: "request" as const, ...r })),
      ...(trips ?? []).map((tr) => ({ source: "trip" as const, ...tr })),
    ],
    [requests, trips],
  );

  const currentRide = useMemo(
    () =>
      rideItems.find((item) =>
        item.source === "request"
          ? isActiveRequest(item.status, item.expiresAt)
          : isActiveTrip(item.status),
      ),
    [rideItems],
  );

  useEffect(() => {
    if (!currentRide || currentRide.source !== "trip" || !currentRide.vehicleId) {
      setCurrentVehicle(currentRide?.source === "trip" ? null : undefined);
      return;
    }
    let cancelled = false;
    getVehicle(webFirestore, currentRide.vehicleId)
      .then((v) => !cancelled && setCurrentVehicle(v))
      .catch(() => !cancelled && setCurrentVehicle(null));
    return () => {
      cancelled = true;
    };
  }, [currentRide]);

  const recentRide = useMemo(() => {
    const completed = (trips ?? []).filter((tr) => tr.status === TripStatus.COMPLETED);
    return completed.sort(
      (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    )[0];
  }, [trips]);

  const unreadCount = useMemo(
    () => (notifications ?? []).filter((n) => !n.isRead).length,
    [notifications],
  );

  async function handleCancel(requestId: string) {
    setCancelling(true);
    try {
      await cancelTripRequest(webFirestore, requestId);
      toast({ variant: "success", title: t("rideHistory.cancelled") });
    } catch (err) {
      console.error("[dashboard] failed to cancel trip request", err);
      toast({ variant: "danger", title: t("common.error") });
    } finally {
      setCancelling(false);
    }
  }

  if (!session || requests === null || trips === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  const hasBookingDraft =
    !currentRide && Boolean(draft && (draft.pickup.text.trim() || draft.destination.text.trim()));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar
          src={session.photoURL ?? undefined}
          alt={session.displayName ?? session.email ?? ""}
          fallback={(session.displayName ?? session.email ?? "?").charAt(0).toUpperCase()}
        />
        <div>
          <Heading level={2}>
            {t(getGreetingKey())}
            {session.displayName ? `, ${session.displayName}` : ""}
          </Heading>
          <Text size="sm" tone="muted">
            {t("dashboard.readyPrompt")}
          </Text>
        </div>
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
        <CurrentRideCard
          item={currentRide}
          vehicle={currentVehicle}
          onCancel={() => void handleCancel(currentRide.id)}
          cancelling={cancelling}
          t={t}
        />
      ) : hasBookingDraft ? (
        <Card className="shadow-elevation1">
          <CardContent className="flex flex-col gap-3 p-8 text-center">
            <Icon name="car" size={28} className="text-brand mx-auto" />
            <Text weight="medium">{t("dashboard.continueBookingTitle")}</Text>
            <Button size="lg" asChild>
              <Link href="/book">{t("dashboard.continueBookingCta")}</Link>
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

      <div>
        <Text weight="medium" className="mb-2 block">
          {t("dashboard.quickActionsTitle")}
        </Text>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction href="/book" icon="car" label={t("passengerNav.bookRide")} />
          <QuickAction href="/rides" icon="clock" label={t("passengerNav.rideHistory")} />
          <QuickAction href="/saved-places" icon="mapPin" label={t("passengerNav.savedPlaces")} />
          <QuickAction href="/wallet" icon="wallet" label={t("passengerNav.wallet")} />
          <QuickAction href="/support" icon="lifeBuoy" label={t("passengerNav.support")} />
          <QuickAction href="/profile" icon="user" label={t("passengerNav.profile")} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Text weight="medium">{t("dashboard.savedPlacesTitle")}</Text>
          <Link href="/saved-places" className="text-brand text-sm hover:underline">
            {t("common.seeAll")}
          </Link>
        </div>
        {places === null ? (
          <Text size="sm" tone="muted">
            {t("common.loading")}
          </Text>
        ) : places.length === 0 ? (
          <Text size="sm" tone="muted">
            {t("dashboard.noFavoritePlaces")}
          </Text>
        ) : (
          <div className="flex flex-wrap gap-2">
            {places.slice(0, 3).map((place) => (
              <span
                key={place.id}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
              >
                {place.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {recentRide && (
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <Text weight="medium" tone="muted" size="sm">
              {t("dashboard.recentRideTitle")}
            </Text>
            <Text weight="medium">
              {recentRide.pickup.address ?? t("rideHistory.pickup")} →{" "}
              {recentRide.dropoff.address ?? t("rideHistory.destination")}
            </Text>
            <div className="flex items-center justify-between">
              <Badge tone="success">{t("admin.tripStatus.completed")}</Badge>
              {recentRide.fareAmount !== undefined && (
                <Text weight="medium">${recentRide.fareAmount.toFixed(2)}</Text>
              )}
            </div>
            <Button variant="outline" size="sm" asChild className="self-start">
              <Link href="/rides">{t("dashboard.viewRideCta")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-2 p-5">
          <Text weight="medium" tone="muted" size="sm">
            {t("dashboard.paymentTitle")}
          </Text>
          {wallet === undefined ? (
            <Text size="sm" tone="muted">
              {t("common.loading")}
            </Text>
          ) : wallet ? (
            <Text size="lg" weight="medium">
              {wallet.currency} {wallet.balance.toFixed(2)}
            </Text>
          ) : (
            <Text size="sm" tone="muted">
              {t("wallet.noWallet")}
            </Text>
          )}
          <Button variant="outline" size="sm" asChild className="self-start">
            <Link href="/wallet">{t("dashboard.managePaymentsCta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return (
    <Link
      href={href}
      className="duration-fast hover:border-brand hover:bg-brand-50 dark:hover:bg-brand-900 flex flex-col items-center gap-2 rounded-xl border border-neutral-200 p-4 text-center transition-colors dark:border-neutral-800"
    >
      <Icon name={icon} size={20} className="text-brand" />
      <Text size="xs" weight="medium">
        {label}
      </Text>
    </Link>
  );
}

function CurrentRideCard({
  item,
  vehicle,
  onCancel,
  cancelling,
  t,
}: {
  item: RideItem;
  vehicle: Vehicle | null | undefined;
  onCancel: () => void;
  cancelling: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const isRequest = item.source === "request";

  return (
    <Card className="border-brand shadow-elevation2 border-2">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <Text weight="medium">{t("dashboard.currentRide")}</Text>
          <Badge tone="brand">
            {isRequest
              ? t(`admin.rideRequestStatus.${item.status}`)
              : t(`admin.tripStatus.${item.status}`)}
          </Badge>
        </div>

        {isRequest && item.status === TripRequestStatus.SEARCHING_DRIVER && (
          <Text size="sm" tone="muted">
            {t("booking.searchingBody")}
          </Text>
        )}
        {!isRequest && item.status === TripStatus.EN_ROUTE_TO_PICKUP && (
          <Alert tone="brand" title={t("rideHistory.driverOnWayTitle")}>
            {item.driverLocationUpdatedAt
              ? t("rideHistory.driverLocationFreshness", {
                  time: item.driverLocationUpdatedAt.toLocaleTimeString(),
                })
              : t("rideHistory.driverLocationUnavailable")}
          </Alert>
        )}
        {!isRequest && item.status === TripStatus.ARRIVED && (
          <Alert tone="success" title={t("rideHistory.driverArrivedTitle")}>
            {t("rideHistory.driverArrivedBody")}
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <Icon name="mapPin" size={16} className="text-success mt-0.5 shrink-0" />
            <Text size="sm">{item.pickup.address ?? `${item.pickup.lat}, ${item.pickup.lng}`}</Text>
          </div>
          <div className="flex items-start gap-2">
            <Icon name="flag" size={16} className="text-danger mt-0.5 shrink-0" />
            <Text size="sm">
              {item.dropoff.address ?? `${item.dropoff.lat}, ${item.dropoff.lng}`}
            </Text>
          </div>
        </div>

        {!isRequest &&
          (vehicle === undefined ? (
            <Text size="sm" tone="muted">
              {t("common.loading")}
            </Text>
          ) : vehicle ? (
            <Text size="sm" tone="muted">
              {vehicle.color} {vehicle.make} {vehicle.model} · {vehicle.plateNumber}
            </Text>
          ) : (
            <Text size="sm" tone="muted">
              {t("rideHistory.vehicleUnavailable")}
            </Text>
          ))}

        {isRequest && item.fareEstimate && (
          <Text size="sm" tone="muted">
            {t("rideHistory.fare")}: ${item.fareEstimate.total.toFixed(2)}
          </Text>
        )}
        {!isRequest && item.fareAmount !== undefined && (
          <Text size="sm" tone="muted">
            {t("rideHistory.fare")}: ${item.fareAmount.toFixed(2)}
          </Text>
        )}

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href="/rides">{t("dashboard.viewDetails")}</Link>
          </Button>
          {isRequest && isActiveRequest(item.status, item.expiresAt) && (
            <Button variant="outline" isLoading={cancelling} onClick={onCancel}>
              {t("rideHistory.cancelRide")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
