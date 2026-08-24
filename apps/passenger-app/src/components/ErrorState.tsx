import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/tokens";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <AppText variant="subheading" style={styles.centerText}>
        {title}
      </AppText>
      {message && (
        <AppText variant="body" tone="muted" style={styles.centerText}>
          {message}
        </AppText>
      )}
      {onRetry && retryLabel && (
        <AppButton
          label={retryLabel}
          variant="outline"
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  centerText: { textAlign: "center" },
  retryButton: { marginTop: spacing.sm, alignSelf: "center" },
});
