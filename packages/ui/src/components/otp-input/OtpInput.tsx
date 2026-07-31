"use client";

import { useId, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { cn } from "../../utils/cn";

export interface OtpInputProps {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  /** @default 6 */
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ id, label, helperText, errorText, length = 6, value, onChange, disabled }: OtpInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length) - 1]?.focus();
  }

  return (
    <FieldWrapper id={inputId} label={label} helperText={helperText} errorText={errorText}>
      <div role="group" aria-labelledby={label ? inputId : undefined} aria-describedby={fieldDescribedBy(inputId, helperText, errorText)} className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={index === 0 ? inputId : undefined}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            aria-invalid={Boolean(errorText) || undefined}
            className={cn(
              "h-12 w-10 rounded-lg border bg-white text-center text-lg font-medium text-neutral-900 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-50",
              errorText ? "border-danger" : "border-neutral-300 dark:border-neutral-700",
            )}
          />
        ))}
      </div>
    </FieldWrapper>
  );
}
