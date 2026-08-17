"use client";

import { webFirestore, webFunctions } from "@/lib/firebase-client";
import { useUserExperience } from "@/hooks/useUserExperience";
import {
  acceptRideOffer,
  declineRideOffer,
  getTripRequest,
  subscribeMyRideOffers,
} from "@the-ride/firebase/client";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Heading,
  Icon,
  Illustration,
  LoadingState,
  Text,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { DriverAccountStatus, type RideOffer, type TripRequest } from "@the-ride/types";
import { useEffect, useState } from "react";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 6, completed DRIVER-E2E-07 —
 * real `rideOffers` for this driver, `status == 'sent'`, with real
 * Accept/Decline actions. `firestore.rules`' `rideOffers` collection is
 * still `allow write: if isAdmin()` (accept/decline transitions still go
 * through `DispatchService` server-side only) — these buttons call the
 * `acceptRideOffer`/`declineRideOffer` callable Cloud Functions instead of
 * writing directly, which is the trusted server-side path into that same
 * unmodified service. `respondingId` guards against a double-submit (rapid
 * double-click / stale re-render): only one offer can be in flight at a
 * time, and its own buttons disable immediately.
 */
export default function DriverRequestsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { driver } = useUserExperience();
  const [offers, setOffers] = useState<RideOffer[] | null>(null);
  const [requests, setRequests] = useState<Record<string, TripRequest | null>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function handleAccept(offerId: string) {
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

  async function handleDecline(offerId: string) {
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

  useEffect(() => {
    if (!driver) return;
    return subscribeMyRideOffers(webFirestore, driver.id, setOffers, () => setOffers([]));
  }, [driver]);

  useEffect(() => {
    if (!offers) return;
    let cancelled = false;
    for (const offer of offers) {
      if (offer.tripRequestId in requests) continue;
      getTripRequest(webFirestore, offer.tripRequestId)
        .then((request) => {
          if (!cancelled)
            setRequests((current) => ({ ...current, [offer.tripRequestId]: request }));
        })
        .catch(() => {
          if (!cancelled) setRequests((current) => ({ ...current, [offer.tripRequestId]: null }));
        });
    }
    return () => {
      cancelled = true;
    };
    // `requests` is intentionally excluded from this dependency array:
    // including it would re-run this effect on every fetch it itself triggers.
  }, [offers]);

  if (!driver) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  const isOnline = driver.status === DriverAccountStatus.ACTIVE;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={1}>{t("driverSpace.nav.requests")}</Heading>

      {offers === null ? (
        <LoadingState title={t("common.loading")} />
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={
            isOnline
              ? t("driverSpace.requests.emptyOnlineTitle")
              : t("driverSpace.requests.emptyOfflineTitle")
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {offers.map((offer) => {
            const request = requests[offer.tripRequestId];
            return (
              <Card key={offer.id}>
                <CardContent className="flex flex-col gap-3 p-6">
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
                          {request.dropoff.address ??
                            `${request.dropoff.lat}, ${request.dropoff.lng}`}
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
                      {t("driverSpace.requests.distanceLabel")}:{" "}
                      {(offer.distanceMeters / 1000).toFixed(1)} km
                    </Text>
                    <Text size="sm" tone="muted">
                      {t("driverSpace.requests.etaLabel")}: {Math.round(offer.etaSeconds / 60)} min
                    </Text>
                    <Text size="sm" tone="muted">
                      {t("driverSpace.requests.payoutLabel")}: ${offer.estimatedEarnings.toFixed(2)}
                    </Text>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      fullWidth
                      isLoading={respondingId === offer.id}
                      disabled={respondingId !== null && respondingId !== offer.id}
                      onClick={() => void handleAccept(offer.id)}
                    >
                      {t("driverSpace.requests.acceptCta")}
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      isLoading={respondingId === offer.id}
                      disabled={respondingId !== null && respondingId !== offer.id}
                      onClick={() => void handleDecline(offer.id)}
                    >
                      {t("driverSpace.requests.declineCta")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
