import type { Config } from "tailwindcss";

// Shared Tailwind design tokens for The Ride. Apps import and extend this
// base config rather than redefining the design system per app.
//
// IMPORTANT: the `colors` values below must mirror
// `packages/ui/src/tokens/colors.ts` exactly — that file is the actual
// source of truth (consumed directly by JS/React Native code), this is
// Tailwind's CSS-generation-time mirror of the same palette (Tailwind
// config can't import a workspace package without risking a dependency
// cycle with `@the-ride/ui`, which depends on `@the-ride/config` for its
// own lint/tsconfig). See docs/theme.md.
export const baseTailwindConfig: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#0F62FE",
          600: "#0D55DB",
          700: "#0A44AF",
          800: "#083585",
          900: "#06265F",
          DEFAULT: "#0F62FE",
          foreground: "#FFFFFF",
        },
        neutral: {
          0: "#FFFFFF",
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#030712",
        },
        success: { DEFAULT: "#16A34A", foreground: "#FFFFFF" },
        warning: { DEFAULT: "#D97706", foreground: "#FFFFFF" },
        danger: { DEFAULT: "#DC2626", foreground: "#FFFFFF" },
        info: { DEFAULT: "#0891B2", foreground: "#FFFFFF" },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        lg: "0.75rem", // 12px — unchanged from Sprint 0
        xl: "24px",
      },
      boxShadow: {
        elevation1: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        elevation2: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        elevation3: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        elevation4: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
      transitionDuration: {
        fast: "120ms",
        normal: "200ms",
        slow: "320ms",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
      screens: {
        // Mirrors packages/utils/src/responsive/breakpoints.ts (BREAKPOINTS)
        tablet: "640px",
        laptop: "1024px",
        desktop: "1280px",
      },
    },
  },
  plugins: [],
};

export default baseTailwindConfig;
