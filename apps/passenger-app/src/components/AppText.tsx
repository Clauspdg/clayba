import { Text, type TextProps } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { typography } from "@/theme/tokens";

export interface AppTextProps extends TextProps {
  variant?: "display" | "title" | "heading" | "subheading" | "body" | "caption" | "muted";
  tone?: "default" | "secondary" | "muted" | "danger" | "success" | "warning" | "brand";
}

const SIZE_BY_VARIANT: Record<NonNullable<AppTextProps["variant"]>, number> = {
  display: typography.displaySize,
  title: typography.titleSize,
  heading: typography.headingSize,
  subheading: typography.subheadingSize,
  body: typography.bodySize,
  caption: typography.captionSize,
  muted: typography.bodySize,
};

const WEIGHT_BY_VARIANT: Record<NonNullable<AppTextProps["variant"]>, TextProps["style"]> = {
  display: { fontWeight: "800" },
  title: { fontWeight: "800" },
  heading: { fontWeight: "700" },
  subheading: { fontWeight: "600" },
  body: { fontWeight: "400" },
  caption: { fontWeight: "500" },
  muted: { fontWeight: "400" },
};

export function AppText({ variant = "body", tone, style, ...props }: AppTextProps) {
  const palette = usePalette();
  // `variant="muted"` is kept as a shorthand for `tone="muted"` (existing
  // call sites all over this app already use it) so this refactor doesn't
  // require touching every screen just to keep the same visual result.
  const resolvedTone = tone ?? (variant === "muted" ? "muted" : "default");
  const colorByTone: Record<NonNullable<AppTextProps["tone"]>, string> = {
    default: palette.textPrimary,
    secondary: palette.textSecondary,
    muted: palette.textMuted,
    danger: palette.danger,
    success: palette.success,
    warning: palette.warning,
    brand: palette.primary,
  };

  return (
    <Text
      style={[
        { fontSize: SIZE_BY_VARIANT[variant], color: colorByTone[resolvedTone] },
        WEIGHT_BY_VARIANT[variant],
        style,
      ]}
      {...props}
    />
  );
}
