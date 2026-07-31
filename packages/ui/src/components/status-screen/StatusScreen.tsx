import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

export interface StatusScreenProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Shared centered icon/title/description/action layout behind EmptyState, LoadingState, and ErrorState. */
export function StatusScreen({ icon, title, description, action, className }: StatusScreenProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      {icon && <div className="text-neutral-400 dark:text-neutral-500">{icon}</div>}
      <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      {action}
    </div>
  );
}
