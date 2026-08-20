"use client";

import { webFirestore } from "@/lib/firebase-client";
import { getRideShare, hashShareToken, subscribePublicRideShare } from "@the-ride/firebase/client";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  Icon,
  Illustration,
  LoadingState,
  Progress,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { TripStatus, type RideShare } from "@the-ride/types";
import { getLocationFreshness } from "@the-ride/utils";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  requested: "neutral",
  matched: "brand",
  en_route_to_pickup: "brand",
  arrived: "brand",
  in_progress: "brand",
  completed: "success",
  cancelled: "danger",
};

/**
 * CLAYBA P1, Part C — the public "Share My Ride" tracking page. No
 * account, no sign-in — `firestore.rules`'s `rideShares` `get` rule is
 * the one deliberately unauthenticated read in this whole app. A
 * static-export app (`apps/web/next.config.ts`) has no dynamic `[param]`
 * routes, so the token travels as `?token=`, the same pattern `/book`
 * already uses for its homepage handoff.
 */
function PublicShareContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [share, setShare] = useState<RideShare | null | undefined>(undefined);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!token) {
      setShare(null);
      return;
    }
    let cancelled = false;
    void hashShareToken(token).then((hash) => {
      if (!cancelled) setTokenHash(hash);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!tokenHash) return;
    // Seed with a one-shot read so an already-expired/revoked link (which
    // `firestore.rules` denies) resolves to "unavailable" immediately,
    // rather than sitting on a permission-denied error from onSnapshot.
    let cancelled = false;
    void getRideShare(webFirestore, tokenHash)
      .then((initial) => {
        if (!cancelled) setShare(initial);
      })
      .catch(() => {
        if (!cancelled) setShare(null);
      });
    const unsubscribe = subscribePublicRideShare(
      webFirestore,
      tokenHash,
      (next) => !cancelled && setShare(next),
      () => !cancelled && setShare(null),
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [tokenHash]);

  // Re-render periodically so a link's expiry naturally flips this page
  // to "no longer available" without requiring a new snapshot.
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!token) {
    return (
      <EmptyState
        icon={<Illustration name="empty" size={80} />}
        title={t("publicShare.notFoundTitle")}
        description={t("publicShare.notFoundBody")}
      />
    );
  }

  if (share === undefined) {
    return <LoadingState title={t("common.loading")} />;
  }

  const isUsable =
    Boolean(share) && share!.status === "active" && share!.expiresAt.getTime() > Date.now();
  if (!isUsable) {
    return (
      <EmptyState
        icon={<Illustration name="empty" size={80} />}
        title={t("publicShare.notFoundTitle")}
        description={t("publicShare.expiredBody")}
      />
    );
  }

  const view = share!.publicView;
  const ended = view.status === TripStatus.COMPLETED || view.status === TripStatus.CANCELLED;
  const freshness = ended ? "expired" : getLocationFreshness(view.driverLocationUpdatedAt);
  const hasLiveData = !ended && freshness !== "expired";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
      <div className="flex items-center gap-2">
        <Icon name="navigation" size={20} className="text-brand" />
        <Text size="lg" weight="bold">
          {t("publicShare.title")}
        </Text>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <Badge tone={STATUS_TONE[view.status] ?? "neutral"}>
              {t(`admin.tripStatus.${view.status}`)}
            </Badge>
            {hasLiveData && freshness === "fresh" && (
              <Badge tone="success">{t("rideHistory.liveTracking.live")}</Badge>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <Icon name="mapPin" size={14} className="mt-0.5 shrink-0 text-neutral-400" />
              <Text size="sm">{view.pickupLabel ?? t("rideHistory.pickup")}</Text>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="flag" size={14} className="text-brand mt-0.5 shrink-0" />
              <Text size="sm">{view.dropoffLabel ?? t("rideHistory.destination")}</Text>
            </div>
          </div>

          {(view.driverFirstName || view.vehicleMakeModel) && (
            <div className="flex flex-col gap-0.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              {view.driverFirstName && (
                <Text size="sm" weight="medium">
                  {view.driverFirstName}
                </Text>
              )}
              {view.vehicleMakeModel && (
                <Text size="xs" tone="muted">
                  {view.vehicleMakeModel}
                  {view.platePartial ? ` · ${view.platePartial}` : ""}
                </Text>
              )}
            </div>
          )}

          {ended ? (
            <Text size="sm" tone="muted">
              {view.status === TripStatus.COMPLETED
                ? t("publicShare.rideCompleted")
                : t("publicShare.rideCancelled")}
            </Text>
          ) : (
            <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              {view.progressFraction !== undefined && (
                <Progress value={view.progressFraction * 100} label={t("publicShare.title")} />
              )}
              {hasLiveData && view.etaSeconds !== undefined ? (
                <Text size="sm" tone="muted">
                  {t("rideHistory.liveTracking.etaMinutes", {
                    minutes: String(Math.max(1, Math.round(view.etaSeconds / 60))),
                  })}
                </Text>
              ) : freshness === "stale" ? (
                <Text size="sm" tone="muted">
                  {t("rideHistory.liveTracking.updatingLocation")}
                </Text>
              ) : (
                <Text size="sm" tone="muted">
                  {t("rideHistory.liveTracking.locationUnavailable")}
                </Text>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Text size="xs" tone="muted" className="text-center">
        {t("publicShare.footerNotice")}
      </Text>
    </div>
  );
}

export default function PublicShareRidePage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<LoadingState title={t("common.loading")} />}>
      <PublicShareContent />
    </Suspense>
  );
}
