import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "@the-ride/config/tailwind/base";

/**
 * Sprint 6 ("Refonte complète du site public") — the public website's own
 * premium palette, scoped to `apps/web` ONLY via a deep merge on top of
 * the shared `baseTailwindConfig`. Deliberately NOT edited in
 * `packages/config/tailwind/base.ts` (shared with `apps/admin`) — this
 * sprint's brief is explicit that the admin dashboard must stay untouched,
 * so the override lives here instead of in the shared source of truth.
 */
const websiteBrand = {
  50: "#FDF0E9",
  100: "#FADDC9",
  200: "#F5C09A",
  300: "#EFA06D",
  400: "#EB8550",
  500: "#E86A2F",
  600: "#C85B2A",
  700: "#A34823",
  800: "#7D371B",
  900: "#582712",
  DEFAULT: "#E86A2F",
  foreground: "#FFFFFF",
};

const websiteNeutral = {
  0: "#FFFFFF",
  50: "#F8F8F8",
  100: "#F0F0F0",
  200: "#E0E0E0",
  300: "#C7C7C7",
  400: "#9E9E9E",
  500: "#5E5E5E",
  600: "#464646",
  700: "#363636",
  800: "#2A2A2A",
  900: "#232323",
  950: "#171717",
};

const config: Config = {
  ...baseTailwindConfig,
  theme: {
    ...baseTailwindConfig.theme,
    extend: {
      ...baseTailwindConfig.theme?.extend,
      colors: {
        ...(baseTailwindConfig.theme?.extend as { colors?: Record<string, unknown> } | undefined)
          ?.colors,
        brand: websiteBrand,
        neutral: websiteNeutral,
      },
      keyframes: {
        ...(baseTailwindConfig.theme?.extend as { keyframes?: Record<string, unknown> } | undefined)
          ?.keyframes,
        // Sprint 7 — slow ambient drift for the Hero's animated background dot-grid.
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-14px, 10px)" },
        },
      },
      animation: {
        ...(baseTailwindConfig.theme?.extend as { animation?: Record<string, unknown> } | undefined)
          ?.animation,
        drift: "drift 22s ease-in-out infinite",
      },
    },
  },
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
} as Config;

export default config;
