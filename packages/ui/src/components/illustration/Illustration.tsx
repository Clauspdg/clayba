import { brand, neutral } from "../../tokens/colors";

export type IllustrationName = "empty" | "error" | "success";

export interface IllustrationProps {
  name: IllustrationName;
  size?: number;
  className?: string;
}

/**
 * Minimal placeholder illustrations (Part 10, "Branding") for empty/error/
 * success states — simple geometric line art in the brand palette rather
 * than commissioned artwork. Swap the `<svg>` bodies below for real
 * illustrations later; every EmptyState/ErrorState consumer already goes
 * through this one component.
 */
export function Illustration({ name, size = 96, className }: IllustrationProps) {
  const common = { width: size, height: size, viewBox: "0 0 96 96", fill: "none", "aria-hidden": true } as const;

  if (name === "error") {
    return (
      <svg {...common} className={className}>
        <circle cx="48" cy="48" r="40" fill="#FEE2E2" />
        <path d="M48 30v22" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
        <circle cx="48" cy="62" r="2.5" fill="#DC2626" />
      </svg>
    );
  }

  if (name === "success") {
    return (
      <svg {...common} className={className}>
        <circle cx="48" cy="48" r="40" fill="#DCFCE7" />
        <path d="M34 48l10 10 18-20" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg {...common} className={className}>
      <circle cx="48" cy="48" r="40" fill={neutral[100]} />
      <rect x="28" y="36" width="40" height="28" rx="4" fill={neutral[0]} stroke={neutral[300]} strokeWidth="2" />
      <path d="M28 46h40" stroke={neutral[300]} strokeWidth="2" />
      <circle cx="48" cy="55" r="4" fill={brand.DEFAULT} opacity="0.5" />
    </svg>
  );
}
