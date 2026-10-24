import { authorizePaypal } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppStatusView } from "@/components/AppStatusView";
import { Screen } from "@/components/Screen";
import { passengerFunctions } from "@/lib/firebase-client";
import { useBookingStore } from "@/stores/booking-store";
import { spacing } from "@/theme/tokens";

/**
 * `theride://paypal/return?requestId=…` — opened by the web app's
 * /payment/paypal/return page once the passenger approved on PayPal.
 * Authorizes the hold (which starts the driver search server-side), then
 * continues to the usual searching screen.
 */
export default function PaypalReturnScreen() {
  const { t } = useTranslation();
  const { status: authStatus } = useAuth();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const confirm = useBookingStore((s) => s.confirm);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (authStatus === "loading" || started.current) return;
    if (!requestId || authStatus === "unauthenticated") {
      setFailed(true);
      return;
    }
    started.current = true;
    authorizePaypal(passengerFunctions, requestId)
      .then(() => {
        // The store may be empty if Android killed the app while PayPal was open.
        confirm(requestId);
        router.replace("/booking/searching");
      })
      .catch(() => setFailed(true));
  }, [authStatus, requestId, confirm]);

  if (!failed) {
    return <AppStatusView state="loading" title={t("payments.authorizingTitle")} />;
  }

  return (
    <Screen style={styles.container}>
      <AppStatusView
        state="error"
        title={t("payments.failedTitle")}
        description={t("payments.failedBody")}
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
