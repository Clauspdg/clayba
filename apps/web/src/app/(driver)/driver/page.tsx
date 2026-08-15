"use client";

import { webFirestore } from "@/lib/firebase-client";
import { useUserExperience } from "@/hooks/useUserExperience";
import {
  getActiveSuspensionForDriver,
  getVehicle,
  subscribeCurrentDriverTrip,
  subscribeMyRideOffers,
} from "@the-ride/firebase/client";
import {
  Alert,
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
import {
  DriverAccountStatus,
  DriverAvailabilityStatus,
  type Driver,
  type DriverSuspension,
  type RideOffer,
  type Trip,
  type Vehicle,
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
 * UX Simplification sprint, Part 4 — was five cards showing simultaneously
 * (online control, pending offer, current ride, vehicle, today's stats),
 * all at equal visual weight regardless of which one actually mattered
 * right now. Rebuilt state-driven: exactly ONE primary card renders,
 * chosen by real precedence (a ride offer outranks an idle "online"
 * state; an active trip outranks both) — matching the state table this
 * sprint's spec lists (offline/online-idle/offer/current-ride). Vehicle
 * and earnings summaries are gone from this page entirely — they're a
 * "manage X" concern that belongs on their own nav pages (Part 5), not a
 * dashboard preview competing with the operational state.
 */
function ActiveDriverHome({ driver }: { driver: Driver }) {
  const { t } = useTranslation();
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
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
  const isOnline = driver.availabilityStatus !== DriverAvailabilityStatus.OFFLINE;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={1}>{t("driverSpace.home.title")}</Heading>

      {expiringDocuments.length > 0 && (
        <Alert tone="warning" title={t("driverSpace.home.documentWarningTitle")}>
          {t("driverSpace.home.documentWarningBody", { count: expiringDocuments.length })}{" "}
          <Link href="/driver/documents" className="underline">
            {t("driverSpace.nav.documents")}
          </Link>
        </Alert>
      )}

      {pendingOffer ? (
        <Card className="border-brand shadow-elevation2 border-2">
          <CardContent className="flex flex-col gap-4 p-8">
            <div className="flex items-center gap-2">
              <Icon name="bell" size={20} className="text-brand" />
              <Text weight="medium">{t("driverSpace.home.pendingOfferTitle")}</Text>
            </div>
            <Text tone="muted" size="sm">
              {t("driverSpace.home.pendingOfferBody")}
            </Text>
            <Button size="lg" asChild>
              <Link href="/driver/requests">{t("driverSpace.nav.requests")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : currentTrip ? (
        <Card className="shadow-elevation1">
          <CardContent className="flex flex-col gap-4 p-8">
            <div className="flex items-center justify-between">
              <Text weight="medium">{t("driverSpace.home.currentRideTitle")}</Text>
              <Badge tone="brand">{t(`driverSpace.tripStatus.${currentTrip.status}`)}</Badge>
            </div>
            <Button size="lg" asChild>
              <Link href="/driver/current-ride">{t("driverSpace.nav.currentRide")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-elevation1">
          <CardContent className="flex flex-col gap-4 p-8">
            {isOnline ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Icon name="bell" size={28} className="text-neutral-300 dark:text-neutral-700" />
                <Text weight="medium">{t("driverSpace.home.waitingForRequestsTitle")}</Text>
                <Text size="sm" tone="muted">
                  {t("driverSpace.home.waitingForRequestsBody")}
                </Text>
              </div>
            ) : eligibility.eligible ? (
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
      )}
    </div>
  );
}
