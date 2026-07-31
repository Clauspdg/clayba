"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useId, useState } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function MultiSelect({ id, label, helperText, errorText, placeholder, options, value, onChange, disabled }: MultiSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [open, setOpen] = useState(false);

  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  }

  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);

  return (
    <FieldWrapper id={fieldId} label={label} helperText={helperText} errorText={errorText}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          id={fieldId}
          type="button"
          disabled={disabled}
          aria-invalid={Boolean(errorText) || undefined}
          aria-describedby={fieldDescribedBy(fieldId, helperText, errorText)}
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900",
            errorText ? "border-danger" : "border-neutral-300 dark:border-neutral-700",
            selectedLabels.length === 0 && "text-neutral-400 dark:text-neutral-500",
          )}
        >
          {selectedLabels.length > 0 ? (
            selectedLabels.map((selectedLabel) => (
              <span key={selectedLabel} className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                {selectedLabel}
              </span>
            ))
          ) : (
            <span>{placeholder}</span>
          )}
          <Icon name="chevronDown" size={16} className="ml-auto shrink-0 text-neutral-400" />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={4}
            align="start"
            className="z-50 max-h-72 w-[var(--radix-popover-trigger-width)] overflow-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-elevation3 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {options.map((option) => {
              const checked = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:text-neutral-50 dark:hover:bg-neutral-800"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600",
                      checked && "border-brand bg-brand text-brand-foreground",
                    )}
                  >
                    {checked && <Icon name="check" size={12} strokeWidth={3} />}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </FieldWrapper>
  );
}
