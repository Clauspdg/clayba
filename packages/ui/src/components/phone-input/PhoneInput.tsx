import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { inputVariants } from "../field/input-styles";
import { cn } from "../../utils/cn";

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  /** Static country calling code prefix, e.g. "+1". A full country picker is out of scope for this sprint. */
  countryCode?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ id, label, helperText, errorText, required, className, countryCode = "+1", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <FieldWrapper id={inputId} label={label} helperText={helperText} errorText={errorText} required={required}>
        <div className="flex items-stretch">
          <span className="flex select-none items-center rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {countryCode}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required={required}
            aria-invalid={Boolean(errorText) || undefined}
            aria-describedby={fieldDescribedBy(inputId, helperText, errorText)}
            className={cn(inputVariants({ invalid: Boolean(errorText) }), "rounded-l-none", className)}
            {...props}
          />
        </div>
      </FieldWrapper>
    );
  },
);
PhoneInput.displayName = "PhoneInput";
