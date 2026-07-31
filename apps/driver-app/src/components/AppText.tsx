import { useTheme } from "@the-ride/hooks";
import { Text, type TextProps } from "react-native";

import { colors } from "../theme/tokens";

export interface AppTextProps extends TextProps {
  variant?: "heading" | "subheading" | "body" | "muted";
}

const SIZE_BY_VARIANT: Record<NonNullable<AppTextProps["variant"]>, number> = {
  heading: 28,
  subheading: 18,
  body: 15,
  muted: 14,
};

const WEIGHT_BY_VARIANT: Record<NonNullable<AppTextProps["variant"]>, TextProps["style"]> = {
  heading: { fontWeight: "700" },
  subheading: { fontWeight: "600" },
  body: { fontWeight: "400" },
  muted: { fontWeight: "400" },
};

export function AppText({ variant = "body", style, ...props }: AppTextProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const color = variant === "muted" ? colors.neutral500 : isDark ? colors.neutral0 : colors.neutral900;

  return <Text style={[{ fontSize: SIZE_BY_VARIANT[variant], color }, WEIGHT_BY_VARIANT[variant], style]} {...props} />;
}
