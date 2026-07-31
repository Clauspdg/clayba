"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useId, type ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils/cn";

export interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
}

export function Switch({ className, id, label, ...props }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2">
      <SwitchPrimitive.Root
        id={switchId}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full bg-neutral-300 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand dark:bg-neutral-700",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-fast data-[state=checked]:translate-x-[22px]" />
      </SwitchPrimitive.Root>
      {label && (
        <LabelPrimitive.Root htmlFor={switchId} className="text-sm text-neutral-900 dark:text-neutral-50">
          {label}
        </LabelPrimitive.Root>
      )}
    </div>
  );
}
