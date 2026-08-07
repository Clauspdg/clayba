import { cva } from "class-variance-authority";

/** Shared visual style for every text-entry field (Input, Textarea, PasswordInput, PhoneInput, OtpInput cell). */
export const inputVariants = cva(
  "w-full rounded-lg border bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-fast focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500 dark:focus-visible:bg-neutral-900",
  {
    variants: {
      invalid: {
        true: "border-danger focus-visible:border-danger focus-visible:ring-danger/40",
        false: "border-neutral-200 dark:border-neutral-700",
      },
    },
    defaultVariants: { invalid: false },
  },
);
