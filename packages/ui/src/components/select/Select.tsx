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
}

export function Select({ id, label, helperText, errorText, placeholder, options, value, defaultValue, onValueChange, disabled, name }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <FieldWrapper id={selectId} label={label} helperText={helperText} errorText={errorText}>
      <SelectPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name}>
        <SelectPrimitive.Trigger
          id={selectId}
          aria-invalid={Boolean(errorText) || undefined}
          aria-describedby={fieldDescribedBy(selectId, helperText, errorText)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm text-neutral-900 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-50",
            errorText ? "border-danger" : "border-neutral-300 dark:border-neutral-700",
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
            className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-elevation3 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-neutral-900 outline-none data-[highlighted]:bg-neutral-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-neutral-50 dark:data-[highlighted]:bg-neutral-800"
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
