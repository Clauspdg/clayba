import { useAuth, useTranslation } from "@the-ride/hooks";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { spacing } from "@/theme/tokens";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

/** Real session fields only (name, email) — no fabricated phone/address; Firebase Auth doesn't collect those for this app today. */
export default function PersonalInfoScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();

  return (
    <Screen style={styles.container}>
      <AppText variant="title">{t("profile.personalInfo")}</AppText>
      <AppCard style={styles.card}>
        <Row label={t("auth.fullNameLabel")} value={session?.displayName ?? "—"} />
        <Row label={t("auth.emailLabel")} value={session?.email ?? "—"} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.md },
  row: { gap: 2 },
});
