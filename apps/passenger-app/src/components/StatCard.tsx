import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/tokens";

import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

export function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  /** Small positive/negative trend label, e.g. "+12%" — omitted entirely when there's no real trend to show. */
  delta?: string;
}) {
  return (
    <AppCard style={styles.card}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View style={styles.valueRow}>
        <AppText variant="subheading">{value}</AppText>
        {delta && (
          <AppText variant="caption" tone="success">
            {delta}
          </AppText>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 4, padding: spacing.md },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs },
});
