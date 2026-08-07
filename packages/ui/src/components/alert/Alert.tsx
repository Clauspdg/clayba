import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";

import { Icon } from "../icon/Icon";
import type { IconName } from "../../tokens/icons";
import { cn } from "../../utils/cn";

/** Inline, persistent status banner (Sprint UI 1.0 — "Design System: Alerts"). Distinct from `Toast`, which auto-dismisses and floats above the page; an `Alert` lives inline in the page flow. */
export const alertVariants = cva("flex gap-3 rounded-lg border border-l-4 p-4", {
  variants: {
    tone: {
      neutral:
        "border-neutral-200 border-l-neutral-400 bg-neutral-50 dark:border-neutral-700 dark:border-l-neutral-500 dark:bg-neutral-900",
      brand:
        "border-brand-200 border-l-brand bg-brand-50 dark:border-brand-800 dark:border-l-brand dark:bg-brand-900",
      success:
        "border-green-200 border-l-success bg-green-50 dark:border-green-900 dark:border-l-success dark:bg-green-950",
      warning:
        "border-amber-200 border-l-warning bg-amber-50 dark:border-amber-900 dark:border-l-warning dark:bg-amber-950",
      danger:
        "border-red-200 border-l-danger bg-red-50 dark:border-red-900 dark:border-l-danger dark:bg-red-950",
    },
  },
  defaultVariants: { tone: "neutral" },
});

const toneIcon: Record<NonNullable<AlertProps["tone"]>, { name: IconName; className: string }> = {
  neutral: { name: "info", className: "text-neutral-500 dark:text-neutral-400" },
  brand: { name: "info", className: "text-brand" },
  success: { name: "checkCircle", className: "text-success" },
  warning: { name: "alertTriangle", className: "text-warning" },
  danger: { name: "alertCircle", className: "text-danger" },
};

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  icon?: ReactNode;
}

export function Alert({
  className,
  tone = "neutral",
  title,
  icon,
  children,
  ...props
}: AlertProps) {
  const resolvedTone = tone ?? "neutral";
  return (
    <div role="alert" className={cn(alertVariants({ tone }), className)} {...props}>
      {icon ?? (
        <Icon
          name={toneIcon[resolvedTone].name}
          size={18}
          className={cn("mt-0.5 shrink-0", toneIcon[resolvedTone].className)}
        />
      )}
      <div className="flex flex-col gap-0.5 text-sm">
        {title && <p className="font-semibold text-neutral-900 dark:text-neutral-50">{title}</p>}
        {children && <div className="text-neutral-700 dark:text-neutral-300">{children}</div>}
      </div>
    </div>
  );
}
