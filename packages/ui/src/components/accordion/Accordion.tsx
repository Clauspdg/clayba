"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type { ComponentPropsWithoutRef } from "react";

import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b border-neutral-200 dark:border-neutral-800", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-left text-sm font-medium text-neutral-900 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&[data-state=open]>svg]:rotate-180 dark:text-neutral-50",
          className,
        )}
        {...props}
      >
        {children}
        <Icon name="chevronDown" size={16} className="shrink-0 transition-transform duration-normal" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden text-sm text-neutral-600 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down dark:text-neutral-300"
      {...props}
    >
      <div className={cn("pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
