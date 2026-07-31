import { brand } from "../../tokens/colors";

export interface LogoProps {
  size?: number;
  /** Renders the wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
}

/**
 * Placeholder brand mark (Part 10, "Branding") — a simple geometric
 * chevron-in-a-rounded-square suggesting forward motion, in the brand
 * color. Swap for a designed mark when one exists; every consumer already
 * goes through this one component, so that's a one-file change.
 */
export function Logo({ size = 32, withWordmark = false, className }: LogoProps) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" role="img" aria-label="The Ride">
        <rect width="32" height="32" rx="9" fill={brand.DEFAULT} />
        <path d="M11 21L17 16L11 11" stroke={brand.foreground} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 21L24 16L18 11" stroke={brand.foreground} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </svg>
      {withWordmark && (
        <span style={{ fontWeight: 700, fontSize: size * 0.55, color: "currentColor", letterSpacing: "-0.02em" }}>The Ride</span>
      )}
    </span>
  );
}
