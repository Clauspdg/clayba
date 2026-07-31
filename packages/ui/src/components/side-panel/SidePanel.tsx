"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export const SidePanel = DialogPrimitive.Root;
export const SidePanelTrigger = DialogPrimitive.Trigger;
export const SidePanelClose = DialogPrimitive.Close;
export const SidePanelTitle = DialogPrimitive.Title;
export const SidePanelDescription = DialogPrimitive.Description;

const sidePanelContentVariants = cva("fixed z-50 border-neutral-200 bg-white p-6 shadow-elevation4 dark:border-neutral-800 dark:bg-neutral-900", {
  variants: {
    side: {
      left: "inset-y-0 left-0 h-full w-full max-w-sm border-r",
      right: "inset-y-0 right-0 h-full w-full max-w-sm border-l",
      bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t",
    },
  },
  defaultVariants: { side: "right" },
});

export interface SidePanelContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, VariantProps<typeof sidePanelContentVariants> {
  closeLabel: string;
}

/**
 * Shared implementation behind both `Sheet` (side-anchored) and `Drawer`
 * (bottom-anchored) — see docs/design-system.md, "no duplicated code".
 */
export function SidePanelContent({ className, side, children, closeLabel, ...props }: SidePanelContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content className={cn(sidePanelContentVariants({ side }), className)} {...props}>
        {children}
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
        >
          <Icon name="close" size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
