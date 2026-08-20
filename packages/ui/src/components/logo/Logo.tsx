export interface LogoProps {
  size?: number;
  /** Renders the wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
}

/**
 * CLAYBA brand assets integration — the approved symbol (an orange/
 * terracotta "C" with dual route/path + origin/destination endpoints),
 * replacing the Part 10 placeholder chevron-in-a-square. Rendered as a
 * raster `<img>`, not inline SVG: the source reference assets are raster
 * (see assets/brand/reference/README.txt), and per that README's explicit
 * instruction, the symbol is not to be auto-vectorized/redrawn into a new
 * SVG as part of this migration — a real geometric master SVG is called
 * out there as a separate, future step. `/brand/clayba-symbol.png` must
 * exist in the consuming app's own `public/` directory (already copied
 * into both `apps/web` and `apps/admin`, the only two consumers).
 */
export function Logo({ size = 32, withWordmark = false, className }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 }}
    >
      <img
        src="/brand/clayba-symbol.png"
        alt=""
        width={size}
        height={size}
        role="img"
        aria-label="Clayba"
      />
      {withWordmark && (
        <span
          style={{
            fontWeight: 700,
            fontSize: size * 0.55,
            color: "currentColor",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          Clayba
        </span>
      )}
    </span>
  );
}
