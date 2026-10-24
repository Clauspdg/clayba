import { cancelTripRequest } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppStatusView } from "@/components/AppStatusView";
import { Screen } from "@/components/Screen";
import { passengerFirestore } from "@/lib/firebase-client";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

/**
 * `theride://paypal/cancel?requestId=…` — the passenger backed out on
 * PayPal. Nothing was held; the waiting `confirmed` booking is cancelled.
 */
export default function PaypalCancelScreen() {
  const { t } = useTranslation();
  const { status: authStatus } = useAuth();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const reset = useBookingStore((s) => s.reset);
  const done = useRef(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !requestId || done.current) return;
    done.current = true;
    void cancelTripRequest(passengerFirestore, requestId).catch(() => undefined);
    reset();
  }, [authStatus, requestId, reset]);

  return (
    <Screen style={styles.container}>
      <AppStatusView
        state="empty"
        title={t("payments.cancelledTitle")}
        description={t("payments.cancelledBody")}
      />
      <View style={styles.actions}>
        <AppButton
          label={t("payments.backToBooking")}
          onPress={() => router.replace("/(tabs)/home")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  actions: { marginTop: "auto" },
});
