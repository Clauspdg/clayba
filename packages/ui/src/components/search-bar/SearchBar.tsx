import { forwardRef, type InputHTMLAttributes } from "react";

import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Accessible name for the field (there's no visible label by design). */
  label: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ className, label, ...props }, ref) => (
  <div className="relative">
    <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
    <input
      ref={ref}
      type="search"
      aria-label={label}
      className={cn(
        "h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50",
        className,
      )}
      {...props}
    />
  </div>
));
SearchBar.displayName = "SearchBar";
