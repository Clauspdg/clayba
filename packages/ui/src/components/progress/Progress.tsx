"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils/cn";

export interface ProgressProps extends ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number;
  /** Accessible label, e.g. "Upload progress". */
  label: string;
}

export function Progress({ className, value, label, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      value={value}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-brand transition-transform duration-normal"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
