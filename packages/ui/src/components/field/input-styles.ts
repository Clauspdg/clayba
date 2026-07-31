import { cva } from "class-variance-authority";

/** Shared visual style for every text-entry field (Input, Textarea, PasswordInput, PhoneInput, OtpInput cell). */
export const inputVariants = cva(
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500",
  {
    variants: {
      invalid: {
        true: "border-danger focus-visible:ring-danger",
        false: "border-neutral-300 dark:border-neutral-700",
      },
    },
    defaultVariants: { invalid: false },
  },
);
