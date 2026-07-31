"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-elevation1 dark:text-neutral-400 dark:data-[state=active]:bg-neutral-900 dark:data-[state=active]:text-neutral-50",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 focus-visible:outline-none", className)} {...props} />;
}
