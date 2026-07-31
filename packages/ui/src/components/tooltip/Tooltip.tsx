"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../../utils/cn";

export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["side"];
}

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-50 shadow-elevation2 data-[state=delayed-open]:animate-fade-in dark:bg-neutral-100 dark:text-neutral-900",
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-neutral-900 dark:fill-neutral-100" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
