import { resolveBuildInfo } from "@the-ride/types";
import { useTranslation } from "@the-ride/hooks";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { spacing } from "@/theme/tokens";

/**
 * About / Build Info (Sprint 4.6, Part 7) — same shape as the driver app's
 * `about.tsx`; both native apps display identical fields, sourced from the
 * same `@the-ride/types` version module (see docs/versioning.md).
 */
const buildInfo = resolveBuildInfo({
  environment: process.env.EXPO_PUBLIC_APP_ENV,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  commit: process.env.EXPO_PUBLIC_BUILD_COMMIT,
  buildDate: process.env.EXPO_PUBLIC_BUILD_DATE,
});

export default function AboutScreen() {
  const { t } = useTranslation();

  const rows: Array<[string, string]> = [
    [t("about.version"), buildInfo.version],
    [t("about.sprint"), buildInfo.sprint],
    [t("about.environment"), buildInfo.environment],
    [t("about.firebaseProject"), buildInfo.firebaseProjectId],
    [t("about.commit"), buildInfo.commit],
    [t("about.buildDate"), buildInfo.buildDate],
  ];

  return (
    <Screen>
      <AppText variant="heading">{t("about.title")}</AppText>
      <AppCard style={styles.card}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <AppText variant="muted">{label}</AppText>
            <AppText variant="body">{value}</AppText>
          </View>
        ))}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
