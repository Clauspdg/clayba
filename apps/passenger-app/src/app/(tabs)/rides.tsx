import { useAuth, useTranslation } from "@the-ride/hooks";
import { subscribeMyTrips } from "@the-ride/firebase/client";
import { TripStatus, type Trip } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { StatusBadge, type StatusTone } from "@/components/StatusBadge";
import { passengerFirestore } from "@/lib/firebase-client";
import { formatMoney } from "@/lib/currency";
import { spacing } from "@/theme/tokens";

type Filter = "active" | "completed" | "cancelled";

const ACTIVE_STATUSES: TripStatus[] = [
  TripStatus.REQUESTED,
  TripStatus.MATCHED,
  TripStatus.EN_ROUTE_TO_PICKUP,
  TripStatus.ARRIVED,
  TripStatus.IN_PROGRESS,
];

const STATUS_TONE: Partial<Record<TripStatus, StatusTone>> = {
  [TripStatus.MATCHED]: "brand",
  [TripStatus.EN_ROUTE_TO_PICKUP]: "brand",
  [TripStatus.ARRIVED]: "brand",
  [TripStatus.IN_PROGRESS]: "success",
  [TripStatus.COMPLETED]: "success",
  [TripStatus.CANCELLED]: "danger",
};

/** Ride history — real `subscribeMyTrips`, same function the web passenger dashboard/rides pages use. */
export default function RidesScreen() {
  const { t, locale } = useTranslation();
  const { session } = useAuth();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [filter, setFilter] = useState<Filter>("active");

  useEffect(() => {
    if (!session) return;
    return subscribeMyTrips(passengerFirestore, session.uid, setTrips, () => setTrips([]));
  }, [session]);

  const filtered = useMemo(() => {
    if (!trips) return [];
    if (filter === "active") return trips.filter((trip) => ACTIVE_STATUSES.includes(trip.status));
    if (filter === "completed") return trips.filter((trip) => trip.status === TripStatus.COMPLETED);
    return trips.filter((trip) => trip.status === TripStatus.CANCELLED);
  }, [trips, filter]);

  const filters: Array<{ key: Filter; label: string; emptyLabel: string }> = [
    { key: "active", label: t("rideHistory.active"), emptyLabel: t("rideHistory.noActive") },
    {
      key: "completed",
      label: t("rideHistory.completed"),
      emptyLabel: t("rideHistory.noCompleted"),
    },
    {
      key: "cancelled",
      label: t("rideHistory.cancelledTab"),
      emptyLabel: t("rideHistory.noCancelled"),
    },
  ];

  return (
    <Screen style={styles.container}>
      <AppText variant="title">{t("passengerNav.rideHistory")}</AppText>

      <View style={styles.tabs}>
        {filters.map((f) => (
          <AppText
            key={f.key}
            variant="body"
            tone={filter === f.key ? "brand" : "muted"}
            style={styles.tab}
            onPress={() => setFilter(f.key)}
          >
            {f.label}
          </AppText>
        ))}
      </View>

      {trips === null ? (
        <LoadingState label={t("common.loading")} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="car-outline"
          title={filters.find((f) => f.key === filter)?.emptyLabel ?? ""}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.map((trip) => {
            const isActive = ACTIVE_STATUSES.includes(trip.status);
            return (
              <Pressable
                key={trip.id}
                disabled={!isActive}
                onPress={() => router.push("/active-ride")}
              >
                <AppCard style={styles.card}>
                  <View style={styles.cardHeader}>
                    <AppText variant="caption" tone="muted">
                      {trip.requestedAt.toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </AppText>
                    <StatusBadge
                      label={t(`admin.tripStatus.${trip.status}`)}
                      tone={STATUS_TONE[trip.status] ?? "neutral"}
                    />
                  </View>
                  <AppText variant="body" numberOfLines={1}>
                    {trip.pickup.address ?? t("rideHistory.pickup")}
                  </AppText>
                  <AppText variant="body" tone="muted" numberOfLines={1}>
                    → {trip.dropoff.address ?? t("rideHistory.destination")}
                  </AppText>
                  <AppText variant="subheading">
                    {trip.finalFareBreakdown
                      ? formatMoney(
                          trip.finalFareBreakdown.total,
                          trip.finalFareBreakdown.currency,
                          locale,
                        )
                      : trip.fareAmount !== undefined
                        ? formatMoney(trip.fareAmount, "USD", locale)
                        : "—"}
                  </AppText>
                </AppCard>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  tabs: { flexDirection: "row", gap: spacing.lg },
  tab: { paddingVertical: spacing.xs },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: { gap: spacing.xs },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
