import type { FareBreakdown } from "@the-ride/types";
import { StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";
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

/** Itemized fare list on the Confirm Booking screen (Part 1: "View estimated fare"). */
export function AppFareBreakdown({ breakdown, labels }: AppFareBreakdownProps) {
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
          <AppText variant="muted">{label}</AppText>
          <AppText variant="body">
            {breakdown.currency} {amount.toFixed(2)}
          </AppText>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow]}>
        <AppText variant="subheading">{labels.total}</AppText>
        <AppText variant="subheading">
          {breakdown.currency} {breakdown.total.toFixed(2)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between" },
  totalRow: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.neutral200 },
});
