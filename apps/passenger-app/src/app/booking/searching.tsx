import { useTranslation } from "@the-ride/hooks";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppStatusView } from "@/components/AppStatusView";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

type SearchPhase = "searching" | "found" | "searching_again" | "accepted" | "no_drivers";

/** A matched driver to display once "accepted" — no live dispatch session this sprint (see the scope note below). */
const SAMPLE_DRIVER = { name: "Jordan R.", rating: 4.9, vehicle: "Toyota Camry · Silver", etaMinutes: 4 };

/**
 * Searching Driver (Sprint 4, Part 9). Dispatch itself
 * (`@the-ride/firebase`'s `DispatchService`) runs server-side — this
 * screen doesn't call it directly (no authenticated session this sprint,
 * see docs/ride-request.md), so it plays a scripted version of the real
 * offer lifecycle instead: searching -> found -> (a decline, to
 * demonstrate "searching again") -> no drivers available -> retry ->
 * searching -> found -> accepted. Every state Part 9 asks for appears
 * across one attempt-then-retry cycle.
 */
export default function SearchingDriverScreen() {
  const { t } = useTranslation();
  const { cancel, reset } = useBookingStore();
  const [phase, setPhase] = useState<SearchPhase>("searching");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    setPhase("searching");

    if (attempt === 0) {
      // First attempt: a driver is found, then declines, then the search is exhausted.
      timers.push(setTimeout(() => setPhase("found"), 2500));
      timers.push(setTimeout(() => setPhase("searching_again"), 4500));
      timers.push(setTimeout(() => setPhase("no_drivers"), 7500));
    } else {
      // Retry: a driver is found and accepts.
      timers.push(setTimeout(() => setPhase("found"), 2000));
      timers.push(setTimeout(() => setPhase("accepted"), 3500));
    }

    return () => timers.forEach(clearTimeout);
  }, [attempt]);

  function handleCancel() {
    cancel();
    reset();
    router.dismissAll();
    router.replace("/booking");
  }

  function handleRetry() {
    setAttempt((count) => count + 1);
  }

  return (
    <Screen style={styles.container}>
      {phase === "searching" && <AppStatusView state="loading" title={t("booking.searchingTitle")} description={t("booking.searchingBody")} />}

      {phase === "found" && <AppStatusView state="loading" title={t("booking.driverFoundTitle")} description={t("booking.driverFoundBody")} />}

      {phase === "searching_again" && <AppStatusView state="loading" title={t("booking.searchingAgainTitle")} description={t("booking.searchingAgainBody")} />}

      {phase === "no_drivers" && (
        <AppStatusView state="error" title={t("booking.noDriversTitle")} description={t("booking.noDriversBody")} />
      )}

      {phase === "accepted" && (
        <View style={styles.acceptedContainer}>
          <AppText variant="heading">{t("booking.driverAcceptedTitle")}</AppText>
          <AppCard style={styles.driverCard}>
            <AppText variant="subheading">{SAMPLE_DRIVER.name}</AppText>
            <AppText variant="muted">{`★ ${SAMPLE_DRIVER.rating.toFixed(1)}`}</AppText>
            <AppText variant="body">{SAMPLE_DRIVER.vehicle}</AppText>
            <AppText variant="muted">{t("booking.driverEta", { minutes: SAMPLE_DRIVER.etaMinutes })}</AppText>
          </AppCard>
        </View>
      )}

      <View style={styles.footer}>
        {phase === "no_drivers" && <AppButton label={t("common.retry")} onPress={handleRetry} />}
        {phase !== "accepted" && <AppButton label={t("booking.cancelBooking")} variant="outline" onPress={handleCancel} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "space-between" },
  acceptedContainer: { flex: 1, justifyContent: "center", gap: spacing.md },
  driverCard: { gap: 4 },
  footer: { paddingBottom: spacing.md, gap: spacing.sm },
});
