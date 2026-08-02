/**
 * Illustrated vehicle art (Sprint 7). No licensed vehicle photography is
 * available in this environment, so ride-class cards use a clean, brand-
 * colored side-view illustration instead of a real photo — disclosed here
 * rather than silently faked with an `<img>` pointed at a stock-photo URL.
 */
export function VehicleIllustration({
  tall = false,
  className,
}: {
  tall?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden="true">
      <ellipse cx="100" cy="86" rx="80" ry="7" fill="currentColor" opacity="0.08" />
      {tall ? (
        <path
          d="M35 78 L35 50 Q35 34 55 32 L70 30 Q80 18 105 18 L130 18 Q150 18 158 32 L165 32 Q178 34 178 50 L178 78 Z"
          fill="currentColor"
          opacity="0.9"
        />
      ) : (
        <path
          d="M20 76 L24 52 Q28 40 46 38 L64 24 Q72 18 88 18 L128 18 Q142 18 150 28 L162 38 Q178 40 180 54 L182 76 Z"
          fill="currentColor"
          opacity="0.9"
        />
      )}
      <path
        d={tall ? "M55 32 L58 48 L155 48 L158 32" : "M62 26 L70 42 L148 42 L150 30"}
        fill="white"
        opacity="0.35"
      />
      <circle cx="55" cy="80" r="14" fill="#1F1F1F" />
      <circle cx="55" cy="80" r="6" fill="#D9D9D9" />
      <circle cx="150" cy="80" r="14" fill="#1F1F1F" />
      <circle cx="150" cy="80" r="6" fill="#D9D9D9" />
    </svg>
  );
}
