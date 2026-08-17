"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { OfferStatus, rideOfferSchema, type RideOffer } from "@the-ride/types";
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
import { useEffect, useState } from "react";

const STATUS_TONE: Record<OfferStatus, NonNullable<BadgeProps["tone"]>> = {
  [OfferStatus.CREATED]: "neutral",
  [OfferStatus.SENT]: "brand",
  [OfferStatus.VIEWED]: "brand",
  [OfferStatus.ACCEPTED]: "success",
  [OfferStatus.DECLINED]: "warning",
  [OfferStatus.EXPIRED]: "danger",
  [OfferStatus.CANCELLED]: "danger",
  [OfferStatus.REASSIGNED]: "neutral",
  [OfferStatus.COMPLETED]: "success",
};

/**
 * DRIVER-E2E-06 — live `rideOffers` query, replacing the earlier
 * `OFFER_HISTORY` fixture. Shows the driver's real uid (no display-name
 * field exists on `Driver`) rather than a fabricated name.
 */
export function OfferHistoryTab() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<RideOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(adminFirestore, "rideOffers"),
      orderBy("createdAt", "desc"),
      fsLimit(100),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const parsed: RideOffer[] = [];
        for (const d of snapshot.docs) {
          try {
            parsed.push(rideOfferSchema.parse({ id: d.id, ...d.data() }));
          } catch (err) {
            console.error("[OfferHistoryTab] failed to parse rideOffer", d.id, err);
          }
        }
        setOffers(parsed);
      },
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  if (error) {
    return <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />;
  }
  if (offers === null) {
    return <LoadingState title={t("common.loading")} />;
  }
  if (offers.length === 0) {
    return (
      <EmptyState
        icon={<Illustration name="empty" size={80} />}
        title={t("admin.offerHistory.noOffers")}
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.offerHistory.offer")}</TableHead>
              <TableHead>{t("admin.rideRequests.id")}</TableHead>
              <TableHead>{t("admin.driverQueue.driver")}</TableHead>
              <TableHead>{t("admin.dispatchCenter.radius")}</TableHead>
              <TableHead>{t("admin.offerHistory.score")}</TableHead>
              <TableHead>{t("admin.rideRequests.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">
                  {offer.id}
                </TableCell>
                <TableCell>{offer.tripRequestId}</TableCell>
                <TableCell>{offer.driverId}</TableCell>
                <TableCell>{offer.searchRadiusKm} km</TableCell>
                <TableCell>{offer.score.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[offer.status]}>
                    {t(`admin.offerStatus.${offer.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
