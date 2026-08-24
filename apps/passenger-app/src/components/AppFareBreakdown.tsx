import { useTranslation } from "@the-ride/hooks";
import type { FareBreakdown } from "@the-ride/types";
import { StyleSheet, View } from "react-native";

import { formatMoney } from "@/lib/currency";
import { usePalette } from "@/theme/usePalette";
import { spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export interface AppFareBreakdownProps {
  breakdown: FareBreakdown;
  labels: {
    baseFare: string;
    distanceFare: string;
    timeFare: string;
    bookingFee: string;
    serviceFee: string;
    total: string;
  };
}

/** Itemized fare list on the Confirm Booking screen. */
export function AppFareBreakdown({ breakdown, labels }: AppFareBreakdownProps) {
  const palette = usePalette();
  const { locale } = useTranslation();
  const rows: Array<[string, number]> = [
    [labels.baseFare, breakdown.baseFare],
    [labels.distanceFare, breakdown.distanceFare],
    [labels.timeFare, breakdown.timeFare],
    [labels.bookingFee, breakdown.bookingFee],
    [labels.serviceFee, breakdown.serviceFee],
  ];

  return (
    <View style={styles.container}>
      {rows.map(([label, amount]) => (
        <View key={label} style={styles.row}>
          <AppText variant="caption" tone="muted">
            {label}
          </AppText>
          <AppText variant="body">{formatMoney(amount, breakdown.currency, locale)}</AppText>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow, { borderTopColor: palette.border }]}>
        <AppText variant="subheading">{labels.total}</AppText>
        <AppText variant="subheading">
          {formatMoney(breakdown.total, breakdown.currency, locale)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between" },
  totalRow: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1 },
});
