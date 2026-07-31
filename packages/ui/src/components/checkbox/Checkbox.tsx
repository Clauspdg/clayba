"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as LabelPrimitive from "@radix-ui/react-label";
import { forwardRef, useId, type ComponentPropsWithoutRef, type ElementRef } from "react";

import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  errorText?: string;
}

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, id, label, errorText, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CheckboxPrimitive.Root
            ref={ref}
            id={checkboxId}
            aria-invalid={Boolean(errorText) || undefined}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand data-[state=checked]:bg-brand dark:border-neutral-600 dark:bg-neutral-900",
              errorText && "border-danger",
              className,
            )}
            {...props}
          >
            <CheckboxPrimitive.Indicator className="text-brand-foreground">
              <Icon name="check" size={14} strokeWidth={2.5} />
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>
          {label && (
            <LabelPrimitive.Root htmlFor={checkboxId} className="text-sm text-neutral-900 dark:text-neutral-50">
              {label}
            </LabelPrimitive.Root>
          )}
        </div>
        {errorText && (
          <p role="alert" className="text-xs text-danger">
            {errorText}
          </p>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
