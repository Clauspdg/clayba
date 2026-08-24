import { useAuth, useTranslation } from "@the-ride/hooks";
import { subscribeMyWallet } from "@the-ride/firebase/client";
import type { Wallet } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { ListDivider, ListRow } from "@/components/ListRow";
import { Screen } from "@/components/Screen";
import { passengerFirestore } from "@/lib/firebase-client";
import { formatMoney } from "@/lib/currency";
import { spacing } from "@/theme/tokens";

/** Account hub — profile header + real Wallet balance + links to Saved/Settings/Emergency Contacts. */
export default function AccountScreen() {
  const { t, locale } = useTranslation();
  const { session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);

  useEffect(() => {
    if (!session) return;
    return subscribeMyWallet(passengerFirestore, session.uid, setWallet, () => setWallet(null));
  }, [session]);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Avatar photoURL={session?.photoURL} name={session?.displayName} size={72} />
        <AppText variant="title">{session?.displayName || "—"}</AppText>
        {session?.email && (
          <AppText variant="body" tone="muted">
            {session.email}
          </AppText>
        )}
      </View>

      <Pressable onPress={() => router.push("/wallet")}>
        <AppCard variant="elevated" style={styles.walletCard}>
          <AppText variant="caption" tone="muted">
            {t("wallet.balance")}
          </AppText>
          <AppText variant="display">
            {wallet ? formatMoney(wallet.balance, wallet.currency, locale) : "—"}
          </AppText>
        </AppCard>
      </Pressable>

      <AppCard style={styles.list}>
        <ListRow
          icon="bookmark-outline"
          label={t("passengerNav.savedPlaces")}
          onPress={() => router.push("/(tabs)/saved")}
        />
        <ListDivider />
        <ListRow
          icon="shield-outline"
          label={t("rideHistory.safety.trustedContactTitle")}
          onPress={() => router.push("/emergency-contacts")}
        />
        <ListDivider />
        <ListRow
          icon="notifications-outline"
          label={t("passengerNav.notifications")}
          onPress={() => router.push("/notifications")}
        />
        <ListDivider />
        <ListRow
          icon="settings-outline"
          label={t("passengerNav.settings")}
          onPress={() => router.push("/settings")}
        />
        <ListDivider />
        <ListRow
          icon="help-circle-outline"
          label={t("passengerNav.support")}
          onPress={() => router.push("/help")}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  header: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  walletCard: { gap: 4 },
  list: { gap: 0, paddingVertical: spacing.xs },
});
