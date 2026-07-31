import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { inputVariants } from "../field/input-styles";
import { cn } from "../../utils/cn";

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
}

/**
 * Wraps the native `<input type="date">` rather than a custom calendar
 * grid: it ships full keyboard/screen-reader support for free and adapts
 * to the user's OS locale/date format automatically — a better
 * accessibility outcome than a bespoke widget built under this sprint's
 * scope. See docs/design-system.md.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({ id, label, helperText, errorText, required, className, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldWrapper id={inputId} label={label} helperText={helperText} errorText={errorText} required={required}>
      <input
        ref={ref}
        id={inputId}
        type="date"
        required={required}
        aria-invalid={Boolean(errorText) || undefined}
        aria-describedby={fieldDescribedBy(inputId, helperText, errorText)}
        className={cn(inputVariants({ invalid: Boolean(errorText) }), className)}
        {...props}
      />
    </FieldWrapper>
  );
});
DatePicker.displayName = "DatePicker";
