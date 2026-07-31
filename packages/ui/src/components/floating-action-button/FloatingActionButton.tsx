import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "../../utils/cn";

export interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon-only FAB has no visible text. */
  label: string;
  children: ReactNode;
}

export const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(({ className, label, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    className={cn(
      "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-elevation3 transition-transform duration-fast hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-95",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
FloatingActionButton.displayName = "FloatingActionButton";
