import { View, StyleSheet, type ViewProps } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

export function AppCard({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.neutral0,
  },
});
