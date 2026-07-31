import { View, TextInput, Text, StyleSheet, type TextInputProps } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

export interface AppTextFieldProps extends TextInputProps {
  label: string;
  errorText?: string;
}

export function AppTextField({ label, errorText, style, ...props }: AppTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.neutral400}
        style={[styles.input, errorText ? styles.inputError : null, style]}
        accessibilityLabel={label}
        {...props}
      />
      {errorText && <Text style={styles.error}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: "500", color: colors.neutral900 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.neutral900,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 12, color: colors.danger },
});
