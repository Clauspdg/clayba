import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

/** Shared base for Badge (status pill), Chip (dismissible/interactive), and Tag (categorization) — see docs/design-system.md. */
export const pillVariants = cva("inline-flex items-center gap-1 rounded-full font-medium", {
  variants: {
    tone: {
      neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
      brand: "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
      success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
    size: {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    },
  },
  defaultVariants: { tone: "neutral", size: "sm" },
});

export interface PillProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pillVariants> {}

export function Pill({ className, tone, size, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone, size }), className)} {...props} />;
}
