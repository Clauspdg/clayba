import { View, TextInput, StyleSheet, type TextInputProps } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export interface AppTextFieldProps extends TextInputProps {
  label: string;
  errorText?: string;
}

export function AppTextField({ label, errorText, style, ...props }: AppTextFieldProps) {
  const palette = usePalette();
  return (
    <View style={styles.container}>
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          { borderColor: errorText ? palette.danger : palette.border, color: palette.textPrimary },
          style,
        ]}
        accessibilityLabel={label}
        {...props}
      />
      {errorText && (
        <AppText variant="caption" tone="danger">
          {errorText}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontWeight: "500" },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
});
