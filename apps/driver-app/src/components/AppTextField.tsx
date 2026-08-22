import { View, TextInput, Text, StyleSheet, type TextInputProps } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { colors, radius, spacing } from "@/theme/tokens";

export interface AppTextFieldProps extends TextInputProps {
  label: string;
  errorText?: string;
}

export function AppTextField({ label, errorText, style, ...props }: AppTextFieldProps) {
  const palette = usePalette();
  const borderColor = errorText ? palette.danger : palette.border;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.neutral400}
        style={[
          styles.input,
          { backgroundColor: palette.surfaceElevated, borderColor, color: palette.textPrimary },
          style,
        ]}
        accessibilityLabel={label}
        {...props}
      />
      {errorText && <Text style={[styles.error, { color: palette.danger }]}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  error: { fontSize: 12 },
});
