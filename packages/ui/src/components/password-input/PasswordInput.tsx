"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { inputVariants } from "../field/input-styles";
import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  /** Accessible name for the show/hide toggle when the password is hidden. */
  showPasswordLabel: string;
  /** Accessible name for the toggle when the password is currently visible. */
  hidePasswordLabel: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ id, label, helperText, errorText, required, className, showPasswordLabel, hidePasswordLabel, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = useState(false);

    return (
      <FieldWrapper id={inputId} label={label} helperText={helperText} errorText={errorText} required={required}>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            required={required}
            aria-invalid={Boolean(errorText) || undefined}
            aria-describedby={fieldDescribedBy(inputId, helperText, errorText)}
            className={cn(inputVariants({ invalid: Boolean(errorText) }), "pr-10", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <Icon name={visible ? "eyeOff" : "eye"} size={18} />
          </button>
        </div>
      </FieldWrapper>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
