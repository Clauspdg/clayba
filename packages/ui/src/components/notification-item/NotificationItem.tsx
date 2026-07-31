import type { IconName } from "../../tokens/icons";
import { Icon } from "../icon/Icon";
import { cn } from "../../utils/cn";

export interface NotificationItemProps {
  icon?: IconName;
  title: string;
  description?: string;
  timestamp?: string;
  isRead?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NotificationItem({ icon = "bell", title, description, timestamp, isRead = true, onClick, className }: NotificationItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
        onClick && "hover:bg-neutral-50 dark:hover:bg-neutral-900",
        !isRead && "bg-brand-50/50 dark:bg-brand-900/20",
        className,
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
        <Icon name={icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-50">{title}</span>
        {description && <span className="mt-0.5 block truncate text-sm text-neutral-500 dark:text-neutral-400">{description}</span>}
        {timestamp && <span className="mt-1 block text-xs text-neutral-400 dark:text-neutral-500">{timestamp}</span>}
      </span>
      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />}
    </Component>
  );
}
