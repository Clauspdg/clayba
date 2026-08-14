"use client";

import { webFirestore } from "@/lib/firebase-client";
import { useUserExperience } from "@/hooks/useUserExperience";
import { DriverStatusBadge } from "@/components/DriverStatusBadge";
import {
  getActiveSuspensionForDriver,
  getVehicle,
  subscribeCurrentDriverTrip,
  subscribeMyRideOffers,
  subscribeMyTransactions,
  subscribeMyWallet,
} from "@the-ride/firebase/client";
import {
  Alert,
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
import {
  DriverAccountStatus,
  TransactionType,
  VehicleStatus,
  type Driver,
  type DriverSuspension,
  type RideOffer,
  type Trip,
  type Vehicle,
  type Wallet,
} from "@the-ride/types";
import { getExpiringDocuments, getOnlineEligibility } from "@the-ride/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

const ONLINE_BLOCK_REASON_KEY: Record<string, string> = {
  suspended: "driverSpace.onlineBlocked.suspended",
  inactive: "driverSpace.onlineBlocked.inactive",
  no_vehicle: "driverSpace.onlineBlocked.noVehicle",
  vehicle_not_approved: "driverSpace.onlineBlocked.vehicleNotApproved",
  document_expired: "driverSpace.onlineBlocked.documentExpired",
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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

/** Parts 16-17 — suspended (with real reason/dates) or inactive (terminated). Go Online is never reachable from here. */
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
      <div className="flex items-center justify-between">
        <Heading level={1}>{t("driverSpace.home.title")}</Heading>
        <DriverStatusBadge driver={driver} />
      </div>
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

/** Parts 4-5 — the full operational dashboard for an active driver. */
function ActiveDriverHome({ driver }: { driver: Driver }) {
  const { t, locale } = useTranslation();
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [todayEarnings, setTodayEarnings] = useState<number | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null | undefined>(undefined);
  const [pendingOffer, setPendingOffer] = useState<RideOffer | null | undefined>(undefined);

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
    () => subscribeMyWallet(webFirestore, driver.userId, setWallet, () => setWallet(null)),
    [driver.userId],
  );

  useEffect(() => {
    if (!wallet) {
      setTodayEarnings(wallet === null ? 0 : null);
      return;
    }
    return subscribeMyTransactions(
      webFirestore,
      wallet.id,
      (transactions) => {
        const today = new Date();
        const total = transactions
          .filter((tx) => tx.type === TransactionType.PAYOUT && isSameDay(tx.createdAt, today))
          .reduce((sum, tx) => sum + tx.amount, 0);
        setTodayEarnings(total);
      },
      () => setTodayEarnings(0),
    );
  }, [wallet]);

  useEffect(
    () =>
      subscribeCurrentDriverTrip(webFirestore, driver.id, setCurrentTrip, () =>
        setCurrentTrip(null),
      ),
    [driver.id],
  );

  useEffect(
    () =>
      subscribeMyRideOffers(
        webFirestore,
        driver.id,
        (offers) => setPendingOffer(offers[0] ?? null),
        () => setPendingOffer(null),
      ),
    [driver.id],
  );

  const eligibility = getOnlineEligibility(driver, vehicle ?? null);
  const expiringDocuments = getExpiringDocuments(driver.documents);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading level={1}>{t("driverSpace.home.title")}</Heading>
        <DriverStatusBadge driver={driver} />
      </div>

      {expiringDocuments.length > 0 && (
        <Alert tone="warning" title={t("driverSpace.home.documentWarningTitle")}>
          {t("driverSpace.home.documentWarningBody", { count: expiringDocuments.length })}{" "}
          <Link href="/driver/documents" className="underline">
            {t("driverSpace.nav.documents")}
          </Link>
        </Alert>
      )}

      {/* Part 5 — the most important control on the page. */}
      <Card className="shadow-elevation1">
        <CardHeader>
          <CardTitle>{t("driverSpace.home.onlineControlTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Text tone="muted" size="sm">
              {t("driverSpace.home.currentStatusLabel")}
            </Text>
            <DriverStatusBadge driver={driver} />
          </div>
          {eligibility.eligible ? (
            <>
              <Button size="lg" fullWidth disabled>
                {t("driverSpace.home.goOnlineCta")}
              </Button>
              <Text size="xs" tone="muted">
                {t("driverSpace.home.liveDispatchGapBody")}
              </Text>
            </>
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

      {pendingOffer && (
        <Card className="border-brand shadow-elevation2 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="bell" size={18} className="text-brand" />
              {t("driverSpace.home.pendingOfferTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Text tone="muted" size="sm">
              {t("driverSpace.home.pendingOfferBody")}
            </Text>
            <Button asChild className="self-start">
              <Link href="/driver/requests">{t("driverSpace.nav.requests")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {currentTrip && (
        <Card>
          <CardHeader>
            <CardTitle>{t("driverSpace.home.currentRideTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Badge tone="brand">{t(`driverSpace.tripStatus.${currentTrip.status}`)}</Badge>
            <Button variant="outline" asChild className="self-start">
              <Link href="/driver/current-ride">{t("driverSpace.nav.currentRide")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="tablet:grid-cols-2 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("driverSpace.home.vehicleCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle === undefined ? (
              <Text size="sm" tone="muted">
                {t("common.loading")}
              </Text>
            ) : vehicle ? (
              <div className="flex flex-col gap-1">
                <Text weight="medium">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </Text>
                <Text size="sm" tone="muted">
                  {vehicle.plateNumber}
                </Text>
                <Badge
                  tone={
                    vehicle.status === VehicleStatus.APPROVED ||
                    vehicle.status === VehicleStatus.ACTIVE
                      ? "success"
                      : "warning"
                  }
                  className="mt-1 w-fit"
                >
                  {t(`driverSpace.vehicleStatus.${vehicle.status}`)}
                </Badge>
              </div>
            ) : (
              <Text size="sm" tone="muted">
                {t("driverSpace.home.noVehicle")}
              </Text>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("driverSpace.home.todayCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <Text size="sm" tone="muted">
                {t("driverSpace.home.todayEarningsLabel")}
              </Text>
              <Text weight="medium">
                {todayEarnings === null
                  ? t("common.loading")
                  : new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: wallet?.currency ?? "USD",
                    }).format(todayEarnings)}
              </Text>
            </div>
            <div className="flex items-baseline justify-between">
              <Text size="sm" tone="muted">
                {t("driverSpace.home.ratingLabel")}
              </Text>
              <Text weight="medium">{driver.rating.toFixed(1)}</Text>
            </div>
            <div className="flex items-baseline justify-between">
              <Text size="sm" tone="muted">
                {t("driverSpace.home.acceptanceRateLabel")}
              </Text>
              <Text weight="medium">{Math.round(driver.acceptanceRate * 100)}%</Text>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
