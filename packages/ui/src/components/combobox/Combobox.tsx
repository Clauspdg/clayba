"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useId, useMemo, useState, type KeyboardEvent } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function Combobox({
  id,
  label,
  helperText,
  errorText,
  placeholder,
  searchPlaceholder,
  noResultsText,
  options,
  value,
  onChange,
  disabled,
}: ComboboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())), [options, query]);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      selectOption(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

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
            "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-left text-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-50",
            errorText ? "border-danger" : "border-neutral-300 dark:border-neutral-700",
            !selectedLabel && "text-neutral-400 dark:text-neutral-500",
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <Icon name="chevronsUpDown" size={16} className="ml-2 shrink-0 text-neutral-400" />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={4}
            align="start"
            className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-elevation3 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <input
              autoFocus
              role="combobox"
              aria-expanded={open}
              aria-controls={`${fieldId}-listbox`}
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full border-b border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
            />
            <ul id={`${fieldId}-listbox`} role="listbox" className="max-h-60 overflow-auto p-1">
              {filtered.length === 0 && <li className="px-3 py-2 text-sm text-neutral-500">{noResultsText}</li>}
              {filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-neutral-900 dark:text-neutral-50",
                    index === activeIndex && "bg-neutral-100 dark:bg-neutral-800",
                  )}
                >
                  {option.label}
                  {option.value === value && <Icon name="check" size={14} />}
                </li>
              ))}
            </ul>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </FieldWrapper>
  );
}
