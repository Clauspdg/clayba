"use client";

import { webFirestore, webFunctions } from "@/lib/firebase-client";
import { createRideShare, hashShareToken, stopSharingRide } from "@the-ride/firebase/client";
import { Button, Text, useToast, useTranslation } from "@the-ride/ui";
import { TripStatus, type Trip } from "@the-ride/types";
import { useState } from "react";

const SHAREABLE_STATUSES: TripStatus[] = [
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

/**
 * CLAYBA P1, Part C — "Share My Ride." No link is ever generated
 * automatically (section 31 of the brief) — the passenger must tap
 * "Share My Ride" and then a separate "Confirm" (a real two-step choice,
 * not a single accidental click) before `createRideShare` runs. The raw
 * token only ever exists in this component's own state and the resulting
 * `navigator.clipboard`/Web Share payload — it's never itself written to
 * Firestore (see `createRideShare`'s doc comment).
 */
export function ShareRideControl({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [activeTokenHash, setActiveTokenHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!SHAREABLE_STATUSES.includes(trip.status)) return null;

  async function handleConfirmShare() {
    setBusy(true);
    try {
      const { token } = await createRideShare(webFunctions, trip.id);
      const tokenHash = await hashShareToken(token);
      setActiveTokenHash(tokenHash);
      setSharing(true);
      setConfirming(false);

      const url = `${window.location.origin}/share/ride?token=${token}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: t("rideHistory.shareRide.cta"), url });
        } catch {
          // User cancelled the native share sheet — the link is still
          // active and copied below, so this isn't an error state.
        }
      }
      await navigator.clipboard.writeText(url);
      toast({ variant: "success", title: t("rideHistory.shareRide.linkCopied") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (!activeTokenHash) return;
    setBusy(true);
    try {
      await stopSharingRide(webFirestore, activeTokenHash);
      setSharing(false);
      setActiveTokenHash(null);
      toast({ variant: "success", title: t("rideHistory.shareRide.stopped") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusy(false);
    }
  }

  if (sharing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <Text size="xs" tone="muted">
          {t("rideHistory.shareRide.activeNotice")}
        </Text>
        <Button variant="outline" size="sm" isLoading={busy} onClick={() => void handleStop()}>
          {t("rideHistory.shareRide.stopCta")}
        </Button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <Text size="xs" tone="muted">
          {t("rideHistory.shareRide.confirmBody")}
        </Text>
        <div className="flex gap-2">
          <Button size="sm" isLoading={busy} onClick={() => void handleConfirmShare()}>
            {t("common.confirm")}
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      {t("rideHistory.shareRide.cta")}
    </Button>
  );
}
