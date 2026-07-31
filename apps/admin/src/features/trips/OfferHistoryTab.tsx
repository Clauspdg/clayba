"use client";

import { OfferStatus } from "@the-ride/types";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useTranslation, type BadgeProps } from "@the-ride/ui";

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

/** Illustrative — no live `RideOffersRepository` session wired into the dashboard yet. */
const OFFER_HISTORY = [
  { id: "OFR-3311", tripRequestId: "REQ-1042", driverName: "Jordan R.", radiusKm: 5, score: 0.88, status: OfferStatus.SENT },
  { id: "OFR-3310", tripRequestId: "REQ-1042", driverName: "Alex M.", radiusKm: 2, score: 0.81, status: OfferStatus.DECLINED },
  { id: "OFR-3309", tripRequestId: "REQ-1041", driverName: "Sam K.", radiusKm: 2, score: 0.93, status: OfferStatus.ACCEPTED },
  { id: "OFR-3308", tripRequestId: "REQ-1040", driverName: "Riley P.", radiusKm: 10, score: 0.71, status: OfferStatus.EXPIRED },
] as const;

export function OfferHistoryTab() {
  const { t } = useTranslation();

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
            {OFFER_HISTORY.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">{offer.id}</TableCell>
                <TableCell>{offer.tripRequestId}</TableCell>
                <TableCell>{offer.driverName}</TableCell>
                <TableCell>{offer.radiusKm} km</TableCell>
                <TableCell>{offer.score.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[offer.status]}>{t(`admin.offerStatus.${offer.status}`)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
