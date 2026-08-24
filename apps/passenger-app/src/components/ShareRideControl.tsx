import { createRideShare, hashShareToken, stopSharingRide } from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import { TripStatus, type Trip } from "@the-ride/types";
import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";

import { passengerFirestore, passengerFunctions } from "@/lib/firebase-client";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

const SHAREABLE_STATUSES: TripStatus[] = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_ORIGIN ?? "";

/**
 * Native port of the web app's `ShareRideControl` — same `createRideShare`
 * callable, same `stopSharingRide`, same real backend, no parallel sharing
 * system. No link is ever generated automatically: the passenger must tap
 * "Share My Ride" and then a separate "Confirm" before `createRideShare`
 * runs. The raw token only ever exists in this component's own state and
 * the resulting `Share.share()` payload — it's never itself written to
 * Firestore (see `createRideShare`'s doc comment).
 */
export function ShareRideControl({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [confirming, setConfirming] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [activeTokenHash, setActiveTokenHash] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!SHAREABLE_STATUSES.includes(trip.status)) return null;

  async function handleConfirmShare() {
    setBusy(true);
    setError(null);
    try {
      const { token } = await createRideShare(passengerFunctions, trip.id);
      const tokenHash = await hashShareToken(token);
      const url = `${WEB_ORIGIN}/share/ride?token=${token}`;
      setActiveTokenHash(tokenHash);
      setActiveUrl(url);
      setSharing(true);
      setConfirming(false);
      await Share.share({ message: url, url });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleShareAgain() {
    if (!activeUrl) return;
    await Share.share({ message: activeUrl, url: activeUrl });
  }

  async function handleStop() {
    if (!activeTokenHash) return;
    setBusy(true);
    try {
      await stopSharingRide(passengerFirestore, activeTokenHash);
      setSharing(false);
      setActiveTokenHash(null);
      setActiveUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  if (sharing) {
    return (
      <View style={[styles.box, { borderColor: palette.border }]}>
        <AppText variant="caption" tone="success">
          {t("rideHistory.shareRide.activeNotice")}
        </AppText>
        <View style={styles.row}>
          <AppButton
            label={t("rideHistory.shareRide.shareCta")}
            variant="outline"
            size="md"
            onPress={() => void handleShareAgain()}
          />
          <AppButton
            label={t("rideHistory.shareRide.stopCta")}
            variant="ghost"
            size="md"
            isLoading={busy}
            onPress={() => void handleStop()}
          />
        </View>
      </View>
    );
  }

  if (confirming) {
    return (
      <View style={[styles.box, { borderColor: palette.border }]}>
        <AppText variant="caption" tone="muted">
          {t("rideHistory.shareRide.confirmBody")}
        </AppText>
        {error && (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        )}
        <View style={styles.row}>
          <AppButton
            label={t("common.confirm")}
            size="md"
            isLoading={busy}
            onPress={() => void handleConfirmShare()}
          />
          <AppButton
            label={t("common.cancel")}
            variant="ghost"
            size="md"
            disabled={busy}
            onPress={() => setConfirming(false)}
          />
        </View>
      </View>
    );
  }

  return (
    <AppButton
      label={t("rideHistory.shareRide.cta")}
      variant="outline"
      onPress={() => setConfirming(true)}
    />
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
});
