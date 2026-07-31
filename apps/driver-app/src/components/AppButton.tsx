import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "outline" | "danger";
}

const LABEL_STYLE_KEY: Record<NonNullable<AppButtonProps["variant"]>, "primaryLabel" | "outlineLabel" | "dangerLabel"> = {
  primary: "primaryLabel",
  outline: "outlineLabel",
  danger: "dangerLabel",
};

export function AppButton({ label, variant = "primary", style, disabled, ...props }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={(state) => [styles.base, styles[variant], state.pressed && styles.pressed, disabled && styles.disabled, typeof style === "function" ? style(state) : style]}
      {...props}
    >
      <Text style={styles[LABEL_STYLE_KEY[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.brand },
  outline: { borderWidth: 1, borderColor: colors.neutral200 },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  primaryLabel: { color: colors.brandForeground, fontSize: 16, fontWeight: "600" },
  outlineLabel: { color: colors.neutral900, fontSize: 16, fontWeight: "600" },
  dangerLabel: { color: colors.brandForeground, fontSize: 16, fontWeight: "600" },
});
