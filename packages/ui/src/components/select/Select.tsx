"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { useId } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  /** HOME-04 — optional extra classes for the trigger, merged in via `cn` (last wins). Omitting it keeps today's default sizing exactly. */
  className?: string;
}

export function Select({
  id,
  label,
  helperText,
  errorText,
  placeholder,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  className,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <FieldWrapper id={selectId} label={label} helperText={helperText} errorText={errorText}>
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectPrimitive.Trigger
          id={selectId}
          aria-invalid={Boolean(errorText) || undefined}
          aria-describedby={fieldDescribedBy(selectId, helperText, errorText)}
          className={cn(
            "duration-fast focus-visible:border-brand focus-visible:ring-brand/40 flex h-12 w-full items-center justify-between rounded-lg border bg-neutral-50 px-4 text-sm text-neutral-900 transition-colors focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-50",
            errorText
              ? "border-danger focus-visible:border-danger focus-visible:ring-danger/40"
              : "border-neutral-200 dark:border-neutral-700",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <Icon name="chevronDown" size={16} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="shadow-elevation3 z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700 dark:data-[highlighted]:bg-brand-900 dark:data-[highlighted]:text-brand-200 relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-neutral-900 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-neutral-50"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3">
                    <Icon name="check" size={14} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FieldWrapper>
  );
}
