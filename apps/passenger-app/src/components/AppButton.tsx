import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { buttonHeight, radius, spacing } from "@/theme/tokens";

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "md" | "lg";
  /** Shows a spinner in place of the label and forces `disabled` — for real async actions, never a fake local delay. */
  isLoading?: boolean;
}

export function AppButton({
  label,
  variant = "primary",
  size = "md",
  style,
  disabled,
  isLoading,
  ...props
}: AppButtonProps) {
  const palette = usePalette();
  const isDisabled = Boolean(disabled) || Boolean(isLoading);

  const variantStyle = {
    primary: { backgroundColor: palette.primary, borderWidth: 0 },
    outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: palette.border },
    ghost: { backgroundColor: "transparent", borderWidth: 0 },
    danger: { backgroundColor: palette.danger, borderWidth: 0 },
  }[variant];

  const labelColor = {
    primary: palette.primaryForeground,
    outline: palette.textPrimary,
    ghost: palette.textPrimary,
    danger: "#FFFFFF",
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        { height: buttonHeight[size] },
        variantStyle,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16, fontWeight: "600" },
});
