import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "outline" | "danger";
  /** Shows a spinner in place of the label and forces `disabled` — for real async actions (accept/decline/advance/complete), never a fake local delay. */
  isLoading?: boolean;
}

const LABEL_STYLE_KEY: Record<
  NonNullable<AppButtonProps["variant"]>,
  "primaryLabel" | "outlineLabel" | "dangerLabel"
> = {
  primary: "primaryLabel",
  outline: "outlineLabel",
  danger: "dangerLabel",
};

const SPINNER_COLOR: Record<NonNullable<AppButtonProps["variant"]>, string> = {
  primary: colors.brandForeground,
  outline: colors.neutral900,
  danger: colors.brandForeground,
};

export function AppButton({
  label,
  variant = "primary",
  style,
  disabled,
  isLoading,
  ...props
}: AppButtonProps) {
  const isDisabled = Boolean(disabled) || Boolean(isLoading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        styles[variant],
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={SPINNER_COLOR[variant]} />
      ) : (
        <Text style={styles[LABEL_STYLE_KEY[variant]]}>{label}</Text>
      )}
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
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  primaryLabel: { color: colors.brandForeground, fontSize: 16, fontWeight: "600" },
  outlineLabel: { color: colors.neutral900, fontSize: 16, fontWeight: "600" },
  dangerLabel: { color: colors.brandForeground, fontSize: 16, fontWeight: "600" },
});
