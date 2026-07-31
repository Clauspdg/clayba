import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { FieldWrapper, fieldDescribedBy } from "../field/FieldWrapper";
import { inputVariants } from "../field/input-styles";
import { cn } from "../../utils/cn";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, helperText, errorText, required, className, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <FieldWrapper id={textareaId} label={label} helperText={helperText} errorText={errorText} required={required}>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={Boolean(errorText) || undefined}
          aria-describedby={fieldDescribedBy(textareaId, helperText, errorText)}
          className={cn(inputVariants({ invalid: Boolean(errorText) }), "resize-y", className)}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = "Textarea";
