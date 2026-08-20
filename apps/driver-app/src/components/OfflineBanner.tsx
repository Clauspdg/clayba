import { useTranslation } from "@the-ride/hooks";
import { StyleSheet, View } from "react-native";

import { useNetworkStatus } from "@/lib/network-status";
import { colors, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

/**
 * CLAYBA P2, section 27 — mounted once in the root layout so every screen
 * shows the real connectivity state without each screen re-implementing it.
 * Renders nothing while online; a critical-ride-state screen still checks
 * `useNetworkStatus()` itself before treating an action as successful.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <AppText variant="muted" style={styles.text}>
        {t("common.noInternetConnection")}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  text: { color: colors.neutral0 },
});
