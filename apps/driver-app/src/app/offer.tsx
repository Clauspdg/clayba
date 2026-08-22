import { driverFirestore, driverFunctions } from "@/lib/firebase-client";
import { useDriverSession } from "@/features/drivers/useDriverSession";
import {
  acceptRideOffer,
  declineRideOffer,
  getTripRequest,
  subscribeMyRideOffers,
} from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import type { RideOffer, TripRequest } from "@the-ride/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { useNetworkStatus } from "@/lib/network-status";
import { colors, spacing } from "@/theme/tokens";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

/**
 * CLAYBA P2 — Incoming Ride Offer, wired to the real dispatch pipeline.
 * The countdown reads the offer's real `expiresAt` (section 16: "backend
 * = source de vérité", never a mobile-only timer) — ticks a local clock
 * only to redraw the "Xs" label, the actual deadline is the Firestore
 * field. Accept/Decline call the exact same `acceptRideOffer`/
 * `declineRideOffer` callables the web driver app uses.
 */
export default function IncomingOfferScreen() {
  const { t } = useTranslation();
  const { driver } = useDriverSession();
  const { isConnected } = useNetworkStatus();
  const params = useLocalSearchParams<{ offerId?: string }>();
  const [offers, setOffers] = useState<RideOffer[] | null>(null);
  const [request, setRequest] = useState<TripRequest | null | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  useEffect(() => {
    if (!driver) return;
    return subscribeMyRideOffers(driverFirestore, driver.id, setOffers, () => setOffers([]));
  }, [driver]);

  const offer = offers?.find((o) => o.id === params.offerId) ?? null;

  useEffect(() => {
    if (!offer) {
      setRequest(undefined);
      return;
    }
    let cancelled = false;
    getTripRequest(driverFirestore, offer.tripRequestId)
      .then((r) => !cancelled && setRequest(r))
      .catch(() => !cancelled && setRequest(null));
    return () => {
      cancelled = true;
    };
  }, [offer?.tripRequestId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const secondsLeft = offer ? Math.max(0, Math.round((offer.expiresAt.getTime() - now) / 1000)) : 0;

  function returnHome() {
    router.replace("/home");
  }

  async function handleAccept() {
    if (!offer || busy || !isConnected) return;
    setBusy("accept");
    try {
      await acceptRideOffer(driverFunctions, offer.id);
      router.replace("/active-ride");
    } catch {
      // A real failure (offer expired/already taken server-side) — stay on
      // this screen; the offers subscription will drop it once the
      // backend marks it no longer SENT, which naturally routes home.
    } finally {
      setBusy(null);
    }
  }

  async function handleDecline() {
    if (!offer || busy || !isConnected) return;
    setBusy("decline");
    try {
      await declineRideOffer(driverFunctions, offer.id);
    } finally {
      setBusy(null);
      returnHome();
    }
  }

  if (offers === null || (offer && request === undefined)) {
    return (
      <Screen style={styles.emptyContainer}>
        <AppText variant="body">{t("common.loading")}</AppText>
      </Screen>
    );
  }

  if (!offer || secondsLeft === 0) {
    return (
      <Screen style={styles.emptyContainer}>
        <AppText variant="subheading">{t("driverOffer.noOffer")}</AppText>
        <AppButton label={t("common.back")} variant="outline" onPress={returnHome} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <AppText variant="heading">{t("driverOffer.title")}</AppText>
        <AppText variant="heading" style={styles.countdown}>
          {t("driverOffer.countdown", { seconds: secondsLeft })}
        </AppText>
      </View>

      <AppCard style={styles.detailsCard}>
        <DetailRow
          label={t("booking.pickupLabel")}
          value={request?.pickup.address ?? t("rideHistory.pickup")}
        />
        <DetailRow
          label={t("booking.destinationLabel")}
          value={request?.dropoff.address ?? t("rideHistory.destination")}
        />
        <DetailRow
          label={t("driverSpace.requests.distanceLabel")}
          value={`${(offer.distanceMeters / 1000).toFixed(1)} km`}
        />
        <DetailRow
          label={t("driverSpace.requests.etaLabel")}
          value={`${Math.round(offer.etaSeconds / 60)} min`}
        />
        {request?.passengerCount !== undefined && (
          <DetailRow
            label={t("booking.passengerCountLabel")}
            value={String(request.passengerCount)}
          />
        )}
        <DetailRow
          label={t("driverSpace.requests.payoutLabel")}
          value={`$${offer.estimatedEarnings.toFixed(2)}`}
        />
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          label={t("driverOffer.accept")}
          size="lg"
          isLoading={busy === "accept"}
          disabled={!isConnected}
          onPress={() => void handleAccept()}
        />
        <AppButton
          label={t("driverOffer.decline")}
          variant="outline"
          size="lg"
          isLoading={busy === "decline"}
          disabled={!isConnected}
          onPress={() => void handleDecline()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  emptyContainer: { alignItems: "center", justifyContent: "center", gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  countdown: { color: colors.danger },
  detailsCard: { gap: spacing.sm },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  actions: { gap: spacing.sm, marginTop: "auto" },
});
