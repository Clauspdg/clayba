import * as LabelPrimitive from "@radix-ui/react-label";
import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

export interface FieldWrapperProps {
  id: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Shared label/helper/error layout used by every form field component —
 * see docs/design-system.md. The input element itself (passed as
 * `children`) is responsible for setting its own `aria-describedby` to
 * `${id}-error` / `${id}-helper` to match the ids rendered here — see
 * `useFieldDescribedBy` below.
 */
export function FieldWrapper({ id, label, helperText, errorText, required, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <LabelPrimitive.Root htmlFor={id} className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </LabelPrimitive.Root>
      )}
      {children}
      {helperText && !errorText && (
        <p id={`${id}-helper`} className="text-xs text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
      {errorText && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {errorText}
        </p>
      )}
    </div>
  );
}

/** The id an input inside a `FieldWrapper` should put in its own `aria-describedby`. */
export function fieldDescribedBy(id: string, helperText?: string, errorText?: string): string | undefined {
  if (errorText) return `${id}-error`;
  if (helperText) return `${id}-helper`;
  return undefined;
}
