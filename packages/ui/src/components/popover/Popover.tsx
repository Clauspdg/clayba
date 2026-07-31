"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({ className, sideOffset = 6, ...props }: ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-lg border border-neutral-200 bg-white p-4 shadow-elevation3 data-[state=open]:animate-fade-in dark:border-neutral-700 dark:bg-neutral-900",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
