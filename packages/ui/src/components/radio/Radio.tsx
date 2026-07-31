"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useId, type ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils/cn";

export const RadioGroup = RadioGroupPrimitive.Root;

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label: string;
}

export function Radio({ className, id, label, value, ...props }: RadioProps) {
  const generatedId = useId();
  const radioId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2">
      <RadioGroupPrimitive.Item
        id={radioId}
        value={value}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand dark:border-neutral-600 dark:bg-neutral-900",
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="h-2.5 w-2.5 rounded-full bg-brand" />
      </RadioGroupPrimitive.Item>
      <LabelPrimitive.Root htmlFor={radioId} className="text-sm text-neutral-900 dark:text-neutral-50">
        {label}
      </LabelPrimitive.Root>
    </div>
  );
}

/** Convenience: renders a full `RadioGroup` from a flat list of options. */
export function RadioGroupField({
  options,
  name,
  ...props
}: { options: RadioOption[]; name?: string } & ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root name={name} className="flex flex-col gap-2" {...props}>
      {options.map((option) => (
        <Radio key={option.value} value={option.value} label={option.label} disabled={option.disabled} />
      ))}
    </RadioGroupPrimitive.Root>
  );
}
