import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { inputVariants } from "../field/input-styles";
import { cn } from "../../utils/cn";

export interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
}

/** Wraps the native `<input type="time">` — see DatePicker for the accessibility rationale. */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(({ id, label, helperText, errorText, required, className, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldWrapper id={inputId} label={label} helperText={helperText} errorText={errorText} required={required}>
      <input
        ref={ref}
        id={inputId}
        type="time"
        required={required}
        aria-invalid={Boolean(errorText) || undefined}
        aria-describedby={fieldDescribedBy(inputId, helperText, errorText)}
        className={cn(inputVariants({ invalid: Boolean(errorText) }), className)}
        {...props}
      />
    </FieldWrapper>
  );
});
TimePicker.displayName = "TimePicker";
