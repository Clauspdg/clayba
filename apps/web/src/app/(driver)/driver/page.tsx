"use client";

import { webFirestore, webFunctions } from "@/lib/firebase-client";
import { useDriverEarningsSummary } from "@/hooks/useDriverEarningsSummary";
import { useUserExperience } from "@/hooks/useUserExperience";
import {
  acceptRideOffer,
  declineRideOffer,
  getActiveSuspensionForDriver,
  getTripRequest,
  getVehicle,
  setOwnAvailabilityStatus,
  subscribeCurrentDriverTrip,
  subscribeDriverTripHistory,
  subscribeMyRideOffers,
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
  DriverAccountStatus,
  DriverAvailabilityStatus,
  TripStatus,
  type Driver,
  type DriverSuspension,
  type RideOffer,
  type Trip,
  type TripRequest,
  type Vehicle,
} from "@the-ride/types";
import { getExpiringDocuments, getOnlineEligibility } from "@the-ride/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ONLINE_BLOCK_REASON_KEY: Record<string, string> = {
  suspended: "driverSpace.onlineBlocked.suspended",
  inactive: "driverSpace.onlineBlocked.inactive",
  no_vehicle: "driverSpace.onlineBlocked.noVehicle",
  vehicle_not_approved: "driverSpace.onlineBlocked.vehicleNotApproved",
  document_expired: "driverSpace.onlineBlocked.documentExpired",
};

/**
 * DRIVER COMMAND CENTER — pure label lookup mirroring `current-ride/page.tsx`'s
 * `NEXT_STAGE` map (deliberately NOT the mutation logic itself — see that
 * page's `handleAdvance` for the real, double-click-guarded transition
 * write). This only decides which CTA text this preview card shows; the
 * button always navigates to `/driver/current-ride`, where the one real,
 * hardened action handler lives. Keeping the actual state-advancing logic
 * in exactly one place is deliberate — see the sprint report for why.
 */
const NEXT_STAGE_CTA_KEY: Partial<Record<TripStatus, string>> = {
  [TripStatus.MATCHED]: "driverSpace.currentRide.navigateToPickupCta",
  [TripStatus.EN_ROUTE_TO_PICKUP]: "driverSpace.currentRide.arrivedCta",
  [TripStatus.ARRIVED]: "driverSpace.currentRide.startRideCta",
  [TripStatus.IN_PROGRESS]: "driverSpace.currentRide.completeCta",
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function DriverHomePage() {
  const { t } = useTranslation();
  const { driver } = useUserExperience();

  if (!driver) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (driver.status !== DriverAccountStatus.ACTIVE) {
    return <RestrictedDriverHome driver={driver} />;
  }

  return <ActiveDriverHome driver={driver} />;
}

/** State I — suspended (with real reason/dates) or inactive (terminated). Go Online is never reachable from here. */
function RestrictedDriverHome({ driver }: { driver: Driver }) {
  const { t, locale } = useTranslation();
  const isSuspended = driver.status === DriverAccountStatus.SUSPENDED;
  const [suspension, setSuspension] = useState<DriverSuspension | null>(null);
  const [loadingSuspension, setLoadingSuspension] = useState(isSuspended);

  useEffect(() => {
    if (!isSuspended) return;
    let cancelled = false;
    getActiveSuspensionForDriver(webFirestore, driver.id)
      .then((result) => {
        if (!cancelled) setSuspension(result);
      })
      .catch((err: unknown) => console.error("[driver] failed to load suspension", err))
      .finally(() => {
        if (!cancelled) setLoadingSuspension(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuspended, driver.id]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={1}>{t("driverSpace.home.title")}</Heading>
      <Card>
        <CardContent className="flex flex-col gap-4 p-8">
          <Alert
            tone="danger"
            title={
              isSuspended
                ? t("driverSpace.restricted.suspendedTitle")
                : t("driverSpace.restricted.inactiveTitle")
            }
          >
            {isSuspended
              ? t("driverSpace.restricted.suspendedBody")
              : t("driverSpace.restricted.inactiveBody")}
          </Alert>

          {isSuspended && !loadingSuspension && suspension && (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 dark:border-neutral-800">
                <dt className="text-neutral-500 dark:text-neutral-400">
                  {t("driverSpace.restricted.reasonLabel")}
                </dt>
                <dd className="text-right font-medium">{suspension.reason}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 dark:border-neutral-800">
                <dt className="text-neutral-500 dark:text-neutral-400">
                  {t("driverSpace.restricted.sinceLabel")}
                </dt>
                <dd className="font-medium">
                  {suspension.startAt.toLocaleDateString(locale, { dateStyle: "medium" })}
                </dd>
              </div>
              {suspension.endAt && (
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-neutral-500 dark:text-neutral-400">
                    {t("driverSpace.restricted.endsLabel")}
                  </dt>
                  <dd className="font-medium">
                    {suspension.endAt.toLocaleDateString(locale, { dateStyle: "medium" })}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <Text tone="muted" size="sm">
            {t("driverSpace.restricted.stillAvailableBody")}
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/driver/account">{t("driverSpace.nav.account")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/driver/documents">{t("driverSpace.nav.documents")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/driver/support">{t("driverSpace.nav.support")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * DRIVER COMMAND CENTER — the driver's real operating picture in one
 * screen: identity, real online/offline control, whichever operational
 * card actually applies right now (current ride > available ride > idle),
 * today's real numbers, quick links, and compact real vehicle/document
 * status. Every figure here already exists elsewhere in the Driver Space
 * (Requests, Current Ride, Earnings, Trips, Vehicle, Documents,
 * Performance) — this page surfaces it, it doesn't compute anything new.
 */
function ActiveDriverHome({ driver }: { driver: Driver }) {
  const { t, locale } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [currentTrip, setCurrentTrip] = useState<Trip | null | undefined>(undefined);
  const [currentTripRequest, setCurrentTripRequest] = useState<TripRequest | null | undefined>(
    undefined,
  );
  const [offers, setOffers] = useState<RideOffer[] | null>(null);
  const [offerRequest, setOfferRequest] = useState<TripRequest | null | undefined>(undefined);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [presenceBusy, setPresenceBusy] = useState(false);
  const [tripHistory, setTripHistory] = useState<Trip[] | null>(null);

  const { summary: earningsSummary } = useDriverEarningsSummary(driver.userId);

  useEffect(() => {
    if (!driver.vehicleId) {
      setVehicle(null);
      return;
    }
    let cancelled = false;
    getVehicle(webFirestore, driver.vehicleId)
      .then((v) => !cancelled && setVehicle(v))
      .catch(() => !cancelled && setVehicle(null));
    return () => {
      cancelled = true;
    };
  }, [driver.vehicleId]);

  useEffect(
    () =>
      subscribeCurrentDriverTrip(webFirestore, driver.id, setCurrentTrip, () =>
        setCurrentTrip(null),
      ),
    [driver.id],
  );

  useEffect(() => {
    if (!currentTrip) {
      setCurrentTripRequest(currentTrip === null ? null : undefined);
      return;
    }
    let cancelled = false;
    getTripRequest(webFirestore, currentTrip.tripRequestId ?? currentTrip.id)
      .then((result) => !cancelled && setCurrentTripRequest(result))
      .catch(() => !cancelled && setCurrentTripRequest(null));
    return () => {
      cancelled = true;
    };
  }, [currentTrip]);

  useEffect(
    () => subscribeMyRideOffers(webFirestore, driver.id, setOffers, () => setOffers([])),
    [driver.id],
  );

  const pendingOffer = offers?.[0] ?? null;

  useEffect(() => {
    if (!pendingOffer) {
      setOfferRequest(undefined);
      return;
    }
    let cancelled = false;
    getTripRequest(webFirestore, pendingOffer.tripRequestId)
      .then((result) => !cancelled && setOfferRequest(result))
      .catch(() => !cancelled && setOfferRequest(null));
    return () => {
      cancelled = true;
    };
  }, [pendingOffer]);

  useEffect(
    () =>
      subscribeDriverTripHistory(webFirestore, driver.id, setTripHistory, () => setTripHistory([])),
    [driver.id],
  );

  const completedToday = useMemo(() => {
    if (!tripHistory) return null;
    const dayStart = startOfToday();
    return tripHistory.filter(
      (trip) =>
        trip.status === TripStatus.COMPLETED && trip.completedAt && trip.completedAt >= dayStart,
    ).length;
  }, [tripHistory]);

  const eligibility = getOnlineEligibility(driver, vehicle ?? null);
  const expiringDocuments = getExpiringDocuments(driver.documents);
  const isOnline = driver.availabilityStatus !== DriverAvailabilityStatus.OFFLINE;
  const isAvailableForOffers = driver.availabilityStatus === DriverAvailabilityStatus.AVAILABLE;

  async function handleGoOffline() {
    setPresenceBusy(true);
    try {
      await setOwnAvailabilityStatus(webFirestore, driver.id, DriverAvailabilityStatus.OFFLINE);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setPresenceBusy(false);
    }
  }

  async function handleGoOnline() {
    setPresenceBusy(true);
    try {
      if (!("geolocation" in navigator)) {
        await setOwnAvailabilityStatus(webFirestore, driver.id, DriverAvailabilityStatus.ONLINE);
        toast({ variant: "danger", title: t("driverSpace.home.locationUnsupported") });
        return;
      }
      const location = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
        );
      });
      if (!location) {
        await setOwnAvailabilityStatus(webFirestore, driver.id, DriverAvailabilityStatus.ONLINE);
        toast({ variant: "danger", title: t("driverSpace.home.locationDenied") });
        return;
      }
      await setOwnAvailabilityStatus(
        webFirestore,
        driver.id,
        DriverAvailabilityStatus.ONLINE,
        location,
      );
      await setOwnAvailabilityStatus(webFirestore, driver.id, DriverAvailabilityStatus.AVAILABLE);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setPresenceBusy(false);
    }
  }

  async function handleEnableLocation() {
    setPresenceBusy(true);
    try {
      if (!("geolocation" in navigator)) {
        toast({ variant: "danger", title: t("driverSpace.home.locationUnsupported") });
        return;
      }
      const location = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
        );
      });
      if (!location) {
        toast({ variant: "danger", title: t("driverSpace.home.locationDenied") });
        return;
      }
      await setOwnAvailabilityStatus(
        webFirestore,
        driver.id,
        DriverAvailabilityStatus.ONLINE,
        location,
      );
      await setOwnAvailabilityStatus(webFirestore, driver.id, DriverAvailabilityStatus.AVAILABLE);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setPresenceBusy(false);
    }
  }

  /** Same real callable + single-flight guard as `driver/requests/page.tsx` — see that page's doc comment for why this goes through a Cloud Function rather than a direct write. */
  async function handleAcceptOffer(offerId: string) {
    if (respondingId) return;
    setRespondingId(offerId);
    try {
      await acceptRideOffer(webFunctions, offerId);
      toast({ variant: "success", title: t("driverSpace.requests.accepted") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDeclineOffer(offerId: string) {
    if (respondingId) return;
    setRespondingId(offerId);
    try {
      await declineRideOffer(webFunctions, offerId);
      toast({ variant: "success", title: t("driverSpace.requests.declined") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setRespondingId(null);
    }
  }

  const label = session?.displayName ?? session?.email ?? "";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Driver Identity */}
      <div className="flex items-center gap-4">
        <Avatar
          size="lg"
          src={session?.photoURL ?? undefined}
          alt={label}
          fallback={label
            .split(/[\s@.]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Heading level={2} className="truncate">
              {label}
            </Heading>
            <Badge tone="success">{t("driverSpace.home.identityVerifiedBadge")}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
            {vehicle && (
              <span className="truncate">
                {vehicle.make} {vehicle.model} • {vehicle.plateNumber}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Icon name="star" size={14} className="text-brand" />
              {driver.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {expiringDocuments.length > 0 && (
        <Alert tone="warning" title={t("driverSpace.home.documentWarningTitle")}>
          {t("driverSpace.home.documentWarningBody", { count: expiringDocuments.length })}{" "}
          <Link href="/driver/documents" className="underline">
            {t("driverSpace.nav.documents")}
          </Link>
        </Alert>
      )}

      {/* Online / Offline — the primary control */}
      <Card className={isOnline ? "border-success border-2" : undefined}>
        <CardContent className="flex flex-col gap-3 p-6">
          <div className="flex items-center justify-between">
            <Text weight="medium">{t("driverSpace.home.onlineControlTitle")}</Text>
            <Badge tone={isOnline ? "success" : "neutral"}>
              {t(isOnline ? "driverSpace.status.online" : "driverSpace.status.offline")}
            </Badge>
          </div>

          {isOnline ? (
            <>
              <Text size="sm" tone="muted">
                {isAvailableForOffers
                  ? t("driverSpace.home.waitingForRequestsBody")
                  : t("driverSpace.home.locationRequiredBody")}
              </Text>
              {!isAvailableForOffers && (
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={presenceBusy}
                  onClick={() => void handleEnableLocation()}
                >
                  {t("driverSpace.home.enableLocationCta")}
                </Button>
              )}
              <Button
                size="lg"
                fullWidth
                variant="outline"
                isLoading={presenceBusy}
                onClick={() => void handleGoOffline()}
              >
                {t("driverSpace.home.goOfflineCta")}
              </Button>
            </>
          ) : eligibility.eligible ? (
            <Button
              size="lg"
              fullWidth
              isLoading={presenceBusy}
              onClick={() => void handleGoOnline()}
            >
              {t("driverSpace.home.goOnlineCta")}
            </Button>
          ) : (
            <>
              <Button size="lg" fullWidth disabled>
                {t("driverSpace.home.goOnlineCta")}
              </Button>
              <ul className="flex flex-col gap-1.5">
                {eligibility.reasons.map((reason) => (
                  <li key={reason} className="text-danger flex items-start gap-2 text-sm">
                    <Icon name="alertTriangle" size={16} className="mt-0.5 shrink-0" />
                    {t(ONLINE_BLOCK_REASON_KEY[reason] ?? reason)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* Current Ride OR Available Ride OR idle state — exactly one, real precedence */}
      {currentTrip ? (
        <CurrentRideCard trip={currentTrip} request={currentTripRequest} t={t} />
      ) : pendingOffer ? (
        <AvailableRideCard
          offer={pendingOffer}
          request={offerRequest}
          busy={respondingId === pendingOffer.id}
          disabled={respondingId !== null && respondingId !== pendingOffer.id}
          onAccept={() => void handleAcceptOffer(pendingOffer.id)}
          onDecline={() => void handleDeclineOffer(pendingOffer.id)}
          t={t}
        />
      ) : isOnline ? (
        <Card className="shadow-elevation1">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Icon name="bell" size={28} className="text-neutral-300 dark:text-neutral-700" />
            <Text weight="medium">{t("driverSpace.home.waitingForRequestsTitle")}</Text>
            <Text size="sm" tone="muted">
              {t("driverSpace.home.waitingForRequestsBody")}
            </Text>
          </CardContent>
        </Card>
      ) : null}

      {/* Today Overview */}
      <div>
        <Text weight="medium" className="mb-2 block">
          {t("driverSpace.home.todayCardTitle")}
        </Text>
        <div className="tablet:grid-cols-3 grid grid-cols-2 gap-3">
          <StatCard
            label={t("driverSpace.home.todayEarningsLabel")}
            value={
              earningsSummary
                ? new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(
                    earningsSummary.today,
                  )
                : "—"
            }
          />
          <StatCard
            label={t("driverSpace.home.completedTodayLabel")}
            value={completedToday !== null ? String(completedToday) : "—"}
          />
          <StatCard label={t("driverSpace.home.ratingLabel")} value={driver.rating.toFixed(1)} />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <Text weight="medium" className="mb-2 block">
          {t("driverSpace.home.quickActionsTitle")}
        </Text>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-3">
          <QuickAction
            href="/driver/requests"
            icon="bell"
            label={t("driverSpace.home.quickActionAvailableRides")}
          />
          <QuickAction
            href="/driver/earnings"
            icon="dollarSign"
            label={t("driverSpace.nav.earnings")}
          />
          <QuickAction href="/driver/trips" icon="clock" label={t("driverSpace.nav.trips")} />
          <QuickAction href="/driver/vehicle" icon="car" label={t("driverSpace.nav.vehicle")} />
          <QuickAction
            href="/driver/documents"
            icon="fileText"
            label={t("driverSpace.nav.documents")}
          />
          <QuickAction href="/driver/account" icon="user" label={t("driverSpace.nav.account")} />
          <QuickAction
            href="/driver/support"
            icon="lifeBuoy"
            label={t("driverSpace.nav.support")}
          />
        </div>
      </div>

      {/* Driver Performance */}
      <div>
        <Text weight="medium" className="mb-2 block">
          {t("driverSpace.nav.performance")}
        </Text>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-3">
          <StatCard label={t("driverSpace.home.ratingLabel")} value={driver.rating.toFixed(1)} />
          <StatCard
            label={t("driverSpace.home.acceptanceRateLabel")}
            value={`${Math.round(driver.acceptanceRate * 100)}%`}
          />
          <StatCard
            label={t("driverSpace.performance.cancellationRateLabel")}
            value={`${Math.round(driver.cancellationRate * 100)}%`}
          />
          <StatCard
            label={t("driverSpace.performance.completedTripsLabel")}
            value={String(driver.completedTrips)}
          />
        </div>
      </div>

      {/* Vehicle / Documents */}
      <div className="tablet:grid-cols-2 grid gap-4">
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <Text size="sm" weight="medium" tone="muted">
              {t("driverSpace.home.vehicleCardTitle")}
            </Text>
            {vehicle ? (
              <>
                <Text weight="medium">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </Text>
                <Text size="sm" tone="muted">
                  {vehicle.plateNumber}
                </Text>
              </>
            ) : (
              <Text size="sm" tone="muted">
                {t("driverSpace.home.noVehicle")}
              </Text>
            )}
            <Button variant="outline" size="sm" asChild className="self-start">
              <Link href="/driver/vehicle">{t("driverSpace.home.viewVehicleCta")}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <Text size="sm" weight="medium" tone="muted">
              {t("driverSpace.nav.documents")}
            </Text>
            <Text size="sm" tone="muted">
              {driver.documents.length > 0
                ? t("driverSpace.home.documentWarningBody", { count: expiringDocuments.length })
                : t("driverSpace.documents.emptyTitle")}
            </Text>
            <Button variant="outline" size="sm" asChild className="self-start">
              <Link href="/driver/documents">{t("driverSpace.home.viewDocumentsCta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <Text size="lg" weight="medium">
          {value}
        </Text>
        <Text size="xs" tone="muted">
          {label}
        </Text>
      </CardContent>
    </Card>
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
  trip,
  request,
  t,
}: {
  trip: Trip;
  request: TripRequest | null | undefined;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const ctaKey = NEXT_STAGE_CTA_KEY[trip.status];
  return (
    <Card className="border-brand shadow-elevation2 border-2">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <Text weight="medium">{t("driverSpace.home.currentRideTitle")}</Text>
          <Badge tone="brand">{t(`driverSpace.tripStatus.${trip.status}`)}</Badge>
        </div>

        {request && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <Icon name="mapPin" size={16} className="text-success mt-0.5 shrink-0" />
              <Text size="sm">
                {request.pickup.address ?? `${request.pickup.lat}, ${request.pickup.lng}`}
              </Text>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="flag" size={16} className="text-danger mt-0.5 shrink-0" />
              <Text size="sm">
                {request.dropoff.address ?? `${request.dropoff.lat}, ${request.dropoff.lng}`}
              </Text>
            </div>
          </div>
        )}

        {trip.fareAmount !== undefined && (
          <Text size="sm" tone="muted">
            {t("driverSpace.currentRide.fareLabel")}: ${trip.fareAmount.toFixed(2)}
          </Text>
        )}

        <div className="flex gap-3">
          {ctaKey && (
            <Button size="lg" fullWidth asChild>
              <Link href="/driver/current-ride">{t(ctaKey)}</Link>
            </Button>
          )}
          {!ctaKey && (
            <Button size="lg" fullWidth variant="outline" asChild>
              <Link href="/driver/current-ride">
                {t("driverSpace.home.viewCurrentRideDetails")}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AvailableRideCard({
  offer,
  request,
  busy,
  disabled,
  onAccept,
  onDecline,
  t,
}: {
  offer: RideOffer;
  request: TripRequest | null | undefined;
  busy: boolean;
  disabled: boolean;
  onAccept: () => void;
  onDecline: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <Card className="border-brand shadow-elevation2 border-2">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2">
          <Icon name="bell" size={18} className="text-brand" />
          <Text weight="medium">{t("driverSpace.home.availableRideTitle")}</Text>
        </div>

        {request === undefined ? (
          <Text size="sm" tone="muted">
            {t("common.loading")}
          </Text>
        ) : request ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <Icon name="mapPin" size={16} className="text-success mt-0.5 shrink-0" />
              <Text size="sm">
                {request.pickup.address ?? `${request.pickup.lat}, ${request.pickup.lng}`}
              </Text>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="flag" size={16} className="text-danger mt-0.5 shrink-0" />
              <Text size="sm">
                {request.dropoff.address ?? `${request.dropoff.lat}, ${request.dropoff.lng}`}
              </Text>
            </div>
          </div>
        ) : (
          <Text size="sm" tone="muted">
            {t("driverSpace.requests.detailsUnavailable")}
          </Text>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <Text size="sm" tone="muted">
            {t("driverSpace.home.pickupDistanceLabel", {
              distance: `${(offer.distanceMeters / 1000).toFixed(1)} km`,
            })}
          </Text>
          {request?.estimatedDistanceMeters !== undefined && (
            <Text size="sm" tone="muted">
              {t("driverSpace.home.tripDistanceLabel", {
                distance: `${(request.estimatedDistanceMeters / 1000).toFixed(1)} km`,
              })}
            </Text>
          )}
          <Text size="sm" tone="muted">
            {t("driverSpace.requests.etaLabel")}: {Math.round(offer.etaSeconds / 60)} min
          </Text>
          {request?.passengerCount !== undefined && (
            <Text size="sm" tone="muted">
              {t("booking.passengerCountLabel")}: {request.passengerCount}
            </Text>
          )}
        </div>

        <Text size="lg" weight="medium">
          {t("driverSpace.requests.payoutLabel")}: ${offer.estimatedEarnings.toFixed(2)}
        </Text>

        <div className="flex gap-3">
          <Button fullWidth isLoading={busy} disabled={disabled} onClick={onAccept}>
            {t("driverSpace.requests.acceptCta")}
          </Button>
          <Button
            fullWidth
            variant="outline"
            isLoading={busy}
            disabled={disabled}
            onClick={onDecline}
          >
            {t("driverSpace.requests.declineCta")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
