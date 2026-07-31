import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

const dotVariants = cva("inline-block h-2.5 w-2.5 rounded-full", {
  variants: {
    tone: {
      success: "bg-green-500",
      warning: "bg-amber-500",
      danger: "bg-red-500",
      neutral: "bg-neutral-400",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof dotVariants> {
  /** Visible text next to the dot, e.g. "Active", "Suspended". */
  label: string;
}

/** Shared dot-plus-label pattern behind both `StatusIndicator` and `OnlineIndicator`. */
export function StatusIndicator({ className, tone, label, ...props }: StatusIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300", className)} {...props}>
      <span className={dotVariants({ tone })} aria-hidden="true" />
      {label}
    </span>
  );
}
