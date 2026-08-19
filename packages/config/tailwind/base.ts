import type { Config } from "tailwindcss";

// Shared Tailwind design tokens for Clayba. Apps import and extend this
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
          50: "#FBEEE7",
          100: "#F6DAC9",
          200: "#EEBB9A",
          300: "#E4A34E",
          400: "#D97D3D",
          500: "#CB562C",
          600: "#B34823",
          700: "#93391C",
          800: "#742D16",
          900: "#542012",
          DEFAULT: "#CB562C",
          foreground: "#FFFFFF",
        },
        accent: {
          50: "#FAF4EC",
          100: "#F0E2CC",
          200: "#E4CBA3",
          300: "#D3AF7C",
          400: "#C5A17A",
          500: "#BA966E",
          600: "#9C7C59",
          700: "#7D6247",
          800: "#5E4A36",
          900: "#3F3124",
          DEFAULT: "#BA966E",
          foreground: "#2A2015",
        },
        neutral: {
          0: "#FFFFFF",
          50: "#FAF9F7",
          100: "#F3F1EE",
          200: "#E7E3DD",
          300: "#D3CCC2",
          400: "#A69C8E",
          500: "#7D7468",
          600: "#5F584D",
          700: "#56564E",
          800: "#3A372F",
          900: "#262420",
          950: "#171512",
        },
        success: { DEFAULT: "#16A34A", foreground: "#FFFFFF" },
        warning: { DEFAULT: "#D97706", foreground: "#FFFFFF" },
        danger: { DEFAULT: "#DC2626", foreground: "#FFFFFF" },
        info: { DEFAULT: "#0891B2", foreground: "#FFFFFF" },
      },
      fontFamily: {
        sans: [
          "var(--font-poppins)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        lg: "1rem", // 16px
        xl: "28px",
      },
      boxShadow: {
        elevation1: "0 2px 8px -2px rgb(38 36 32 / 0.06)",
        elevation2: "0 8px 24px -4px rgb(38 36 32 / 0.10), 0 2px 8px -2px rgb(38 36 32 / 0.06)",
        elevation3: "0 16px 40px -8px rgb(38 36 32 / 0.14), 0 4px 12px -4px rgb(38 36 32 / 0.08)",
        elevation4: "0 24px 64px -12px rgb(38 36 32 / 0.18), 0 8px 20px -8px rgb(38 36 32 / 0.10)",
      },
      transitionDuration: {
        fast: "120ms",
        normal: "200ms",
        slow: "320ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
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
