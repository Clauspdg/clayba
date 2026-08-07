import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "outline";
}

export function AppButton({
  label,
  variant = "primary",
  style,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={variant === "primary" ? styles.primaryLabel : styles.outlineLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.brand },
  outline: { borderWidth: 1, borderColor: colors.neutral200 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  primaryLabel: { color: colors.brandForeground, fontSize: 16, fontWeight: "600" },
  outlineLabel: { color: colors.neutral900, fontSize: 16, fontWeight: "600" },
});
